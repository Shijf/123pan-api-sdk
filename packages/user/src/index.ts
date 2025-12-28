/**
 * 用户管理模块
 */

import { HttpClient } from '@123pan/core';
import type { ApiResponse, UserInfo } from '@123pan/core';

export class UserModule {
  constructor(private httpClient: HttpClient) {}

  /**
   * 获取用户信息
   */
  async getUserInfo(): Promise<ApiResponse<UserInfo>> {
    return this.httpClient.get('/api/v1/user/info');
  }
}
