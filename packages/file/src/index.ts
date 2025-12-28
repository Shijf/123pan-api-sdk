/**
 * 文件管理模块
 */

import { HttpClient } from '@123pan/core';
import type { ApiResponse, PaginatedResponse, FileInfo, PaginationParams, SdkConfig, UploadProgressCallback } from '@123pan/core';
import { UploadModule } from './upload';
import { ShareModule } from './share';

export interface FileListParams extends PaginationParams {
  parentId: string; // 必需参数
  keyword?: string;
  fileType?: string;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

/** 文件列表项 */
export interface FileListItem {
  /** 文件Id */
  fileId: number;
  /** 文件名 */
  filename: string;
  /** 0-文件  1-文件夹 */
  type: number;
  /** 文件大小 */
  size: number;
  /** md5 */
  etag: string;
  /** 文件审核状态。 大于 100 为审核驳回文件 */
  status: number;
  /** 目录ID */
  parentFileId: number;
  /** 文件分类：0-未知 1-音频 2-视频 3-图片 */
  category: number;
  /** 文件是否在回收站标识：0 否 1是 */
  trashed: number;
  /** 惩罚标记 */
  punishFlag?: number;
  /** 关联s3_key的初始用户标识 */
  s3KeyFlag?: string;
  /** m0是ceph，m1以上为minio */
  storageNode?: string;
  /** 创建时间 */
  createAt?: string;
  /** 更新时间 */
  updateAt?: number;
}

/** 获取文件列表响应 */
export interface GetFileListResponse {
  /** -1代表最后一页（无需再翻页查询），其他代表下一页开始的文件id */
  lastFileId: number;
  /** 文件列表 */
  fileList: FileListItem[];
}

/** 获取下载信息响应 */
export interface GetDownloadInfoResponse {
  /** 下载地址 */
  downloadUrl: string;
}

export interface RenameItem {
  /** 文件ID */
  fileID: number | string;
  /** 新的文件名 */
  newName: string;
}

export interface RenameSuccessItem {
  /** 文件ID */
  fileID: number;
  /** 更新时间 */
  updateAt: string;
}

export interface RenameFailItem {
  /** 文件ID */
  fileID: number;
  /** 错误原因 */
  message: string;
}

export interface BatchRenameResponse {
  /** 成功文件列表 */
  successList: RenameSuccessItem[];
  /** 失败文件列表 */
  failList: RenameFailItem[];
}

/** 文件详情信息 */
export interface FileDetailInfo {
  /** 文件ID */
  fileId: number;
  /** 文件名 */
  filename: string;
  /** 目录ID */
  parentFileId: number;
  /** 0-文件  1-文件夹 */
  type: number;
  /** md5 */
  etag: string;
  /** 文件大小 */
  size: number;
  /** 文件分类：0-未知 1-音频 2-视频 3-图片 */
  category: number;
  /** 文件审核状态。 大于 100 为审核驳回文件 */
  status: number;
  /** 惩罚标记 */
  punishFlag: number;
  /** 关联s3_key的初始用户标识 */
  s3KeyFlag: string;
  /** m0是ceph，m1以上为minio */
  storageNode: string;
  /** 是否在回收站：[0：否，1：是] */
  trashed: number;
  /** 创建时间 */
  createAt: string;
  /** 更新时间 */
  updateAt: number;
}

/** 获取文件详情响应 */
export interface GetFileInfosResponse {
  /** 文件列表（注意：API返回的是list字段） */
  list: FileDetailInfo[];
}

export class FileModule {
  public readonly upload: UploadModule;
  public readonly share: ShareModule;

  constructor(private httpClient: HttpClient) {
    this.upload = new UploadModule(this.httpClient);
    this.share = new ShareModule(this.httpClient);
  }

