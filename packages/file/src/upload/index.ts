/**
 * 文件上传模块
 */

import { HttpClient } from '@123pan/core';
import type { ApiResponse } from '@123pan/core';
import axios, { AxiosProgressEvent } from 'axios';
import {
  ICreateFolderResponse,
  ICreateFileResponse,
  IUploadSliceResponse,
  IUploadCompleteResponse,
  IGetUploadDomainResponse,
  ISingleUploadResponse,
  IUploadFileParams,
  IUploadFileResult,
  UploadProgressCallback,
} from './types';
import {
  calculateMD5,
  sliceFile,
  getFileSize,
  calculateSliceMD5,
} from './utils';

export class UploadModule {
  constructor(private httpClient: HttpClient) {}

  /**
   * 创建目录
   * @param params 创建目录参数
   * @param params.name 目录名(注:不能重名)
   * @param params.parentID 父目录id，上传到根目录时填写 0
   * @returns 返回创建的目录ID
   */
  async createFolder(params: {
    /** 目录名(注:不能重名) */
    name: string;
    /** 父目录id，上传到根目录时填写 0 */
    parentID: number;
  }): Promise<ApiResponse<ICreateFolderResponse>> {
    return this.httpClient.post('/upload/v1/file/mkdir', {
      name: params.name,
      parentID: params.parentID,
    });
  }

  /**
   * 创建文件
   * 文件名要小于256个字符且不能包含以下任何字符："\/:*?|><
   * 文件名不能全部是空格
   * 开发者上传单文件大小限制10GB
   */
  async createFile(params: {
    /** 父目录id，上传到根目录时填写 0 */
    parentFileID: number;
    /** 文件名要小于255个字符且不能包含以下任何字符："\/:*?|><。（注：不能重名）
     * containDir 为 true 时，传入路径+文件名，例如：/你好/123/测试文件.mp4 */
    filename: string;
    /** 文件md5 */
    etag: string;
    /** 文件大小，单位为 byte 字节 */
    size: number;
    /** 当有相同文件名时，文件处理策略（1保留两者，新文件名将自动添加后缀，2覆盖原文件） */
    duplicate?: number;
    /** 上传文件是否包含路径，默认false */
    containDir?: boolean;
  }): Promise<ApiResponse<ICreateFileResponse>> {
    return this.httpClient.post('/upload/v2/file/create', {
      parentFileID: params.parentFileID,
      filename: params.filename,
      etag: params.etag,
      size: params.size,
      ...(params.duplicate !== undefined && { duplicate: params.duplicate }),
      ...(params.containDir !== undefined && { containDir: params.containDir }),
    });
  }

