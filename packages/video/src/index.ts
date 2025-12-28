/**
 * 视频转码模块
 */

import { HttpClient } from '@123pan/core';
import type { ApiResponse } from '@123pan/core';
import type { GetFileListResponse } from '@123pan/file';
import { UploadModule } from './upload';
import { InfoModule } from './info';

/** 视频转码操作参数 */
export interface TranscodeVideoParams {
  /** 文件ID */
  fileId: number | string;
  /** 编码方式，如 "H.264" */
  codecName: string;
  /** 视频时长，单位：秒 */
  videoTime: number;
  /** 要转码的分辨率，多个之间以逗号分割，如 "2160P,1080P,720P"（注意P是大写） */
  resolutions: string | string[];
}

/** 视频转码操作响应 */
export interface TranscodeVideoResponse {
  /** 转码结果消息，如 "2160P&1080P&720P已成功开始转码，请在转码结果中查询" */
  message: string;
}

/** 删除转码视频参数 */
export interface DeleteTranscodeVideoParams {
  /** 文件ID */
  fileId: number | string;
  /** 业务类型，固定为 2 */
  businessType?: 2;
  /** 删除类型：1-删除原文件，2-删除原文件+转码后的文件 */
  trashed: 1 | 2;
}

/** 下载响应（通用） */
export interface DownloadResponse {
  /** 下载地址 */
  downloadUrl: string;
  /** 转码空间是否已满 */
  isFull: boolean;
}

/** 下载单个转码文件参数 */
export interface DownloadTranscodeFileParams {
  /** 文件ID */
  fileId: number | string;
  /** 分辨率，如 "1080P", "720P" */
  resolution: string;
  /** 下载类型：1-下载m3u8文件，2-下载ts文件 */
  type: 1 | 2;
  /** ts文件名称（type=2时必填），如 "001" */
  tsName?: string;
}

/** 下载全部转码文件参数 */
export interface DownloadAllTranscodeFilesParams {
  /** 文件ID */
  fileId: number | string;
  /** 下载的zip文件名 */
  zipName: string;
}

/** 下载全部转码文件响应 */
export interface DownloadAllTranscodeFilesResponse {
  /** 是否正在下载中 */
  isDownloading: boolean;
  /** 转码空间是否已满 */
  isFull: boolean;
  /** 下载地址（下载完成后才有） */
  downloadUrl: string;
}

export class VideoModule {
  public readonly upload: UploadModule;
  public readonly info: InfoModule;

  constructor(private httpClient: HttpClient) {
    this.upload = new UploadModule(this.httpClient);
    this.info = new InfoModule(this.httpClient);
  }

  /**
   * 视频转码操作
   * 启动视频转码任务，支持多分辨率同时转码
   * @param params 转码参数
   * @param params.fileId 文件ID
   * @param params.codecName 编码方式，如 "H.264"
   * @param params.videoTime 视频时长，单位：秒
   * @param params.resolutions 要转码的分辨率，支持数组或逗号分隔字符串，如 "2160P,1080P,720P"（注意P是大写）
   * @returns 转码结果消息
   */
  async transcodeVideo(params: TranscodeVideoParams): Promise<ApiResponse<string>> {
    const { fileId, codecName, videoTime, resolutions } = params;
    
    // 处理 fileId
    const fileIdNum = typeof fileId === 'string' ? parseInt(fileId, 10) : fileId;
    
    // 处理 resolutions：支持数组或字符串
    let resolutionsStr: string;
    if (Array.isArray(resolutions)) {
      resolutionsStr = resolutions.join(',');
    } else {
      resolutionsStr = resolutions;
    }
    
    // 验证分辨率格式（P必须大写）
    const resolutionList = resolutionsStr.split(',').map(r => r.trim());
    const invalidResolutions = resolutionList.filter(r => {
      // 检查是否包含小写p
      return r.includes('p') && !r.includes('P');
    });
    
    if (invalidResolutions.length > 0) {
      throw new Error(`分辨率格式错误：${invalidResolutions.join(', ')}。注意：P必须大写，如 "2160P,1080P,720P"`);
    }
    
    const requestBody = {
      fileId: fileIdNum,
      codecName,
      videoTime,
      resolutions: resolutionsStr,
    };
    
    // API返回的data就是字符串消息
    return this.httpClient.post<string>('/api/v1/transcode/video', requestBody);
  }

