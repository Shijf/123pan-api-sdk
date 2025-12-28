/**
 * 离线下载模块
 */

import { HttpClient } from '@123pan/core';
import type { ApiResponse, PaginatedResponse, OfflineTask, PaginationParams } from '@123pan/core';

/** 创建离线任务参数 */
export interface CreateOfflineTaskParams {
  /** 下载URL */
  url: string;
  /** 父目录ID（选填） */
  parentId?: string | number;
}

/** 批量创建离线任务参数 */
export interface BatchCreateOfflineTaskParams {
  /** 下载URL列表，支持多个URL */
  urls: string[];
  /** 父目录ID（选填），上传到根目录时填写 0 */
  parentId?: string | number;
}

/** 获取离线下载进度响应 */
export interface GetOfflineDownloadProcessResponse {
  /** 下载进度百分比，当文件下载失败时，该进度将会归零 */
  process: number;
  /** 下载状态：0-进行中，1-下载失败，2-下载成功，3-重试中 */
  status: 0 | 1 | 2 | 3;
}

export class OfflineModule {
  constructor(private httpClient: HttpClient) {}

  /**
   * 创建离线下载任务
   * @param params 创建任务参数
   * @param params.url 下载URL
   * @param params.parentId 父目录ID（选填）
   * @returns 离线任务
   */
  async createTask(params: CreateOfflineTaskParams): Promise<ApiResponse<OfflineTask>> {
    const requestBody: any = {
      url: params.url,
    };

    if (params.parentId !== undefined) {
      requestBody.parentId = typeof params.parentId === 'number' ? params.parentId : parseInt(params.parentId, 10);
    }

    return this.httpClient.post<OfflineTask>('/api/v1/offline/download', {
      url: params.url
    });
  }

  /**
   * 批量创建离线下载任务
   * 通过循环调用单个创建任务方法来实现批量创建
   * @param params 批量创建任务参数
   * @param params.urls 下载URL列表，支持多个URL
   * @param params.parentId 父目录ID（选填），上传到根目录时填写 0
   * @returns 所有创建的离线任务列表
   */
  async batchCreateTasks(params: BatchCreateOfflineTaskParams): Promise<ApiResponse<OfflineTask[]>> {
    const { urls, parentId } = params;
    const allTasks: OfflineTask[] = [];
    const errors: Array<{ url: string; error: string }> = [];

    // 循环调用单个创建任务方法
    for (const url of urls) {
      try {
        const taskParams: CreateOfflineTaskParams = { url };
        if (parentId !== undefined) {
          taskParams.parentId = parentId;
        }
        
        const result = await this.createTask(taskParams);

        if (result.code === 0 && result.data) {
          allTasks.push(result.data);
        } else {
          errors.push({
            url,
            error: result.message || '创建任务失败',
          });
        }
      } catch (err) {
        errors.push({
          url,
          error: err instanceof Error ? err.message : '未知错误',
        });
      }
    }

    // 如果有错误，返回部分成功的结果
    if (errors.length > 0) {
      return {
        code: 1,
        message: `部分任务创建失败，成功: ${allTasks.length}, 失败: ${errors.length}`,
        data: allTasks,
      };
    }

    // 所有任务都成功
    return {
      code: 0,
      message: 'ok',
      data: allTasks,
    };
  }

  /**
   * 获取离线下载进度
   * @param params 查询参数
   * @param params.taskID 离线下载任务ID
   * @returns 下载进度和状态
   */
  async getDownloadProcess(params: {
    /** 离线下载任务ID */
    taskID: number | string;
  }): Promise<ApiResponse<GetOfflineDownloadProcessResponse>> {
    const taskID = typeof params.taskID === 'string' ? parseInt(params.taskID, 10) : params.taskID;

    return this.httpClient.get<GetOfflineDownloadProcessResponse>('/api/v1/offline/download/process', {
      taskID,
    });
  }

  /**
   * 获取离线任务列表
   */
  async getTaskList(params: PaginationParams = {}): Promise<ApiResponse<PaginatedResponse<OfflineTask>>> {
    return this.httpClient.get('/api/v1/offline/list', params);
  }

  /**
   * 获取任务详情
   */
  async getTaskInfo(taskId: string): Promise<ApiResponse<OfflineTask>> {
    return this.httpClient.get(`/api/v1/offline/info/${taskId}`);
  }

  /**
   * 删除任务
   */
  async deleteTask(taskId: string): Promise<ApiResponse<void>> {
    return this.httpClient.delete(`/api/v1/offline/delete/${taskId}`);
  }

  /**
   * 暂停任务
   */
  async pauseTask(taskId: string): Promise<ApiResponse<void>> {
    return this.httpClient.post(`/api/v1/offline/pause/${taskId}`);
  }

  /**
   * 恢复任务
   */
  async resumeTask(taskId: string): Promise<ApiResponse<void>> {
    return this.httpClient.post(`/api/v1/offline/resume/${taskId}`);
  }
}