  /**
   * 批量重命名文件
   * 最多支持同时30个文件重命名，如果超过会自动分批处理（每批20个）
   * @param params 重命名参数
   * @param params.renameList 重命名列表，每个元素包含文件ID和新文件名
   * @returns 返回成功和失败的文件列表
   */
  async batchRename(params: {
    /** 重命名列表 */
    renameList: RenameItem[];
  }): Promise<ApiResponse<BatchRenameResponse>> {
    const { renameList } = params;
    const BATCH_SIZE = 20; // 每批处理20个，API限制最多30个，使用20更安全

    // 如果数量小于等于批次大小，直接处理
    if (renameList.length <= BATCH_SIZE) {
      return this._renameBatch(renameList);
    }

    // 分批处理
    const allSuccessList: RenameSuccessItem[] = [];
    const allFailList: RenameFailItem[] = [];

    for (let i = 0; i < renameList.length; i += BATCH_SIZE) {
      const batch = renameList.slice(i, i + BATCH_SIZE);
      const result = await this._renameBatch(batch);

      if (result.code === 0 && result.data) {
        allSuccessList.push(...result.data.successList);
        allFailList.push(...result.data.failList);
      } else {
        // 如果批次请求失败，将所有文件添加到失败列表
        batch.forEach((item) => {
          allFailList.push({
            fileID: typeof item.fileID === 'string' ? parseInt(item.fileID, 10) : item.fileID,
            message: result.message || '批量重命名请求失败',
          });
        });
      }
    }

    return {
      code: 0,
      message: 'ok',
      data: {
        successList: allSuccessList,
        failList: allFailList,
      },
    };
  }

  /**
   * 删除文件
   * 支持删除至回收站或彻底删除，通过 permanent 参数区分
   * 最多支持同时100个文件删除，如果超过会自动分批处理（每批100个）
   * @param params 删除参数
   * @param params.fileIDs 文件ID数组
   * @param params.permanent 是否彻底删除，默认false（删除至回收站）
   * @returns 删除结果
   */
  async deleteFiles(params: {
    /** 文件ID数组 */
    fileIDs: (number | string)[];
    /** 是否彻底删除，默认false（删除至回收站）
     * - false: 删除至回收站（可恢复）
     * - true: 彻底删除（不可恢复，文件必须在回收站中）
     */
    permanent?: boolean;
  }): Promise<ApiResponse<null>> {
    const { fileIDs, permanent = false } = params;
    const BATCH_SIZE = 100; // 每批处理100个，API限制最多100个

    // 如果数量小于等于批次大小，直接处理
    if (fileIDs.length <= BATCH_SIZE) {
      return this._deleteBatch(fileIDs, permanent);
    }

    // 分批处理
    for (let i = 0; i < fileIDs.length; i += BATCH_SIZE) {
      const batch = fileIDs.slice(i, i + BATCH_SIZE);
      const result = await this._deleteBatch(batch, permanent);

      // 如果某批失败，返回错误（不继续处理后续批次）
      if (result.code !== 0) {
        return result;
      }
    }

    // 所有批次都成功
    return {
      code: 0,
      message: 'ok',
      data: null,
    };
  }

  /**
   * 移动文件
   * 批量移动文件，单级最多支持100个，如果超过会自动分批处理（每批100个）
   * @param params 移动参数
   * @param params.fileIDs 文件ID数组
   * @param params.toParentFileID 要移动到的目标文件夹id，移动到根目录时填写0
   * @returns 移动结果
   */
  async moveFiles(params: {
    /** 文件ID数组 */
    fileIDs: (number | string)[];
    /** 要移动到的目标文件夹id，移动到根目录时填写0 */
    toParentFileID: number;
  }): Promise<ApiResponse<null>> {
    const { fileIDs, toParentFileID } = params;
    const BATCH_SIZE = 100; // 每批处理100个，API限制最多100个

    // 如果数量小于等于批次大小，直接处理
    if (fileIDs.length <= BATCH_SIZE) {
      return this._moveBatch(fileIDs, toParentFileID);
    }

    // 分批处理
    for (let i = 0; i < fileIDs.length; i += BATCH_SIZE) {
      const batch = fileIDs.slice(i, i + BATCH_SIZE);
      const result = await this._moveBatch(batch, toParentFileID);

      // 如果某批失败，返回错误（不继续处理后续批次）
      if (result.code !== 0) {
        return result;
      }
    }

    // 所有批次都成功
    return {
      code: 0,
      message: 'ok',
      data: null,
    };
  }

  /**
   * 执行一批移动请求（内部方法）
   */
  private async _moveBatch(
    fileIDs: (number | string)[],
    toParentFileID: number
  ): Promise<ApiResponse<null>> {
    // 转换为数字数组
    const fileIDsNum = fileIDs.map((id) => (typeof id === 'string' ? parseInt(id, 10) : id));

    return this.httpClient.post('/api/v1/file/move', {
      fileIDs: fileIDsNum,
      toParentFileID,
    });
  }

