/**
 * 复制模块
 */

import { HttpClient } from '@123pan/core';
import type { ApiResponse } from '@123pan/core';
import {
  ICreateCopyTaskResponse,
  IGetCopyTaskProcessResponse,
  IGetCopyFailFilesResponse,
  CopyTaskStatus,
} from './types';

export class CopyModule {
  constructor(private httpClient: HttpClient) {}

  /**
   * 创建复制任务
   * 图床复制任务创建（可创建的任务数：3，fileIDs 长度限制：100，当前一个任务处理完后将会继续处理下个任务）
   * 该接口将会复制云盘里的文件或目录对应的图片到对应图床目录，每次任务包含的图片总数限制 1000 张
   * 图片格式：png, gif, jpeg, tiff, webp, jpg, tif, svg, bmp
   * 图片大小限制：100M，文件夹层级限制：15层
   * 如果图床目录下存在相同 etag、size 的图片将会视为同一张图片，将覆盖原图片
   */
  async createCopyTask(params: {
    /** 文件id数组(string 数组)，长度限制：100 */
    fileIDs: string[];
    /** 要移动到的图床目标文件夹id，移动到根目录时为空 */
    toParentFileID: string;
    /** 复制来源(1=云盘) */
    sourceType: string;
    /** 业务类型，固定为 1 */
    type: number;
  }): Promise<ApiResponse<ICreateCopyTaskResponse>> {
    return this.httpClient.post('/api/v1/oss/source/copy', { ...params, type: 1, sourceType: '1' });
  }

  /**
   * 获取复制任务详情
   * 该接口将会获取图床复制任务执行情况
   */
  async getCopyTaskProcess(params: {
    /** 复制任务ID */
    taskID: string;
  }): Promise<ApiResponse<IGetCopyTaskProcessResponse>> {
    return this.httpClient.get('/api/v1/oss/source/copy/process', {
      taskID: params.taskID,
    });
  }

  /**
   * 获取复制失败文件列表
   * 查询图床复制任务失败文件列表（注：记录的是符合对应格式、大小的图片的复制失败原因）
   */
  async getCopyFailFiles(params: {
    /** 复制任务ID */
    taskID: string;
    /** 每页文件数量，最大不超过100 */
    limit: number;
    /** 页码数 */
    page: number;
  }): Promise<ApiResponse<IGetCopyFailFilesResponse>> {
    return this.httpClient.get('/api/v1/oss/source/copy/fail', {
      taskID: params.taskID,
      limit: params.limit,
      page: params.page,
    });
  }
}

// 导出类型
export * from './types';
export { CopyTaskStatus } from './types';

