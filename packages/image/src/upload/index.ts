/**
 * 上传模块
 */

import { HttpClient } from '@123pan/core';
import type { ApiResponse } from '@123pan/core';
import {
  ICreateFileResponse,
  ICreateFolderResponse,
  IGetUploadResultResponse,
  IGetUploadUrlResponse,
  IUploadCompleteResponse,
  IUploadFileParams,
  IUploadFileResult,
  UploadProgressCallback,
} from './types';
import {
  calculateMD5,
  uploadSliceToPresignedURL,
  sliceFile,
  getFileSize,
} from './utils';

export class UploadModule {
  constructor(private httpClient: HttpClient) {}

  /** 创建目录 */
  async createFolder(params: {
    /**目录名(注:不能重名) */
    name: string[];
    /** 父目录id，上传到根目录时为空 */
    parentID?: string;
    /** 固定为 1 */
    type: number;
  }): Promise<ApiResponse<ICreateFolderResponse>> {
    return this.httpClient.post('/upload/v1/oss/file/mkdir', { ...params });
  }

  /**
   * 创建文件
   * @param params 
   * @returns 
   */
  async createFile(params: {
    /** 文件名：要小于255个字符且不能包含以下任何字符："\/:*?|><。（注：不能重名） */
    filename: string;
    /** 文件md5 (etag) */
    fileMd5: string;
    /** 父目录id，上传到根目录时填写 空 */
    parentFileID?: string;
    /** 文件大小，单位为 byte 字节 */
    size: number;
    /** 固定为 1 */
    type: number;
  }): Promise<ApiResponse<ICreateFileResponse>> {
    // API需要 Etag 字段，将 fileMd5 映射为 Etag
    return this.httpClient.post('/upload/v1/oss/file/create', {
      filename: params.filename,
      Etag: params.fileMd5, // API需要 Etag 字段
      parentFileID: params.parentFileID || '',
      size: params.size,
      type: params.type,
    });
  }

  /**
   * 获取上传地址
   * @param params 
   * @returns 
   */
  async getUploadUrl(params: {
    /** 预上传id */
    preuploadID: string;
    /** 分片序号，从1开始自增 */
    sliceNo: string;
  }): Promise<ApiResponse<IGetUploadUrlResponse>> {
    return this.httpClient.post('/upload/v1/oss/file/get_upload_url', { ...params });
  }

  /**
   * 上传完毕
   * 文件上传完成后请求此接口，完成文件上传
   */
  async uploadComplete(params: {
    /** 文件id（可选，非秒传时可能为空） */
    fileID?: string;
    /** 预上传id */
    preuploadID: string;
  }): Promise<ApiResponse<IUploadCompleteResponse>> {
    // 如果 fileID 为空，只传 preuploadID
    const body = params.fileID
      ? { fileID: params.fileID, preuploadID: params.preuploadID }
      : { preuploadID: params.preuploadID };
    return this.httpClient.post('/upload/v1/oss/file/upload_complete', body);
  }

  /** 异步轮询获取上传结果 */
  async getUploadResult(params: {
    /** 预上传id */
    preuploadID: string;
  }): Promise<ApiResponse<IGetUploadResultResponse>> {
    return this.httpClient.post('/upload/v1/oss/file/upload_async_result', { ...params });
  }