  /**
   * 上传分片
   * 上传域名是创建文件接口响应中的servers
   * Content-Type: multipart/form-data
   * Node.js环境专用
   */
  async uploadSlice(params: {
    /** 上传域名（从创建文件接口的servers中获取） */
    uploadServer: string;
    /** 预上传ID */
    preuploadID: string;
    /** 分片序号，从1开始自增 */
    sliceNo: number;
    /** 当前分片md5 */
    sliceMD5: string;
    /** 分片二进制流 */
    slice: ArrayBuffer | Buffer | Uint8Array;
    /** 上传进度回调 */
    onProgress?: (progress: AxiosProgressEvent) => void;
  }): Promise<ApiResponse<IUploadSliceResponse>> {
    // 构建上传URL
    const uploadUrl = `${params.uploadServer}/upload/v2/file/slice`;

    // 创建FormData（Node.js环境使用form-data包，动态导入避免打包问题）
    const FormDataModule = await import('form-data');
    const FormData = FormDataModule.default || FormDataModule;
    const formData = new FormData();

    // 处理分片数据，转换为Buffer
    let sliceData: Buffer;
    if (Buffer.isBuffer(params.slice)) {
      sliceData = params.slice;
    } else if (params.slice instanceof Uint8Array) {
      sliceData = Buffer.from(params.slice);
    } else if (params.slice instanceof ArrayBuffer) {
      sliceData = Buffer.from(params.slice);
    } else {
      throw new Error('Unsupported slice type. Expected Buffer, Uint8Array, or ArrayBuffer.');
    }

    formData.append('preuploadID', params.preuploadID);
    formData.append('sliceNo', params.sliceNo.toString());
    formData.append('sliceMD5', params.sliceMD5);
    formData.append('slice', sliceData);

    // 获取认证token
    const authManager = this.httpClient.getAuthManager();
    const accessToken = await authManager.getAccessToken();

    // 发送multipart/form-data请求
    const config: any = {
      method: 'POST',
      url: uploadUrl,
      data: formData,
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${accessToken}`,
        'Platform': 'open_platform',
      },
    };

    if (params.onProgress) {
      config.onUploadProgress = params.onProgress;
    }

    const response = await axios(config);
    return response.data;
  }

  /**
   * 上传完毕
   * 分片上传完成后请求此接口，完成文件上传
   */
  async uploadComplete(params: {
    /** 预上传ID */
    preuploadID: string;
  }): Promise<ApiResponse<IUploadCompleteResponse>> {
    return this.httpClient.post('/upload/v2/file/upload_complete', {
      preuploadID: params.preuploadID,
    });
  }

  /**
   * 查询上传结果（用于异步模式）
   * 在异步模式下，上传完成后可以调用此方法查询上传结果
   * @param params 查询参数
   * @param params.preuploadID 预上传ID（从 uploadFile 的异步模式返回结果中获取）
   * @returns 上传结果，包含是否完成和文件ID
   */
  async queryUploadResult(params: {
    /** 预上传ID */
    preuploadID: string;
  }): Promise<ApiResponse<IUploadCompleteResponse>> {
    // 复用 uploadComplete 接口进行查询
    return this.uploadComplete(params);
  }

  /**
   * 获取上传域名
   * 返回可用的上传域名列表，存在多个可以任选其一
   */
  async getUploadDomain(): Promise<ApiResponse<string[]>> {
    const result = await this.httpClient.get('/upload/v2/file/domain');
    // API返回的data是数组，直接返回
    return result;
  }

  /**
   * 单步上传
   * 文件名要小于256个字符且不能包含以下任何字符："\/:*?|><
   * 文件名不能全部是空格
   * 此接口限制开发者上传单文件大小为1GB
   * 上传域名是获取上传域名接口响应中的域名
   * 此接口用于实现小文件单步上传一次HTTP请求交互即可完成上传
   * Node.js环境专用
   */
  async singleUpload(params: {
    /** 上传域名（从getUploadDomain接口获取） */
    uploadServer: string;
    /** 父目录id，上传到根目录时填写 0 */
    parentFileID: number;
    /** 文件名要小于255个字符且不能包含以下任何字符："\/:*?|><。（注：不能重名）
     * containDir 为 true 时，传入路径+文件名，例如：/你好/123/测试文件.mp4 */
    filename: string;
    /** 文件md5 */
    etag: string;
    /** 文件大小，单位为 byte 字节 */
    size: number;
    /** 文件二进制流 */
    file: ArrayBuffer | Buffer | Uint8Array;
    /** 当有相同文件名时，文件处理策略（1保留两者，新文件名将自动添加后缀，2覆盖原文件） */
    duplicate?: number;
    /** 上传文件是否包含路径，默认false */
    containDir?: boolean;
    /** 上传进度回调 */
    onProgress?: (progress: AxiosProgressEvent) => void;
  }): Promise<ApiResponse<ISingleUploadResponse>> {
    // 构建上传URL
    const uploadUrl = `${params.uploadServer}/upload/v2/file/single/create`;

    // 创建FormData（Node.js环境使用form-data包，动态导入避免打包问题）
    const FormDataModule = await import('form-data');
    const FormData = FormDataModule.default || FormDataModule;
    const formData = new FormData();

    // 处理文件数据，转换为Buffer
    let fileData: Buffer;
    if (Buffer.isBuffer(params.file)) {
      fileData = params.file;
    } else if (params.file instanceof Uint8Array) {
      fileData = Buffer.from(params.file);
    } else if (params.file instanceof ArrayBuffer) {
      fileData = Buffer.from(params.file);
    } else {
      throw new Error('Unsupported file type. Expected Buffer, Uint8Array, or ArrayBuffer.');
    }

    formData.append('parentFileID', params.parentFileID.toString());
    formData.append('filename', params.filename);
    formData.append('etag', params.etag);
    formData.append('size', params.size.toString());
    // 附加文件时指定文件名和内容类型
    formData.append('file', fileData, {
      filename: params.filename,
      contentType: 'application/octet-stream',
    });

    // 可选参数
    if (params.duplicate !== undefined) {
      formData.append('duplicate', params.duplicate.toString());
    }
    if (params.containDir !== undefined) {
      formData.append('containDir', params.containDir.toString());
    }

    // 获取认证token
    const authManager = this.httpClient.getAuthManager();
    const accessToken = await authManager.getAccessToken();

    // 发送multipart/form-data请求
    const config: any = {
      method: 'POST',
      url: uploadUrl,
      data: formData,
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${accessToken}`,
        'Platform': 'open_platform',
      },
    };

