/**
 * 分享模块类型定义
 */

import type { ApiResponse } from '@123pan/core';

/** 分享有效期天数（枚举值） */
export type ShareExpireDays = 0 | 1 | 7 | 30;

/** 分享提取流量包开关 */
export type TrafficSwitch = 1 | 2 | 3 | 4;
// 1: 全部关闭
// 2: 打开游客免登录提取
// 3: 打开超流量用户提取
// 4: 全部开启

/** 分享提取流量包流量限制开关 */
export type TrafficLimitSwitch = 1 | 2;
// 1: 关闭限制
// 2: 打开限制

/** 创建分享链接参数 */
export interface CreateShareParams {
  /** 分享链接名称 */
  shareName: string;
  /** 分享链接有效期天数，枚举值：1、7、30、0（0代表永久） */
  shareExpire: ShareExpireDays;
  /** 分享文件ID列表，支持数组或逗号分割的字符串，最多100个 */
  fileIDList: (number | string)[] | string;
  /** 分享链接提取码（选填） */
  sharePwd?: string;
  /** 分享提取流量包开关（选填） */
  trafficSwitch?: TrafficSwitch;
  /** 分享提取流量包流量限制开关（选填） */
  trafficLimitSwitch?: TrafficLimitSwitch;
  /** 分享提取流量包限制流量，单位：字节（选填） */
  trafficLimit?: number;
}

/** 创建分享链接响应 */
export interface CreateShareResponse {
  /** 分享ID */
  shareID: number;
  /** 分享码，需要拼接到 https://www.123pan.com/s/ 后面访问 */
  shareKey: string;
}

/** 创建付费分享链接参数 */
export interface CreatePaidShareParams {
  /** 分享链接名称，要小于35个字符且不能包含特殊字符 */
  shareName: string;
  /** 分享文件ID列表，支持数组或逗号分割的字符串，最多100个 */
  fileIDList: (number | string)[] | string;
  /** 付费金额，最小1元，最大1000元 */
  payAmount: number;
  /** 是否开启打赏（选填）：0-否，1-是 */
  isReward?: 0 | 1;
  /** 资源描述（选填） */
  resourceDesc?: string;
  /** 分享提取流量包开关（选填） */
  trafficSwitch?: TrafficSwitch;
  /** 分享提取流量包流量限制开关（选填） */
  trafficLimitSwitch?: TrafficLimitSwitch;
  /** 分享提取流量包限制流量，单位：字节（选填） */
  trafficLimit?: number;
}

/** 创建付费分享链接响应 */
export interface CreatePaidShareResponse {
  /** 分享ID */
  shareID: number;
  /** 分享码，需要拼接到 https://www.123pan.com/ps/ 后面访问 */
  shareKey: string;
}

