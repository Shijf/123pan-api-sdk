/**
 * IP黑名单管理模块
 * 注意：此模块的API需要开通开发者权益
 */

import { HttpClient } from '@123pan/core';
import type { ApiResponse } from '@123pan/core';
import type {
  ToggleIpBlacklistParams,
  ToggleIpBlacklistResponse,
  UpdateIpBlacklistParams,
  GetIpBlacklistResponse,
} from './types';

export class IpModule {
  constructor(private httpClient: HttpClient) {}

  /**
   * 开启或关闭IP黑名单
   * 注意：此接口需要开通开发者权益
   * @param params 配置参数
   * @param params.Status 状态：1-启用，2-禁用
   * @returns 操作结果
   */
  async toggleBlacklist(params: ToggleIpBlacklistParams): Promise<ApiResponse<ToggleIpBlacklistResponse>> {
    const { Status } = params;

    // 验证 Status 参数
    if (Status !== 1 && Status !== 2) {
      throw new Error('Status 参数必须为 1（启用）或 2（禁用）');
    }

    return this.httpClient.post<ToggleIpBlacklistResponse>('/api/v1/developer/config/forbide-ip/switch', {
      Status,
    });
  }

  /**
   * 更新IP黑名单列表
   * 注意：此接口需要开通开发者权益
   * @param params 更新参数
   * @param params.IpList IP地址列表，最多2000个IPv4地址
   * @returns 操作结果
   */
  async updateBlacklist(params: UpdateIpBlacklistParams): Promise<ApiResponse<{}>> {
    const { IpList } = params;

    // 验证 IP 列表
    if (!Array.isArray(IpList)) {
      throw new Error('IpList 必须是数组');
    }

    if (IpList.length === 0) {
      throw new Error('IpList 不能为空');
    }

    if (IpList.length > 2000) {
      throw new Error('IpList 最多支持2000个IP地址');
    }

    // 简单验证 IPv4 格式
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const invalidIps = IpList.filter(ip => !ipv4Regex.test(ip));
    if (invalidIps.length > 0) {
      throw new Error(`以下IP地址格式不正确：${invalidIps.slice(0, 5).join(', ')}${invalidIps.length > 5 ? '...' : ''}`);
    }

    return this.httpClient.post<{}>('/api/v1/developer/config/forbide-ip/update', {
      IpList,
    });
  }

  /**
   * 获取IP黑名单列表
   * 注意：此接口需要开通开发者权益
   * @returns IP黑名单配置
   */
  async getBlacklist(): Promise<ApiResponse<GetIpBlacklistResponse>> {
    return this.httpClient.get<GetIpBlacklistResponse>('/api/v1/developer/config/forbide-ip/list');
  }
}

