/**
 * 视频信息模块
 */

import { HttpClient } from '@123pan/core';
import type { ApiResponse } from '@123pan/core';
import type {
  GetTranscodeFolderInfoResponse,
  GetVideoResolutionsResponse,
  GetTranscodeListResponse,
  GetTranscodeRecordResponse,
  GetTranscodeResultResponse,
} from './types';

export class InfoModule {
  constructor(private httpClient: HttpClient) {}

  /**
   * 获取转码空间文件夹信息
   * 获取转码空间的根文件夹ID
   * @returns 转码空间文件夹信息
   */
  async getFolderInfo(): Promise<ApiResponse<GetTranscodeFolderInfoResponse>> {
    return this.httpClient.post<GetTranscodeFolderInfoResponse>('/api/v1/transcode/folder/info', {});
  }

  /**
   * 获取视频文件可转码的分辨率（单次查询）
   * 注意：该接口需要轮询去查询结果，建议使用 getVideoResolutionsWithPolling 方法
   * @param params 查询参数
   * @param params.fileId 文件ID
   * @returns 视频分辨率信息
   */
  async getVideoResolutions(params: {
    /** 文件ID */
    fileId: number | string;
  }): Promise<ApiResponse<GetVideoResolutionsResponse>> {
    const fileId = typeof params.fileId === 'string' ? parseInt(params.fileId, 10) : params.fileId;
    
    return this.httpClient.post<GetVideoResolutionsResponse>('/api/v1/transcode/video/resolutions', {
      fileId,
    });
  }

  /**
   * 获取视频文件可转码的分辨率（自动轮询）
   * 会自动轮询直到获取到结果（IsGetResolution 为 false）
   * @param params 查询参数
   * @param params.fileId 文件ID
   * @param params.pollingInterval 轮询间隔（毫秒），默认10秒
   * @param params.maxAttempts 最大轮询次数，默认30次（即最多5分钟）
   * @param params.onPolling 轮询回调函数，每次轮询时触发
   * @returns 视频分辨率信息
   */
  async getVideoResolutionsWithPolling(params: {
    /** 文件ID */
    fileId: number | string;
    /** 轮询间隔（毫秒），默认10秒 */
    pollingInterval?: number;
    /** 最大轮询次数，默认30次 */
    maxAttempts?: number;
    /** 轮询回调函数 */
    onPolling?: (attempt: number, isGetting: boolean) => void;
  }): Promise<ApiResponse<GetVideoResolutionsResponse>> {
    const { fileId, pollingInterval = 10000, maxAttempts = 30, onPolling } = params;
    
    let attempt = 0;
    
    while (attempt < maxAttempts) {
      attempt++;
      
      const result = await this.getVideoResolutions({ fileId });
      
      // 触发回调
      if (onPolling && result.data) {
        onPolling(attempt, result.data.IsGetResolution);
      }
      
      // 如果获取失败，直接返回错误
      if (result.code !== 0) {
        return result;
      }
      
      // 如果已经获取完成（IsGetResolution 为 false），返回结果
      if (result.data && !result.data.IsGetResolution) {
        return result;
      }
      
      // 如果还在获取中且未达到最大次数，等待后继续轮询
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, pollingInterval));
      }
    }
    
    // 达到最大轮询次数仍未获取到结果
    return {
      code: -1,
      message: `轮询超时：已尝试 ${maxAttempts} 次，仍未获取到视频分辨率信息`,
      data: null as any,
    };
  }

  /**
   * 获取视频转码列表
   * 注意：此接口仅限授权access_token调用（三方挂载应用授权使用）
   * @param params 查询参数
   * @param params.fileId 文件ID
   * @returns 视频转码列表
   */
  async getTranscodeList(params: {
    /** 文件ID */
    fileId: number | string;
  }): Promise<ApiResponse<GetTranscodeListResponse>> {
    const fileId = typeof params.fileId === 'string' ? parseInt(params.fileId, 10) : params.fileId;

    return this.httpClient.get<GetTranscodeListResponse>('/api/v1/video/transcode/list', {
      fileId,
    });
  }

  /**
   * 查询某个视频的转码记录
   * 查询视频的所有转码记录，包括转码状态和 m3u8 链接
   * @param params 查询参数
   * @param params.fileId 文件ID
   * @returns 视频转码记录列表
   */
  async getTranscodeRecord(params: {
    /** 文件ID */
    fileId: number | string;
  }): Promise<ApiResponse<GetTranscodeRecordResponse>> {
    const fileId = typeof params.fileId === 'string' ? parseInt(params.fileId, 10) : params.fileId;

    return this.httpClient.post<GetTranscodeRecordResponse>('/api/v1/transcode/video/record', {
      fileId,
    });
  }

  /**
   * 查询某个视频的转码结果
   * 查询视频的详细转码结果，包括所有转码文件（m3u8 和 ts 文件）
   * @param params 查询参数
   * @param params.fileId 文件ID
   * @returns 视频转码结果详情
   */
  async getTranscodeResult(params: {
    /** 文件ID */
    fileId: number | string;
  }): Promise<ApiResponse<GetTranscodeResultResponse>> {
    const fileId = typeof params.fileId === 'string' ? parseInt(params.fileId, 10) : params.fileId;

    return this.httpClient.post<GetTranscodeResultResponse>('/api/v1/transcode/video/result', {
      fileId,
    });
  }
}

// 导出类型
export * from './types';