  /**
   * 高级上传方法：一键上传文件
   * 自动处理所有上传步骤：创建文件、分片上传、上传完成、异步轮询等
   */
  async uploadFile(params: IUploadFileParams): Promise<IUploadFileResult> {
    const {
      filename,
      file,
      fileMd5,
      parentFileID,
      onProgress,
      pollInterval = 1000,
      maxPollAttempts = 300,
    } = params;

    const fileSize = getFileSize(file);
    let totalUploaded = 0;

    // 1. 计算 MD5（如果未提供）
    let md5 = fileMd5;
    if (!md5) {
      md5 = await calculateMD5(file);
    }

    // 2. 创建文件
    const createFileResult = await this.createFile({
      filename,
      fileMd5: md5,
      parentFileID: parentFileID || '',
      size: fileSize,
      type: 1,
    });

    if (createFileResult.code !== 0) {
      throw new Error(`创建文件失败: ${createFileResult.message}`);
    }

    const { reuse, preuploadID, fileID: initialFileID, sliceSize } = createFileResult.data;

    // 3. 如果是秒传，直接返回
    if (reuse && initialFileID) {
      if (onProgress) {
        onProgress({
          loaded: fileSize,
          total: fileSize,
          percent: 100,
        });
      }
      return {
        fileID: initialFileID,
        isReuse: true,
        isAsync: false,
      };
    }

    // 4. 非秒传：分片上传
    const slices = sliceFile(file, sliceSize);
    const totalSlices = slices.length;

    for (let i = 0; i < slices.length; i++) {
      const sliceNo = (i + 1).toString();
      const slice = slices[i];

      // 4.1 获取上传地址
      const urlResult = await this.getUploadUrl({
        preuploadID,
        sliceNo,
      });

      if (urlResult.code !== 0) {
        throw new Error(`获取上传地址失败: ${urlResult.message}`);
      }

      const { presignedURL } = urlResult.data;

      // 4.2 上传分片
      await uploadSliceToPresignedURL(presignedURL, slice, (progressEvent) => {
        if (onProgress && progressEvent.total) {
          // 计算总进度：已上传的分片 + 当前分片的进度
          const sliceProgress = (progressEvent.loaded / progressEvent.total) * sliceSize;
          totalUploaded = i * sliceSize + sliceProgress;
          onProgress({
            loaded: totalUploaded,
            total: fileSize,
            percent: Math.min((totalUploaded / fileSize) * 100, 100),
            currentSlice: i + 1,
            totalSlices,
          });
        }
      });

      // 更新进度（分片上传完成）
      totalUploaded = (i + 1) * sliceSize;
      if (onProgress) {
        onProgress({
          loaded: Math.min(totalUploaded, fileSize),
          total: fileSize,
          percent: Math.min((totalUploaded / fileSize) * 100, 100),
          currentSlice: i + 1,
          totalSlices,
        });
      }
    }

    // 5. 上传完成
    // 注意：非秒传时，创建文件可能不返回 fileID，只传 preuploadID 即可
    const completeParams: { preuploadID: string; fileID?: string } = {
      preuploadID,
    };
    if (initialFileID) {
      completeParams.fileID = initialFileID;
    }
    const completeResult = await this.uploadComplete(completeParams);

    if (completeResult.code !== 0) {
      throw new Error(`上传完成失败: ${completeResult.message}`);
    }

    const { async: isAsync, completed, fileID: finalFileID } = completeResult.data;

    // 6. 如果同步完成，直接返回
    if (!isAsync && completed && finalFileID) {
      if (onProgress) {
        onProgress({
          loaded: fileSize,
          total: fileSize,
          percent: 100,
        });
      }
      return {
        fileID: finalFileID,
        isReuse: false,
        isAsync: false,
      };
    }

    // 7. 异步轮询
    if (isAsync) {
      let attempts = 0;
      while (attempts < maxPollAttempts) {
        await new Promise((resolve) => setTimeout(resolve, pollInterval));

        const pollResult = await this.getUploadResult({ preuploadID });

        if (pollResult.code !== 0) {
          throw new Error(`轮询上传结果失败: ${pollResult.message}`);
        }

        const { completed: pollCompleted, fileID: pollFileID } = pollResult.data;

        if (pollCompleted && pollFileID) {
          if (onProgress) {
            onProgress({
              loaded: fileSize,
              total: fileSize,
              percent: 100,
            });
          }
          return {
            fileID: pollFileID,
            isReuse: false,
            isAsync: true,
          };
        }

        attempts++;
      }

      throw new Error(`上传超时：超过最大轮询次数 ${maxPollAttempts}`);
    }

    // 如果既不是同步完成也不是异步，返回初始 fileID
    return {
      fileID: initialFileID || '',
      isReuse: false,
      isAsync: false,
    };
  }
}

// 导出类型
export * from './types';