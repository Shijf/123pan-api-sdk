/**
 * HTTP客户端 - 集成认证和限流功能
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { AuthManager } from '../auth/auth-manager';
import { TokenBucketRateLimiter, createDefaultRateLimiter } from '../utils/rate-limiter';
import { Logger, createModuleLogger, LogLevel } from '../logger';
import type { 
  SdkConfig, 
  ApiResponse, 
  ApiError, 
  RequestConfig, 
  RateLimiter,
  HttpMethod 
} from '../types';

export class HttpClient {
  private client: AxiosInstance;
  private authManager: AuthManager;
  private rateLimiter: RateLimiter;
  private config: SdkConfig;
  private logger: Logger;

  constructor(config: SdkConfig) {
    this.config = config;
    this.authManager = new AuthManager(config);
    
    // 初始化日志器
    const loggerConfig = config.loggerConfig || {};
    const logLevel = loggerConfig.level ? LogLevel[loggerConfig.level] : (config.debug ? LogLevel.DEBUG : LogLevel.INFO);
    
    this.logger = createModuleLogger('HttpClient', {
      level: logLevel,
      enableConsole: loggerConfig.enableConsole !== false,
      enableRemote: loggerConfig.enableRemote || false,
      ...(loggerConfig.remoteEndpoint && { remoteEndpoint: loggerConfig.remoteEndpoint }),
      colors: loggerConfig.colors !== false,
      maxEntries: loggerConfig.maxEntries || 1000,
    });
    
    // 初始化限流器
    if (config.rateLimitConfig) {
      this.rateLimiter = new TokenBucketRateLimiter({
        maxRequests: config.rateLimitConfig.maxRequests || 100,
        perMilliseconds: config.rateLimitConfig.perMilliseconds || 60000,
        maxRetries: config.rateLimitConfig.maxRetries || 3,
      });
    } else {
      this.rateLimiter = createDefaultRateLimiter();
    }

    // 初始化axios实例
    this.client = axios.create({
      baseURL: config.baseURL || 'https://open-api.123pan.com',
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': '123pan-api-sdk/1.0.0',
        'platform': 'open_platform', // 添加平台字段
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // 请求拦截器
    this.client.interceptors.request.use(
      async (config) => {
        // 应用限流
        await this.rateLimiter.checkLimit();

        // 添加认证头
        try {
          const accessToken = await this.authManager.getAccessToken();
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${accessToken}`;
          this.logger.debug('Access token added to request');
        } catch (error) {
          this.logger.error('Failed to get access token', error as Error);
          throw error;
        }

        this.logger.debug('Sending HTTP request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          headers: config.headers,
          data: config.data,
        });

        return config;
      },
      (error) => {
        this.logger.error('HTTP request failed', error);
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.client.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        this.logger.debug('HTTP response received', {
          status: response.status,
          statusText: response.statusText,
          data: response.data,
        });

        // 检查业务状态码
        if (response.data.code !== 0) {
          const error: ApiError = {
            code: response.data.code,
            message: response.data.message,
            details: response.data.data,
          };
          throw error;
        }

        return response;
      },
      async (error) => {
        this.logger.error('HTTP response error', error, {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
        });

        // 处理401未授权错误，尝试刷新token
        if (error.response?.status === 401) {
          this.logger.warn('Received 401 error, attempting token refresh');
          try {
            await this.authManager.forceRefreshToken();
            // 重试原请求
            const originalRequest = error.config;
            if (originalRequest && !originalRequest._retry) {
              originalRequest._retry = true;
              const accessToken = await this.authManager.getAccessToken();
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              this.logger.info('Retrying request with refreshed token');
              return this.client.request(originalRequest);
            }
          } catch (refreshError) {
            // token刷新失败，清除认证信息
            this.logger.error('Token refresh failed, clearing authentication', refreshError as Error);
            this.authManager.clearToken();
            throw refreshError;
          }
        }

        // 处理限流错误
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'];
          if (retryAfter) {
            const waitTime = parseInt(retryAfter) * 1000;
            this.logger.warn(`Rate limited, waiting ${waitTime}ms before retry`);
            await this.sleep(waitTime);
            return this.client.request(error.config);
          }
        }

        // 转换为统一的错误格式
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

  async request<T = any>(
    method: HttpMethod,
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const requestConfig: AxiosRequestConfig = {
      method,
      url,
      ...config,
    };

    if (method === 'GET') {
      requestConfig.params = data;
    } else {
      requestConfig.data = data;
    }

    const response = await this.client.request<ApiResponse<T>>(requestConfig);
    return response.data;
  }

  async get<T = any>(
    url: string,
    params?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>('GET', url, params, config);
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>('POST', url, data, config);
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', url, data, config);
  }

  async delete<T = any>(
    url: string,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', url, undefined, config);
  }

  async patch<T = any>(
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', url, data, config);
  }

  /**
   * 获取认证管理器
   */
  getAuthManager(): AuthManager {
    return this.authManager;
  }

  /**
   * 获取限流器
   */
  getRateLimiter(): RateLimiter {
    return this.rateLimiter;
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<SdkConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.baseURL) {
      this.client.defaults.baseURL = newConfig.baseURL;
    }
    if (newConfig.timeout) {
      this.client.defaults.timeout = newConfig.timeout;
    }
  }

  /**
   * 获取原始axios实例
   */
  getAxiosInstance(): AxiosInstance {
    return this.client;
  }

  /**
   * 获取logger实例
   */
  getLogger(): Logger {
    return this.logger;
  }


  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
