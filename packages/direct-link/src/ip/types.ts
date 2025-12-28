/**
 * IP黑名单模块类型定义
 */

/** 开启关闭IP黑名单参数 */
export interface ToggleIpBlacklistParams {
  /** 状态：1-启用，2-禁用 */
  Status: 1 | 2;
}

/** 开启关闭IP黑名单响应 */
export interface ToggleIpBlacklistResponse {
  /** 操作是否完成 */
  Done: boolean;
}

/** 更新IP黑名单列表参数 */
export interface UpdateIpBlacklistParams {
  /** IP地址列表，最多2000个IPv4地址 */
  IpList: string[];
}

/** 获取IP黑名单列表响应 */
export interface GetIpBlacklistResponse {
  /** IP地址列表 */
  ipList: string[];
  /** 状态：1-启用，2-禁用 */
  status: 1 | 2;
}