    if (params.onProgress) {
      config.onUploadProgress = params.onProgress;
    }

    const response = await axios(config);
    return response.data;
  }

  /**
   * 高级上传方法：一键上传文件
   * 自动处理所有上传步骤：创建文件、分片上传、上传完成、轮询等
   * 根据文件大小自动选择单步上传（<1GB）或分片上传（>=1GB）
   */
  async uploadFile(params: IUploadFileParams): Promise<IUploadFileResult> {
    const {
      filename,
      file,
      etag,
      parentFileID = 0,
      onProgress,
      pollInterval = 1000,
      maxPollAttempts = 300,
      duplicate,
      containDir,
      useSingleUpload,
      asyncMode = false, // 默认同步模式
    } = params;

    const fileSize = getFileSize(file);
    const ONE_GB = 1024 * 1024 * 1024; // 1GB

    // 判断是否使用单步上传（文件小于1GB且未明确指定）
    const shouldUseSingleUpload = useSingleUpload !== undefined
      ? useSingleUpload
      : fileSize < ONE_GB;

    // 1. 计算 MD5（如果未提供）
    let fileMd5 = etag;
    if (!fileMd5) {
      fileMd5 = await calculateMD5(file);
    }

    // 2. 单步上传（文件小于1GB）
    if (shouldUseSingleUpload) {
      // 获取上传域名
      const domainResult = await this.getUploadDomain();
      if (domainResult.code !== 0) {
        throw new Error(`获取上传域名失败: ${domainResult.message}`);
      }
      const uploadServer = domainResult.data[0];

      // 单步上传
      const singleUploadParams: any = {
        uploadServer,
        parentFileID,
        filename,
        etag: fileMd5,
        size: fileSize,
        file,
        onProgress: (progressEvent: AxiosProgressEvent) => {
          if (onProgress && progressEvent.total) {
            onProgress({
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              percent: (progressEvent.loaded / progressEvent.total) * 100,
            });
          }
        },
      };
      if (duplicate !== undefined) {
        singleUploadParams.duplicate = duplicate;
      }
      if (containDir !== undefined) {
        singleUploadParams.containDir = containDir;
      }
      const singleResult = await this.singleUpload(singleUploadParams);

      if (singleResult.code !== 0) {
        throw new Error(`单步上传失败: ${singleResult.message}`);
      }

      const { fileID, completed } = singleResult.data;

      if (completed && fileID) {
        if (onProgress) {
          onProgress({
            loaded: fileSize,
            total: fileSize,
            percent: 100,
          });
        }
        return {
          fileID,
          isReuse: false, // 单步上传不区分秒传
          isSingleUpload: true,
          isAsync: false,
        };
      } else {
        // 单步上传未完成，在异步模式下返回，同步模式下抛错
        if (asyncMode) {
          // 单步上传通常不会有 preuploadID，所以返回 fileID 为 0
          return {
            fileID: 0,
            isReuse: false,
            isSingleUpload: true,
            isAsync: true,
            // 单步上传没有 preuploadID，无法异步查询
          };
        } else {
          throw new Error('单步上传未完成或未返回文件ID');
        }
      }
    }

    // 3. 分片上传（文件大于等于1GB）
    let totalUploaded = 0;

    // 3.1 创建文件
    const createFileParams: any = {
      parentFileID,
      filename,
      etag: fileMd5,
      size: fileSize,
    };
    if (duplicate !== undefined) {
      createFileParams.duplicate = duplicate;
    }
    if (containDir !== undefined) {
      createFileParams.containDir = containDir;
    }
    const createFileResult = await this.createFile(createFileParams);

    if (createFileResult.code !== 0) {
      throw new Error(`创建文件失败: ${createFileResult.message}`);
    }

    const { reuse, preuploadID, fileID: initialFileID, sliceSize, servers } = createFileResult.data;

    // 3.2 如果是秒传，直接返回
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
        isSingleUpload: false,
      };
    }

    // 3.3 非秒传：分片上传
    if (!preuploadID || !servers || servers.length === 0) {
      throw new Error('创建文件失败：缺少预上传ID或上传服务器地址');
    }

    const uploadServer = servers[0]; // 使用第一个上传服务器
    const slices = sliceFile(file, sliceSize);
    const totalSlices = slices.length;

    for (let i = 0; i < slices.length; i++) {
      const slice = slices[i];
      const sliceNo = i + 1;

      // 计算分片MD5
      const sliceMd5 = await calculateSliceMD5(slice);

      // 上传分片
      await this.uploadSlice({
        uploadServer,
        preuploadID,
        sliceNo,
        sliceMD5: sliceMd5,
        slice,
        onProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            // 计算总进度：已上传的分片 + 当前分片的进度
            const sliceProgress = (progressEvent.loaded / progressEvent.total) * sliceSize;
            totalUploaded = i * sliceSize + sliceProgress;
            onProgress({
              loaded: totalUploaded,
              total: fileSize,
              percent: Math.min((totalUploaded / fileSize) * 100, 100),
              currentSlice: sliceNo,
              totalSlices,
            });
          }
        },
      });

      // 更新进度（分片上传完成）
      totalUploaded = (i + 1) * sliceSize;
      if (onProgress) {
        // 分片上传完成，但保留5%给服务器处理阶段
        const uploadPercent = Math.min((totalUploaded / fileSize) * 100, 95);
        onProgress({
          loaded: Math.min(totalUploaded, fileSize),
          total: fileSize,
          percent: uploadPercent,
          currentSlice: sliceNo,
          totalSlices,
        });
      }
    }

    // 3.4 上传完成并轮询
    // 所有分片上传完成，显示95%进度，剩余5%用于服务器处理
    if (onProgress) {
      onProgress({
        loaded: fileSize,
        total: fileSize,
        percent: 95,
        currentSlice: totalSlices,
        totalSlices,
      });
    }

    // 调用一次 uploadComplete 接口
    const firstCompleteResult = await this.uploadComplete({
      preuploadID,
    });

    if (firstCompleteResult.code !== 0) {
      throw new Error(`上传完成失败: ${firstCompleteResult.message}`);
    }

    const { completed: firstCompleted, fileID: firstFileID } = firstCompleteResult.data;

    // 如果已经完成，直接返回
    if (firstCompleted && firstFileID && firstFileID !== 0) {
      if (onProgress) {
        onProgress({
          loaded: fileSize,
          total: fileSize,
          percent: 100,
          currentSlice: totalSlices,
          totalSlices,
        });
      }
      return {
        fileID: firstFileID,
        isReuse: false,
        isSingleUpload: false,
        isAsync: false,
      };
    }

    // 异步模式：立即返回，不进行轮询
    if (asyncMode) {
      if (onProgress) {
        onProgress({
          loaded: fileSize,
          total: fileSize,
          percent: 95,
          currentSlice: totalSlices,
          totalSlices,
        });
      }
      return {
        fileID: firstFileID || 0,
        isReuse: false,
        isSingleUpload: false,
        isAsync: true,
        preuploadID, // 返回 preuploadID，用于后续查询
      };
    }

    // 同步模式：继续轮询直到完成
    let attempts = 0;
    while (attempts < maxPollAttempts) {
      const completeResult = await this.uploadComplete({
        preuploadID,
      });

      if (completeResult.code !== 0) {
        throw new Error(`上传完成失败: ${completeResult.message}`);
      }

      const { completed, fileID } = completeResult.data;

      if (completed && fileID && fileID !== 0) {
        // 真正完成，显示100%
        if (onProgress) {
          onProgress({
            loaded: fileSize,
            total: fileSize,
            percent: 100,
            currentSlice: totalSlices,
            totalSlices,
          });
        }
        return {
          fileID,
          isReuse: false,
          isSingleUpload: false,
          isAsync: false,
        };
      }

      // 如果未完成，在轮询过程中显示处理进度（95-99%）
      if (onProgress) {
        // 根据轮询次数显示处理进度，从95%逐渐增加到99%
        const processingPercent = Math.min(95 + (attempts / maxPollAttempts) * 4, 99);
        onProgress({
          loaded: fileSize,
          total: fileSize,
          percent: processingPercent,
          currentSlice: totalSlices,
          totalSlices,
        });
      }

      // 如果未完成，等待后继续轮询
      if (!completed) {
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
        attempts++;
      } else {
        // completed为true但fileID为0，继续轮询
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
        attempts++;
      }
    }

    throw new Error(`上传超时：超过最大轮询次数 ${maxPollAttempts}`);
  }
}

// 导出类型
export * from './types';