  /**
   * 获取文件列表
   * 注意：此接口查询结果包含回收站的文件，需自行根据字段trashed判断处理
   * @param params 查询参数
   * @param params.parentFileId 文件夹ID，根目录传0
   * @param params.limit 每页文件数量，最大不超过100
   * @param params.searchData 搜索关键字（选填，将无视文件夹ID参数，进行全局查找）
   * @param params.searchMode 搜索模式（选填）：0-全文模糊搜索，1-精准搜索
   * @param params.lastFileId 翻页查询时需要填写（选填）
   * @returns 文件列表
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

  /**
   * 获取文件详情
   * 支持批量获取多个文件的详情信息
   * @param params 查询参数
   * @param params.fileIds 文件ID数组
   * @returns 文件详情列表
   */
  async getFileInfos(params: {
    /** 文件ID数组 */
    fileIds: (number | string)[];
  }): Promise<ApiResponse<GetFileInfosResponse>> {
    const { fileIds } = params;
    
    // 转换为数字数组
    const fileIdsNum = fileIds.map((id) => (typeof id === 'string' ? parseInt(id, 10) : id));

    const result = await this.httpClient.post<{
      list?: FileDetailInfo[];
    }>('/api/v1/file/infos', {
      fileIds: fileIdsNum,
    });

    // API返回的是list字段，但我们需要统一为GetFileInfosResponse格式
    return {
      ...result,
      data: {
        list: result.data?.list || [],
      },
    };
  }

  /**
   * 执行一批删除请求（内部方法）
   */
  private async _deleteBatch(
    fileIDs: (number | string)[],
    permanent: boolean
  ): Promise<ApiResponse<null>> {
    // 转换为数字数组
    const fileIDsNum = fileIDs.map((id) => (typeof id === 'string' ? parseInt(id, 10) : id));

    // 根据 permanent 参数选择不同的接口
    const endpoint = permanent ? '/api/v1/file/delete' : '/api/v1/file/trash';

    return this.httpClient.post(endpoint, {
      fileIDs: fileIDsNum,
    });
  }

  /**
   * 获取文件下载信息
   * @param params 下载参数
   * @param params.fileId 文件ID
   * @returns 下载信息（包含下载地址）
   */
  async getDownloadInfo(params: {
    /** 文件ID */
    fileId: number | string;
  }): Promise<ApiResponse<GetDownloadInfoResponse>> {
    const fileId = typeof params.fileId === 'string' ? parseInt(params.fileId, 10) : params.fileId;

    return this.httpClient.get('/api/v1/file/download_info', {
      fileId,
    });
  }

  /**
   * 执行一批重命名请求（内部方法）
   */
  private async _renameBatch(renameList: RenameItem[]): Promise<ApiResponse<BatchRenameResponse>> {
    // 构建 renameList，格式为 "文件ID|新的文件名"
    const renameListStr = renameList.map((item) => {
      const fileID = typeof item.fileID === 'string' ? item.fileID : item.fileID.toString();
      return `${fileID}|${item.newName}`;
    });

    const result = await this.httpClient.post<{
      successList?: Array<{ fileID: number; updateAt: string }>;
      failList?: Array<{ fileID: number; message: string }>;
    }>('/api/v1/file/rename', {
      renameList: renameListStr,
    });

    if (result.code !== 0) {
      return {
        ...result,
        data: {
          successList: [],
          failList: renameList.map((item) => ({
            fileID: typeof item.fileID === 'string' ? parseInt(item.fileID, 10) : item.fileID,
            message: result.message || '批量重命名失败',
          })),
        },
      };
    }

    return {
      ...result,
      data: {
        successList: result.data?.successList || [],
        failList: result.data?.failList || [],
      },
    };
  }
}

// 导出上传模块和类型
export { UploadModule } from './upload';
export type {
  ICreateFolderResponse,
  ICreateFileResponse,
  IUploadSliceResponse,
  IUploadCompleteResponse,
  IGetUploadDomainResponse,
  ISingleUploadResponse,
  IUploadFileParams,
  IUploadFileResult,
  UploadProgressCallback as UploadProgressCallbackOfFile,
} from './upload/types';

// 导出分享模块和类型
export { ShareModule } from './share';
export type {
  ShareExpireDays, TrafficSwitch, TrafficLimitSwitch,
  CreateShareParams, CreateShareResponse,
  CreatePaidShareParams, CreatePaidShareResponse,
} from './share/types';
