/**
 * 删除模块
 */

import { HttpClient } from '@123pan/core';
import type { ApiResponse } from '@123pan/core';
import { IDeleteFilesResponse } from './types';

export class DeleteModule {
  constructor(private httpClient: HttpClient) {}

  /**
   * 删除图片
   * 批量删除文件，参数长度最大不超过 100
   */
  async deleteFiles(params: {
    /** 文件id数组，参数长度最大不超过 100 */
    fileIDs: string[];
  }): Promise<ApiResponse<IDeleteFilesResponse>> {
    return this.httpClient.post('/api/v1/oss/file/delete', { ...params });
  }
}

// 导出类型
export * from './types';

