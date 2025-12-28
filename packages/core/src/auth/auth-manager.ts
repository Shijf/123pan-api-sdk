/**
 * 认证管理器 - 负责获取和管理access token
 */

import axios, { AxiosInstance } from 'axios';
import { Logger, createModuleLogger, LogLevel } from '../logger';
import type { SdkConfig, AccessTokenResponse, TokenInfo, ApiError } from '../types';

export class AuthManager {
  private clientID: string;
  private clientSecret: string;
  private baseURL: string;
  private timeout: number;
  private tokenInfo: TokenInfo | null = null;
  private httpClient: AxiosInstance;
  private tokenRefreshPromise: Promise<TokenInfo> | null = null;
  private logger: Logger;
  private config: SdkConfig;

  constructor(config: SdkConfig) {
    this.config = config;
    this.clientID = config.clientID;
    this.clientSecret = config.clientSecret;
    this.baseURL = config.baseURL || 'https://open-api.123pan.com';
    this.timeout = config.timeout || 30000;

    // 初始化日志器
    const loggerConfig = config.loggerConfig || {};
    const logLevel = loggerConfig.level ? LogLevel[loggerConfig.level] : (config.debug ? LogLevel.DEBUG : LogLevel.INFO);
    
    this.logger = createModuleLogger('AuthManager', {
      level: logLevel,
      enableConsole: loggerConfig.enableConsole !== false,
      enableRemote: loggerConfig.enableRemote || false,
      ...(loggerConfig.remoteEndpoint && { remoteEndpoint: loggerConfig.remoteEndpoint }),
      colors: loggerConfig.colors !== false,
      maxEntries: loggerConfig.maxEntries || 1000,
    });

    this.httpClient = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'User-Agent': '123pan-api-sdk',
        'Content-Type': 'application/json',
        'platform': 'open_platform', // 添加平台字段
      },
    });

    this.setupInterceptors();

    // 如果在debug模式下提供了预设token，直接使用
    if (config.debug && config.debugToken) {
      this.setDebugToken(config.debugToken);
      this.logger.info('Using debug token instead of API authentication');
    } else {
      /** 初始化时，拿一下 token */
      this.forceRefreshToken();
    }
  }

  private setupInterceptors(): void {
    this.httpClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.data) {
          const apiError: ApiError = {
            code: error.response.data.code || error.response.status,
            message: error.response.data.message || error.message,
            details: error.response.data,
          };
          throw apiError;
        }
        throw error;
      }
    );
  }

  /**
   * 获取访问令牌
   */
  async getAccessToken(): Promise<string> {
    // 如果使用debug token且有效，直接返回
    if (this.isUsingDebugToken() && this.tokenInfo && this.isTokenValid()) {
      this.logger.debug('Using debug token');
      return this.tokenInfo.accessToken;
    }

    // 如果token存在且未过期，直接返回
    if (this.tokenInfo && this.isTokenValid()) {
      this.logger.debug('Using existing valid access token');
      return this.tokenInfo.accessToken;
    }

    // 如果使用debug token但已过期，警告用户
    if (this.isUsingDebugToken()) {
      this.logger.warn('Debug token has expired, please update debugToken in config');
      throw new Error('Debug token has expired');
    }

    // 如果正在刷新token，等待刷新完成
    if (this.tokenRefreshPromise) {
      this.logger.debug('Token refresh in progress, waiting for completion');
      const tokenInfo = await this.tokenRefreshPromise;
      return tokenInfo.accessToken;
    }

    // 刷新token
    this.logger.info('Refreshing access token');
    this.tokenRefreshPromise = this.refreshToken();
    
    try {
      const tokenInfo = await this.tokenRefreshPromise;
      this.logger.info('Access token refreshed successfully');
      return tokenInfo.accessToken;
    } catch (error) {
      this.logger.error('Failed to refresh access token', error as Error);
      throw error;
    } finally {
      this.tokenRefreshPromise = null;
    }
  }

  /**
   * 刷新访问令牌
   */
  private async refreshToken(): Promise<TokenInfo> {
    try {
      this.logger.debug('Requesting new access token from API');
      const response = await this.httpClient.post<AccessTokenResponse>(
        '/api/v1/access_token',
        {
          clientID: this.clientID,
          clientSecret: this.clientSecret,
        }
      );

      this.logger.debug('Token API response received', {
        status: response.status,
        data: response.data
      });

      // 检查API响应格式
      if (!response.data) {
        throw new Error('Invalid API response: missing data field');
      }

      let tokenData;
      const responseData = response.data;

      // 只支持包装格式：{code, message, data, x-traceID}
      if (typeof responseData.code === 'undefined') {
        throw new Error('Invalid token response: missing code field (expected wrapped format)');
      }

      this.logger.debug('Processing wrapped API response format');
      
      if (responseData.code !== 0) {
        const errorMessage = responseData.message || 'Unknown API error';
        const traceId = responseData['x-traceID'] || 'unknown';
        
        this.logger.error('Token API returned error', new Error(errorMessage), {
          code: responseData.code,
          message: errorMessage,
          traceId: traceId,
          data: responseData.data
        });
        
        throw new Error(`Token API error (code: ${responseData.code}): ${errorMessage} [TraceID: ${traceId}]`);
      }

      // 验证成功响应的数据结构
      if (!responseData.data || !responseData.data.accessToken) {
        throw new Error('Invalid token response: missing accessToken in data field');
      }

      tokenData = responseData.data;

      // 使用驼峰格式字段名
      const { accessToken, expiresIn, tokenType } = tokenData;

      // 验证expiresIn是否为有效数字
      const expiresInMs = typeof expiresIn === 'number' && expiresIn > 0 
        ? expiresIn * 1000 
        : 3600 * 1000; // 默认1小时

      this.tokenInfo = {
        accessToken: accessToken,
        expiresAt: Date.now() + expiresInMs - 60000, // 提前1分钟过期
        tokenType: tokenType,
      };

      this.logger.debug('Access token received and stored', {
        tokenType: tokenType,
        expiresIn: expiresIn,
        expiresInSeconds: expiresInMs / 1000,
        expiresAt: new Date(this.tokenInfo.expiresAt).toISOString(),
      });

      return this.tokenInfo;
    } catch (error) {
      this.logger.error('Token refresh API call failed', error as Error);
      this.tokenInfo = null;
      throw error;
    }
  }

  /**
   * 检查token是否有效
   */
  private isTokenValid(): boolean {
    if (!this.tokenInfo) {
      return false;
    }
    return Date.now() < this.tokenInfo.expiresAt;
  }

  /**
   * 清除token信息
   */
  clearToken(): void {
    this.logger.info('Clearing stored access token');
    this.tokenInfo = null;
    this.tokenRefreshPromise = null;
  }

  /**
   * 获取logger实例
   */
  getLogger(): Logger {
    return this.logger;
  }

  /**
   * 获取当前token信息
   */
  getTokenInfo(): TokenInfo | null {
    return this.tokenInfo;
  }

  /**
   * 检查认证配置是否有效
   */
  isConfigValid(): boolean {
    return !!(this.clientID && this.clientSecret);
  }

  /**
   * 强制刷新token
   */
  async forceRefreshToken(): Promise<string> {
    this.tokenInfo = null;
    this.tokenRefreshPromise = null;
    return this.getAccessToken();
  }

  /**
   * 设置调试token（仅在debug模式下使用）
   */
  private setDebugToken(debugToken: string): void {
    if (!this.config.debug) {
      this.logger.warn('Debug token can only be used in debug mode');
      return;
    }

    // 解析JWT token获取过期时间
    let expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 默认24小时后过期
    
    try {
      // 简单解析JWT token的payload部分
      const parts = debugToken.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        if (payload.exp) {
          expiresAt = payload.exp * 1000; // JWT的exp是秒，转换为毫秒
        }
      }
    } catch (error) {
      this.logger.warn('Failed to parse debug token expiration, using default 24h', error as Error);
    }

    this.tokenInfo = {
      accessToken: debugToken,
      expiresAt: expiresAt,
      tokenType: 'Bearer',
    };

    this.logger.debug('Debug token set successfully', {
      tokenType: 'Bearer',
      expiresAt: new Date(expiresAt).toISOString(),
      tokenLength: debugToken.length,
    });
  }

  /**
   * 检查是否使用debug token
   */
  private isUsingDebugToken(): boolean {
    return !!(this.config.debug && this.config.debugToken && this.tokenInfo);
  }
}