  /**
   * 删除转码视频
   * 可选择只删除原文件或同时删除转码后的文件
   * @param params 删除参数
   * @param params.fileId 文件ID
   * @param params.businessType 业务类型，固定为 2（默认）
   * @param params.trashed 删除类型：1-删除原文件，2-删除原文件+转码后的文件
   * @returns 删除结果消息
   */
  async deleteTranscodeVideo(params: DeleteTranscodeVideoParams): Promise<ApiResponse<string>> {
    const { fileId, businessType = 2, trashed } = params;
    
    // 处理 fileId
    const fileIdNum = typeof fileId === 'string' ? parseInt(fileId, 10) : fileId;
    
    // 验证 trashed 参数
    if (trashed !== 1 && trashed !== 2) {
      throw new Error('trashed 参数必须为 1（删除原文件）或 2（删除原文件+转码后的文件）');
    }
    
    const requestBody = {
      fileId: fileIdNum,
      businessType, // 固定为 2
      trashed,
    };
    
    // API返回的data是字符串消息："删除文件成功"
    return this.httpClient.post<string>('/api/v1/transcode/delete', requestBody);
  }

  /**
   * 下载原文件
   * 获取转码空间中原始视频文件的下载地址
   * @param params 下载参数
   * @param params.fileId 文件ID
   * @returns 下载地址和空间状态
   */
  async downloadOriginalFile(params: {
    /** 文件ID */
    fileId: number | string;
  }): Promise<ApiResponse<DownloadResponse>> {
    const fileId = typeof params.fileId === 'string' ? parseInt(params.fileId, 10) : params.fileId;

    return this.httpClient.post<DownloadResponse>('/api/v1/transcode/file/download', {
      fileId,
    });
  }

  /**
   * 下载单个转码文件（m3u8 或 ts）
   * 获取指定分辨率的 m3u8 文件或 ts 文件的下载地址
   * @param params 下载参数
   * @param params.fileId 文件ID
   * @param params.resolution 分辨率，如 "1080P", "720P"
   * @param params.type 下载类型：1-下载m3u8文件，2-下载ts文件
   * @param params.tsName ts文件名称（type=2时必填），如 "001"
   * @returns 下载地址和空间状态
   */
  async downloadTranscodeFile(params: DownloadTranscodeFileParams): Promise<ApiResponse<DownloadResponse>> {
    const { fileId, resolution, type, tsName } = params;

    // 处理 fileId
    const fileIdNum = typeof fileId === 'string' ? parseInt(fileId, 10) : fileId;

    // 验证 type 参数
    if (type !== 1 && type !== 2) {
      throw new Error('type 参数必须为 1（下载m3u8文件）或 2（下载ts文件）');
    }

    // 验证 tsName（type=2时必填）
    if (type === 2 && !tsName) {
      throw new Error('下载 ts 文件时，tsName 参数必填');
    }

    const requestBody: any = {
      fileId: fileIdNum,
      resolution,
      type,
    };

    // type=2时才添加 tsName
    if (type === 2 && tsName) {
      requestBody.tsName = tsName;
    }

    return this.httpClient.post<DownloadResponse>('/api/v1/transcode/m3u8_ts/download', requestBody);
  }

  /**
   * 下载全部转码文件
   * 下载指定视频的所有转码文件（打包为zip）
   * 注意：此接口需要轮询查询结果，建议使用 downloadAllTranscodeFilesWithPolling
   * @param params 下载参数
   * @param params.fileId 文件ID
   * @param params.zipName 下载的zip文件名
   * @returns 下载状态和地址
   */
  async downloadAllTranscodeFiles(params: DownloadAllTranscodeFilesParams): Promise<ApiResponse<DownloadAllTranscodeFilesResponse>> {
    const { fileId, zipName } = params;

    // 处理 fileId
    const fileIdNum = typeof fileId === 'string' ? parseInt(fileId, 10) : fileId;

    return this.httpClient.post<DownloadAllTranscodeFilesResponse>('/api/v1/transcode/file/download/all', {
      fileId: fileIdNum,
      zipName,
    });
  }

