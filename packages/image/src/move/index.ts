/**
 * 移动模块
 */

import { HttpClient } from '@123pan/core';
import type { ApiResponse } from '@123pan/core';
import { IMoveFilesResponse } from './types';

export class MoveModule {
  constructor(private httpClient: HttpClient) {}

  /**
   * 移动图片
   * 批量移动文件，单级最多支持100个
   */
  async moveFiles(params: {
    /** 文件id数组，单级最多支持100个 */
    fileIDs: string[];
    /** 要移动到的目标文件夹id，不能为空 */
    toParentFileID: string;
  }): Promise<ApiResponse<IMoveFilesResponse>> {
    return this.httpClient.post('/api/v1/oss/file/move', { ...params });
  }
}

// 导出类型
export * from './types';

