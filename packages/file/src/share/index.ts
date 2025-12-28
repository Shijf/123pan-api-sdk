/**
 * 文件分享模块
 */

import { HttpClient } from '@123pan/core';
import type { ApiResponse } from '@123pan/core';
import type {
  CreateShareParams,
  CreateShareResponse,
  CreatePaidShareParams,
  CreatePaidShareResponse,
} from './types';

export class ShareModule {
  constructor(private httpClient: HttpClient) {}

  /**
   * 创建分享链接
   * @param params 创建分享参数
   * @param params.shareName 分享链接名称
   * @param params.shareExpire 分享链接有效期天数（1、7、30、0，0代表永久）
   * @param params.fileIDList 分享文件ID列表，支持数组或逗号分割的字符串，最多100个
   * @param params.sharePwd 分享链接提取码（选填）
   * @param params.trafficSwitch 分享提取流量包开关（选填）
   * @param params.trafficLimitSwitch 分享提取流量包流量限制开关（选填）
   * @param params.trafficLimit 分享提取流量包限制流量，单位：字节（选填）
   * @returns 分享信息（包含分享ID和分享码）
   */
  async createShare(params: CreateShareParams): Promise<ApiResponse<CreateShareResponse>> {
    // 处理 fileIDList：如果是数组，转换为逗号分割的字符串
    let fileIDListStr: string;
    if (Array.isArray(params.fileIDList)) {
      // 验证数量限制（最多100个）
      if (params.fileIDList.length > 100) {
        throw new Error('文件ID列表最多支持100个文件');
      }
      // 转换为字符串数组，然后拼接
      fileIDListStr = params.fileIDList.map((id) => String(id)).join(',');
    } else {
      fileIDListStr = params.fileIDList;
      // 验证字符串格式的文件ID列表数量
      const fileIDs = fileIDListStr.split(',').filter((id) => id.trim() !== '');
      if (fileIDs.length > 100) {
        throw new Error('文件ID列表最多支持100个文件');
      }
    }

    // 验证 shareExpire 是否为有效值
    if (![0, 1, 7, 30].includes(params.shareExpire)) {
      throw new Error('shareExpire 必须是 0、1、7 或 30 之一');
    }

    // 构建请求体
    const requestBody: any = {
      shareName: params.shareName,
      shareExpire: params.shareExpire,
      fileIDList: fileIDListStr,
    };

    // 添加可选参数
    if (params.sharePwd !== undefined) {
      requestBody.sharePwd = params.sharePwd;
    }
    if (params.trafficSwitch !== undefined) {
      requestBody.trafficSwitch = params.trafficSwitch;
    }
    if (params.trafficLimitSwitch !== undefined) {
      requestBody.trafficLimitSwitch = params.trafficLimitSwitch;
    }
    if (params.trafficLimit !== undefined) {
      requestBody.trafficLimit = params.trafficLimit;
    }

    return this.httpClient.post<CreateShareResponse>('/api/v1/share/create', requestBody);
  }

  /**
   * 创建付费分享链接
   * @param params 创建付费分享参数
   * @param params.shareName 分享链接名称，要小于35个字符且不能包含特殊字符
   * @param params.fileIDList 分享文件ID列表，支持数组或逗号分割的字符串，最多100个
   * @param params.payAmount 付费金额，最小1元，最大1000元
   * @param params.isReward 是否开启打赏（选填）：0-否，1-是
   * @param params.resourceDesc 资源描述（选填）
   * @param params.trafficSwitch 分享提取流量包开关（选填）
   * @param params.trafficLimitSwitch 分享提取流量包流量限制开关（选填）
   * @param params.trafficLimit 分享提取流量包限制流量，单位：字节（选填）
   * @returns 分享信息（包含分享ID和分享码）
   */
  async createPaidShare(params: CreatePaidShareParams): Promise<ApiResponse<CreatePaidShareResponse>> {
    // 验证 shareName 长度（小于35个字符）
    if (params.shareName.length >= 35) {
      throw new Error('分享链接名称要小于35个字符');
    }

    // 处理 fileIDList：如果是数组，转换为逗号分割的字符串
    let fileIDListStr: string;
    if (Array.isArray(params.fileIDList)) {
      // 验证数量限制（最多100个）
      if (params.fileIDList.length > 100) {
        throw new Error('文件ID列表最多支持100个文件');
      }
      // 转换为字符串数组，然后拼接
      fileIDListStr = params.fileIDList.map((id) => String(id)).join(',');
    } else {
      fileIDListStr = params.fileIDList;
      // 验证字符串格式的文件ID列表数量
      const fileIDs = fileIDListStr.split(',').filter((id) => id.trim() !== '');
      if (fileIDs.length > 100) {
        throw new Error('文件ID列表最多支持100个文件');
      }
    }

    // 验证 payAmount（1-1000元）
    if (!Number.isInteger(params.payAmount) || params.payAmount < 1 || params.payAmount > 1000) {
      throw new Error('付费金额必须是1-1000之间的整数');
    }

    // 构建请求体
    const requestBody: any = {
      shareName: params.shareName,
      fileIDList: fileIDListStr,
      payAmount: params.payAmount,
    };

    // 添加可选参数
    if (params.isReward !== undefined) {
      requestBody.isReward = params.isReward;
    }
    if (params.resourceDesc !== undefined) {
      requestBody.resourceDesc = params.resourceDesc;
    }
    if (params.trafficSwitch !== undefined) {
      requestBody.trafficSwitch = params.trafficSwitch;
    }
    if (params.trafficLimitSwitch !== undefined) {
      requestBody.trafficLimitSwitch = params.trafficLimitSwitch;
    }
    if (params.trafficLimit !== undefined) {
      requestBody.trafficLimit = params.trafficLimit;
    }

    return this.httpClient.post<CreatePaidShareResponse>('/api/v1/share/content-payment/create', requestBody);
  }
}

// 导出类型
export * from './types';