  /**
   * 下载全部转码文件（自动轮询）
   * 自动轮询直到下载链接准备完成
   * @param params 下载参数
   * @param params.fileId 文件ID
   * @param params.zipName 下载的zip文件名
   * @param params.pollingInterval 轮询间隔（毫秒），默认10秒
   * @param params.maxAttempts 最大轮询次数，默认30次
   * @param params.onPolling 轮询回调函数
   * @returns 下载地址
   */
  async downloadAllTranscodeFilesWithPolling(params: {
    /** 文件ID */
    fileId: number | string;
    /** 下载的zip文件名 */
    zipName: string;
    /** 轮询间隔（毫秒），默认10秒 */
    pollingInterval?: number;
    /** 最大轮询次数，默认30次 */
    maxAttempts?: number;
    /** 轮询回调函数 */
    onPolling?: (attempt: number, isDownloading: boolean, isFull: boolean) => void;
  }): Promise<ApiResponse<DownloadAllTranscodeFilesResponse>> {
    const { fileId, zipName, pollingInterval = 10000, maxAttempts = 30, onPolling } = params;

    let attempt = 0;

    while (attempt < maxAttempts) {
      attempt++;

      const result = await this.downloadAllTranscodeFiles({ fileId, zipName });

      // 触发回调
      if (onPolling && result.data) {
        onPolling(attempt, result.data.isDownloading, result.data.isFull);
      }

      // 如果请求失败，直接返回错误
      if (result.code !== 0) {
        return result;
      }

      // 如果转码空间已满，直接返回
      if (result.data && result.data.isFull) {
        return result;
      }

      // 如果已经下载完成（不在下载中 且 有下载地址），返回结果
      if (result.data && !result.data.isDownloading && result.data.downloadUrl) {
        return result;
      }

      // 如果还在下载中且未达到最大次数，等待后继续轮询
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, pollingInterval));
      }
    }

    // 达到最大轮询次数仍未完成
    return {
      code: -1,
      message: `轮询超时：已尝试 ${maxAttempts} 次，仍未准备好下载链接`,
      data: null as any,
    };
  }

  /**
   * 获取转码空间文件列表
   * 注意：此接口查询结果包含回收站的文件，需自行根据字段trashed判断处理
   * @param params 查询参数
   * @param params.parentFileId 文件夹ID，根目录传0
   * @param params.limit 每页文件数量，最大不超过100
   * @param params.searchData 搜索关键字（选填，将无视文件夹ID参数，进行全局查找）
   * @param params.searchMode 搜索模式（选填）：0-全文模糊搜索，1-精准搜索
   * @param params.lastFileId 翻页查询时需要填写（选填）
   * @returns 文件列表（与云盘空间文件列表结构相同）
   */
  async getFileList(params: {
    /** 文件夹ID，根目录传0 */
    parentFileId: number;
    /** 每页文件数量，最大不超过100 */
    limit: number;
    /** 搜索关键字（选填，将无视文件夹ID参数，进行全局查找） */
    searchData?: string;
    /** 搜索模式（选填）：0-全文模糊搜索，1-精准搜索 */
    searchMode?: 0 | 1;
    /** 翻页查询时需要填写（选填） */
    lastFileId?: number;
  }): Promise<ApiResponse<GetFileListResponse>> {
    const { parentFileId, limit, searchData, searchMode, lastFileId } = params;

    // 构建查询参数
    const queryParams: Record<string, any> = {
      parentFileId,
      limit: Math.min(limit, 100), // 限制最大100
      businessType: 2, // 固定为2，代表转码空间
    };

    if (searchData !== undefined) {
      queryParams.searchData = searchData;
    }
    if (searchMode !== undefined) {
      queryParams.searchMode = searchMode;
    }
    if (lastFileId !== undefined) {
      queryParams.lastFileId = lastFileId;
    }

    return this.httpClient.get<GetFileListResponse>('/api/v2/file/list', queryParams);
  }
}

// 导出上传模块类型
export type {
  UploadFromCloudDiskFileItem,
  UploadFromCloudDiskParams,
  UploadFromCloudDiskResponse,
} from './upload/types';

// 导出信息模块类型
export type {
  GetTranscodeFolderInfoResponse,
  GetVideoResolutionsResponse,
  TranscodeListItem,
  GetTranscodeListResponse,
  TranscodeRecordItem,
  GetTranscodeRecordResponse,
  TranscodeFileItem,
  TranscodeResultItem,
  GetTranscodeResultResponse,
} from './info/types';

// 从 file 模块导出文件列表相关类型（避免重复定义）
export type { GetFileListResponse, FileListItem } from '@123pan/file';
