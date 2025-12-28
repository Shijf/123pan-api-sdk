/**
 * 视频转码上传模块类型定义
 */

import type { ApiResponse } from '@123pan/core';

/** 从云盘空间上传的文件项 */
export interface UploadFromCloudDiskFileItem {
  /** 云盘空间文件ID */
  fileId: number | string;
}

/** 从云盘空间上传参数 */
export interface UploadFromCloudDiskParams {
  /** 文件ID列表，每个元素包含fileId，最多100个 */
  fileIds: (number | string)[] | UploadFromCloudDiskFileItem[];
}

/** 从云盘空间上传响应 */
export interface UploadFromCloudDiskResponse {
  /** 上传结果列表（具体结构需要根据API实际返回确定） */
  [key: string]: any;
}

