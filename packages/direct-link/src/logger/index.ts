/**
 * 直链日志管理模块
 * 注意：此模块的API需要开通开发者权益
 */

import { HttpClient } from '@123pan/core';
import type { ApiResponse } from '@123pan/core';
import type {
  GetOfflineLogsParams,
  GetOfflineLogsResponse,
  GetTrafficLogsParams,
  GetTrafficLogsResponse,
} from './types';

export class LoggerModule {
  constructor(private httpClient: HttpClient) {}

  /**
   * 获取直链离线日志
   * 注意：此接口需要开通开发者权益，并且仅限查询近30天的日志数据
   * @param params 查询参数
   * @param params.startHour 开始时间，格式：2025010115（年月日时）
   * @param params.endHour 结束时间，格式：2025010116（年月日时）
   * @param params.pageNum 页数，从1开始
   * @param params.pageSize 分页大小
   * @returns 离线日志列表
   */
  async getOfflineLogs(params: GetOfflineLogsParams): Promise<ApiResponse<GetOfflineLogsResponse>> {
    const { startHour, endHour, pageNum, pageSize } = params;

    // 验证时间格式（10位数字：年月日时）
    const hourPattern = /^\d{10}$/;
    if (!hourPattern.test(startHour)) {
      throw new Error('startHour 格式错误，应为10位数字，如：2025010115（年月日时）');
    }
    if (!hourPattern.test(endHour)) {
      throw new Error('endHour 格式错误，应为10位数字，如：2025010116（年月日时）');
    }

    // 验证时间大小关系
    if (startHour >= endHour) {
      throw new Error('startHour 必须小于 endHour');
    }

    // 验证分页参数
    if (pageNum < 1) {
      throw new Error('pageNum 必须从1开始');
    }
    if (pageSize < 1) {
      throw new Error('pageSize 必须大于0');
    }

    // 验证时间范围（近30天）
    const now = new Date();
    const startDate = this.parseHourString(startHour);
    const daysDiff = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff > 30) {
      throw new Error('只能查询近30天的日志数据');
    }

    return this.httpClient.get<GetOfflineLogsResponse>('/api/v1/direct-link/offline/logs', {
      startHour,
      endHour,
      pageNum,
      pageSize,
    });
  }

  /**
   * 获取直链流量日志
   * 注意：此接口需要开通开发者权益，并且仅限查询近3天的日志数据
   * @param params 查询参数
   * @param params.pageNum 页数
   * @param params.pageSize 分页大小
   * @param params.startTime 开始时间，格式：2025-01-01 00:00:00
   * @param params.endTime 结束时间，格式：2025-01-01 23:59:59
   * @returns 流量日志列表
   */
  async getTrafficLogs(params: GetTrafficLogsParams): Promise<ApiResponse<GetTrafficLogsResponse>> {
    const { pageNum, pageSize, startTime, endTime } = params;

    // 验证时间格式（YYYY-MM-DD HH:MM:SS）
    const timePattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
    if (!timePattern.test(startTime)) {
      throw new Error('startTime 格式错误，应为：YYYY-MM-DD HH:MM:SS，如：2025-01-01 00:00:00');
    }
    if (!timePattern.test(endTime)) {
      throw new Error('endTime 格式错误，应为：YYYY-MM-DD HH:MM:SS，如：2025-01-01 23:59:59');
    }

    // 验证时间大小关系
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    if (startDate >= endDate) {
      throw new Error('startTime 必须小于 endTime');
    }

    // 验证分页参数
    if (pageNum < 1) {
      throw new Error('pageNum 必须大于等于1');
    }
    if (pageSize < 1) {
      throw new Error('pageSize 必须大于0');
    }

    // 验证时间范围（近3天）
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff > 3) {
      throw new Error('只能查询近3天的日志数据');
    }

    return this.httpClient.get<GetTrafficLogsResponse>('/api/v1/direct-link/log', {
      pageNum,
      pageSize,
      startTime,
      endTime,
    });
  }

  /**
   * 解析时间字符串为Date对象
   * @param hourStr 格式：2025010115
   * @returns Date对象
   */
  private parseHourString(hourStr: string): Date {
    const year = parseInt(hourStr.substring(0, 4), 10);
    const month = parseInt(hourStr.substring(4, 6), 10) - 1; // 月份从0开始
    const day = parseInt(hourStr.substring(6, 8), 10);
    const hour = parseInt(hourStr.substring(8, 10), 10);
    return new Date(year, month, day, hour);
  }
}

