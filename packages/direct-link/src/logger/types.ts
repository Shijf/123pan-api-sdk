/**
 * 日志模块类型定义
 */

/** 获取离线日志参数 */
export interface GetOfflineLogsParams {
  /** 开始时间，格式：2025010115（年月日时） */
  startHour: string;
  /** 结束时间，格式：2025010116（年月日时） */
  endHour: string;
  /** 页数，从1开始 */
  pageNum: number;
  /** 分页大小 */
  pageSize: number;
}

/** 离线日志项 */
export interface OfflineLogItem {
  /** 唯一id */
  id: number;
  /** 文件名 */
  fileName: string;
  /** 文件大小（字节） */
  fileSize: number;
  /** 日志时间范围，如 "2025-06-20 15:00~16:00" */
  logTimeRange: string;
  /** 下载地址 */
  downloadURL: string;
}

/** 获取离线日志响应 */
export interface GetOfflineLogsResponse {
  /** 总数 */
  total: number;
  /** 日志列表 */
  list: OfflineLogItem[];
}

/** 获取流量日志参数 */
export interface GetTrafficLogsParams {
  /** 页数 */
  pageNum: number;
  /** 分页大小 */
  pageSize: number;
  /** 开始时间，格式：2025-01-01 00:00:00 */
  startTime: string;
  /** 结束时间，格式：2025-01-01 23:59:59 */
  endTime: string;
}

/** 流量日志项 */
export interface TrafficLogItem {
  /** 唯一ID */
  uniqueID: string;
  /** 文件名 */
  fileName: string;
  /** 文件大小（字节） */
  fileSize: number;
  /** 文件路径 */
  filePath: string;
  /** 直链URL */
  directLinkURL: string;
  /** 文件来源：1-全部文件，2-图床 */
  fileSource: 1 | 2;
  /** 消耗流量（字节） */
  totalTraffic: number;
}

/** 获取流量日志响应 */
export interface GetTrafficLogsResponse {
  /** 总数 */
  total: number;
  /** 流量日志列表 */
  list: TrafficLogItem[];
}

