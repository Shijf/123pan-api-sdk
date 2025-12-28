/**
 * 123pan API SDK
 * 
 * 使用示例:
 * ```typescript
 * import Pan123SDK from '123pan-api-sdk';
 * 
 * const sdk = new Pan123SDK({
 *   clientID: 'your-client-id',
 *   clientSecret: 'your-client-secret',
 * });
 * 
 * // 获取文件列表
 * const files = await sdk.file.getFileList();
 * 
 * // 创建分享
 * const share = await sdk.file.share.createShare({
 *   shareName: '我的分享',
 *   shareExpire: 7,
 *   fileIDList: [14713526, 10861131]
 * });
 * ```
 */

import { HttpClient, type SdkConfig } from '@123pan/core';
import { FileModule } from '@123pan/file';
import { UserModule } from '@123pan/user';
import { OfflineModule } from '@123pan/offline';
import { DirectLinkModule } from '@123pan/direct-link';
import { ImageModule } from '@123pan/image';
import { VideoModule } from '@123pan/video';

export class Pan123SDK {
  private httpClient: HttpClient;
  // 各功能模块
  public readonly file: FileModule;
  public readonly user: UserModule;
  public readonly offline: OfflineModule;
  public readonly directLink: DirectLinkModule;
  public readonly image: ImageModule;
  public readonly video: VideoModule;
  public readonly saaa:any;

  constructor(config: SdkConfig) {

    // 验证必需的配置
    if (!config.clientID || !config.clientSecret) {
      throw new Error('clientID and clientSecret are required');
    }

    // 初始化HTTP客户端
    this.httpClient = new HttpClient(config);

    // 初始化各功能模块
    this.file = new FileModule(this.httpClient);
    this.user = new UserModule(this.httpClient);
    this.offline = new OfflineModule(this.httpClient);
    this.directLink = new DirectLinkModule(this.httpClient);
    this.image = new ImageModule(this.httpClient);
    this.video = new VideoModule(this.httpClient);
  }

  /**
   * 获取当前访问令牌信息
   */
  async getTokenInfo() {
    const authManager = this.httpClient.getAuthManager();
    
    // 如果没有token信息，先获取token
    let tokenInfo = authManager.getTokenInfo();
    if (!tokenInfo) {
      // 触发token获取
      await authManager.getAccessToken();
      tokenInfo = authManager.getTokenInfo();
    }
    
    return tokenInfo;
  }

  /**
   * 强制刷新访问令牌
   */
  async refreshToken() {
    return this.httpClient.getAuthManager().forceRefreshToken();
  }

  /**
   * 清除认证信息
   */
  clearAuth() {
    this.httpClient.getAuthManager().clearToken();
  }

  /**
   * 获取限流器状态
   */
  getRateLimiterStatus() {
    const rateLimiter = this.httpClient.getRateLimiter();
    return {
      availableTokens: (rateLimiter as any).getAvailableTokens?.() || 0,
    };
  }

  /**
   * 重置限流器
   */
  resetRateLimit() {
    this.httpClient.getRateLimiter().reset();
  }

  /**
   * 更新SDK配置
   */
  updateConfig(newConfig: Partial<SdkConfig>) {
    this.httpClient.updateConfig(newConfig);
  }

  /**
   * 获取HTTP客户端实例（用于高级用法）
   */
  getHttpClient(): HttpClient {
    return this.httpClient;
  }
}

// 导出所有类型和模块
export * from '@123pan/core';
export * from '@123pan/file';
export * from '@123pan/user';
export * from '@123pan/offline';
export * from '@123pan/direct-link';
export * from '@123pan/image';
export * from '@123pan/video';

// 默认导出
export default Pan123SDK;
