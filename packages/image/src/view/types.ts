/** 图片查看/下载参数 */
export interface IGetImageUrlParams {
  /** 文件ID */
  fileID: string;
  /** 图片宽度（像素） */
  width?: number;
  /** 图片高度（像素） */
  height?: number;
  /** 是否使用自定义域名 */
  useCustomDomain?: boolean;
}

/** 图片URL响应 */
export interface IGetImageUrlResponse {
  /** 图片URL */
  url: string;
  /** 原始URL（未处理） */
  originalUrl: string;
}

/** 图片流响应（Node.js） */
export interface IGetImageStreamResponse {
  /** 流对象 */
  stream: NodeJS.ReadableStream;
  /** 内容类型 */
  contentType: string;
  /** 内容长度 */
  contentLength?: number;
}

/** 图片Blob响应（浏览器） */
export interface IGetImageBlobResponse {
  /** Blob对象 */
  blob: Blob;
  /** 内容类型 */
  contentType: string;
  /** 内容长度 */
  contentLength?: number;
}

