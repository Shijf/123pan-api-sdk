/**
 * 图片上传工具函数（Node.js环境专用）
 * 
 * 注意：文件处理相关的工具函数（calculateMD5, sliceFile, getFileSize）
 * 已迁移到 @123pan/core 包中，请从那里导入。
 */

import axios, { AxiosProgressEvent } from 'axios';

// 重新导出 core 包中的文件工具函数
export {
  calculateMD5,
  sliceFile,
  getFileSize,
  calculateSliceMD5,
} from '@123pan/core';

/**
 * 直接向 presignedURL 发送 PUT 请求上传文件分片（Node.js环境专用）
 * 注意：不携带 Authorization 和 Platform 头
 */
export async function uploadSliceToPresignedURL(
  presignedURL: string,
  sliceData: ArrayBuffer | Buffer | Uint8Array,
  onProgress?: (progress: AxiosProgressEvent) => void
): Promise<void> {
  // 确保 sliceData 是 Buffer（Node.js环境）
  let buffer: Buffer;
  if (Buffer.isBuffer(sliceData)) {
    buffer = sliceData;
  } else if (sliceData instanceof Uint8Array) {
    buffer = Buffer.from(sliceData);
  } else if (sliceData instanceof ArrayBuffer) {
    buffer = Buffer.from(sliceData);
  } else {
    throw new Error('Unsupported slice data type. Expected Buffer, Uint8Array, or ArrayBuffer.');
  }

  const config: any = {
    method: 'PUT',
    url: presignedURL,
    data: buffer,
    headers: {
      'Content-Type': 'application/octet-stream',
    },
    // 不携带 Authorization 和 Platform
    // 禁用 axios 的默认拦截器
    transformRequest: [(data: any) => data],
  };

  if (onProgress) {
    config.onUploadProgress = onProgress;
  }

  await axios(config);
}


