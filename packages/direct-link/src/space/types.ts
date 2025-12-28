/**
 * 直链空间管理模块类型定义
 */

/** 启用直链空间参数 */
export interface EnableDirectLinkParams {
  /** 启用直链空间的文件夹的fileID */
  fileID: number;
}

/** 启用直链空间响应 */
export interface EnableDirectLinkResponse {
  /** 成功启用直链空间的文件夹的名称 */
  filename: string;
}

/** 禁用直链空间参数 */
export interface DisableDirectLinkParams {
  /** 禁用直链空间的文件夹的fileID */
  fileID: number;
}

/** 禁用直链空间响应 */
export interface DisableDirectLinkResponse {
  /** 成功禁用直链空间的文件夹的名称 */
  filename: string;
}

/** 获取直链链接参数 */
export interface GetDirectLinkUrlParams {
  /** 需要获取直链链接的文件的fileID */
  fileID: number;
}

/** 获取直链链接响应 */
export interface GetDirectLinkUrlResponse {
  /** 文件对应的直链链接 */
  url: string;
}

