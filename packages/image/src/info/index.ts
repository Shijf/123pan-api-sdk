/**
 * 信息查询模块
 */

import { HttpClient } from '@123pan/core';
import type { ApiResponse } from '@123pan/core';
import {
  IGetImageDetailResponse,
  IGetImageListResponse,
} from './types';

export class InfoModule {
  constructor(private httpClient: HttpClient) {}

  /**
   * 获取图片详情
   * @param params 查询参数
   * @param params.fileID 文件ID
   * @param params.width 图片宽度（像素，可选，用于生成带尺寸参数的URL）
   * @param params.height 图片高度（像素，可选，用于生成带尺寸参数的URL）
   * @param params.useCustomDomain 是否使用自定义域名（可选）
   */
  async getImageDetail(params: {
    /** 文件ID */
    fileID: string;
    /** 图片宽度（像素，可选） */
    width?: number;
    /** 图片高度（像素，可选） */
    height?: number;
    /** 是否使用自定义域名（可选） */
    useCustomDomain?: boolean;
  }): Promise<ApiResponse<IGetImageDetailResponse & { imageUrl?: string }>> {
    const result = await this.httpClient.get('/api/v1/oss/file/detail', {
      fileID: params.fileID,
    });

    // 如果指定了尺寸参数，生成带参数的URL
    if (result.code === 0 && (params.width !== undefined || params.height !== undefined)) {
      const originalUrl = params.useCustomDomain
        ? result.data.userSelfURL
        : result.data.downloadURL;

      const url = new URL(originalUrl);
      const searchParams = url.searchParams;

      if (params.width !== undefined) {
        searchParams.set('w', params.width.toString());
      }
      if (params.height !== undefined) {
        searchParams.set('h', params.height.toString());
      }

      return {
        ...result,
        data: {
          ...result.data,
          imageUrl: url.toString(),
        },
      };
    }

    return result;
  }

  /**
   * 获取图片列表
   */
  async getImageList(params: {
    /** 父级目录Id, 默认为空表示筛选根目录下的文件 */
    parentFileId?: string;
    /** 每页文件数量，最大不超过100 */
    limit: number;
    /** 筛选开始时间（时间戳格式，例如 1730390400） */
    startTime?: number;
    /** 筛选结束时间（时间戳格式，例如 1730390400） */
    endTime?: number;
    /** 翻页查询时需要填写 */
    lastFileId?: string;
    /** 固定为1 */
    type: number;
  }): Promise<ApiResponse<IGetImageListResponse>> {
    return this.httpClient.post('/api/v1/oss/file/list', { ...params, type: 1 });
  }
}

// 导出类型
export * from './types';

