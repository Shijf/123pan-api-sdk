/**
 * 图片查看/下载模块
 */

import { HttpClient } from '@123pan/core';
import axios, { AxiosResponse } from 'axios';
import type { ApiResponse } from '@123pan/core';
import {
  IGetImageUrlParams,
  IGetImageUrlResponse,
  IGetImageStreamResponse,
  IGetImageBlobResponse,
} from './types';

export class ViewModule {
  constructor(private httpClient: HttpClient) {}

  /**
   * 获取图片URL（支持尺寸参数）
   * 注意：目前只支持 width 和 height 参数，其他参数（压缩、格式等）暂不支持
   */
  async getImageUrl(params: IGetImageUrlParams): Promise<IGetImageUrlResponse> {
    // 先获取图片详情以获取原始URL
    const detailResult = await this.httpClient.get('/api/v1/oss/file/detail', {
      fileID: params.fileID,
    });

    if (detailResult.code !== 0) {
      throw new Error(`获取图片详情失败: ${detailResult.message}`);
    }

    const originalUrl = params.useCustomDomain
      ? detailResult.data.userSelfURL
      : detailResult.data.downloadURL;

    // 如果没有指定尺寸参数，直接返回原始URL
    if (params.width === undefined && params.height === undefined) {
      return {
        url: originalUrl,
        originalUrl,
      };
    }

    // 构建带尺寸参数的URL
    const url = new URL(originalUrl);
    const searchParams = url.searchParams;

    // 添加尺寸参数（仅支持宽高）
    if (params.width !== undefined) {
      searchParams.set('w', params.width.toString());
    }
    if (params.height !== undefined) {
      searchParams.set('h', params.height.toString());
    }

    return {
      url: url.toString(),
      originalUrl,
    };
  }

  /**
   * 获取图片流（Node.js环境）
   * 返回可读流，适合处理大文件
   */
  async getImageStream(params: IGetImageUrlParams): Promise<IGetImageStreamResponse> {
    const { url } = await this.getImageUrl(params);

    // 使用axios获取流
    const response: AxiosResponse<NodeJS.ReadableStream> = await axios({
      method: 'GET',
      url,
      responseType: 'stream',
    });

    const contentLength = response.headers['content-length']
      ? parseInt(response.headers['content-length'], 10)
      : undefined;

    return {
      stream: response.data,
      contentType: response.headers['content-type'] || 'image/jpeg',
      ...(contentLength !== undefined && { contentLength }),
    };
  }

  /**
   * 获取图片Blob（浏览器环境）
   * 返回Blob对象，适合在浏览器中使用
   */
  async getImageBlob(params: IGetImageUrlParams): Promise<IGetImageBlobResponse> {
    const { url } = await this.getImageUrl(params);

    // 使用axios获取Blob
    const response: AxiosResponse<Blob> = await axios({
      method: 'GET',
      url,
      responseType: 'blob',
    });

    const contentLength = response.headers['content-length']
      ? parseInt(response.headers['content-length'], 10)
      : undefined;

    return {
      blob: response.data,
      contentType: response.headers['content-type'] || 'image/jpeg',
      ...(contentLength !== undefined && { contentLength }),
    };
  }

  /**
   * 获取图片Buffer（Node.js环境）
   * 将整个图片加载到内存中，适合小文件
   */
  async getImageBuffer(params: IGetImageUrlParams): Promise<Buffer> {
    const { url } = await this.getImageUrl(params);

    const response: AxiosResponse<Buffer> = await axios({
      method: 'GET',
      url,
      responseType: 'arraybuffer',
    });

    return Buffer.from(response.data);
  }

  /**
   * 获取图片ArrayBuffer（浏览器环境）
   * 将整个图片加载到内存中，适合小文件
   */
  async getImageArrayBuffer(params: IGetImageUrlParams): Promise<ArrayBuffer> {
    const { url } = await this.getImageUrl(params);

    const response: AxiosResponse<ArrayBuffer> = await axios({
      method: 'GET',
      url,
      responseType: 'arraybuffer',
    });

    return response.data;
  }
}

// 导出类型
export * from './types';

