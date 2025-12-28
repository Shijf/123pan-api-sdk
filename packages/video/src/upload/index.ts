/**
 * 视频转码上传模块
 */

import { HttpClient } from '@123pan/core';
import type { ApiResponse } from '@123pan/core';
import type {
  UploadFromCloudDiskFileItem,
  UploadFromCloudDiskParams,
  UploadFromCloudDiskResponse,
} from './types';

export class UploadModule {
  constructor(private httpClient: HttpClient) {}

  /**
   * 从云盘空间上传（创建转码任务）
   * 一次性最多支持100个文件，如果超过会自动分批处理
   * @param params 上传参数
   * @param params.fileIds 文件ID列表，支持数字数组或对象数组，最多100个
   * @returns 上传结果
   */
  async fromCloudDisk(params: UploadFromCloudDiskParams): Promise<ApiResponse<UploadFromCloudDiskResponse>> {
    const { fileIds } = params;
    const MAX_BATCH_SIZE = 100; // API限制最多100个文件

    // 处理文件ID列表：统一转换为对象数组格式
    let fileIdItems: UploadFromCloudDiskFileItem[];
    if (fileIds.length > 0 && typeof fileIds[0] === 'object' && 'fileId' in fileIds[0]) {
      // 已经是对象数组格式
      fileIdItems = fileIds as UploadFromCloudDiskFileItem[];
    } else {
      // 是数字或字符串数组，转换为对象数组
      fileIdItems = (fileIds as (number | string)[]).map((id) => ({
        fileId: typeof id === 'string' ? parseInt(id, 10) : id,
      }));
    }

    // 验证数量限制
    if (fileIdItems.length > MAX_BATCH_SIZE) {
      // 如果超过限制，分批处理
      const allResults: any[] = [];
      for (let i = 0; i < fileIdItems.length; i += MAX_BATCH_SIZE) {
        const batch = fileIdItems.slice(i, i + MAX_BATCH_SIZE);
        const result = await this._uploadFromCloudDiskBatch(batch);

        // 如果某批失败，返回错误（不继续处理后续批次）
        if (result.code !== 0) {
          return {
            ...result,
            data: allResults as any,
          };
        }

        // 合并结果
        if (result.data) {
          if (Array.isArray(result.data)) {
            allResults.push(...result.data);
          } else {
            allResults.push(result.data);
          }
        }
      }

      // 所有批次都成功
      return {
        code: 0,
        message: 'ok',
        data: allResults as any,
      };
    } else {
      // 数量在限制内，直接处理
      return this._uploadFromCloudDiskBatch(fileIdItems);
    }
  }

  /**
   * 执行一批从云盘空间上传请求（内部方法）
   */
  private async _uploadFromCloudDiskBatch(
    fileItems: UploadFromCloudDiskFileItem[]
  ): Promise<ApiResponse<UploadFromCloudDiskResponse>> {
    // 构建请求体：数组格式，每个元素包含 fileId
    const requestBody = fileItems.map((item) => ({
      fileId: typeof item.fileId === 'string' ? parseInt(item.fileId, 10) : item.fileId,
    }));

    return this.httpClient.post<UploadFromCloudDiskResponse>('/api/v1/transcode/upload/from_cloud_disk', requestBody);
  }
}

// 导出类型
export * from './types';

