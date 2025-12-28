/** 创建复制任务返回数据 */
export interface ICreateCopyTaskResponse {
  /** 复制任务ID,可通过该ID,调用查询复制任务状态 */
  taskID: string;
}

/** 复制任务状态 */
export enum CopyTaskStatus {
  /** 进行中 */
  PROCESSING = 1,
  /** 结束 */
  COMPLETED = 2,
  /** 失败 */
  FAILED = 3,
  /** 等待 */
  WAITING = 4,
}

/** 获取复制任务详情返回数据 */
export interface IGetCopyTaskProcessResponse {
  /** 任务状态: 1进行中,2结束,3失败,4等待 */
  status: CopyTaskStatus;
  /** 失败原因 */
  failMsg: string;
}

/** 复制失败文件项 */
export interface ICopyFailFileItem {
  /** 文件Id */
  fileId: number;
  /** 文件名 */
  filename: string;
}

/** 获取复制失败文件列表返回数据 */
export interface IGetCopyFailFilesResponse {
  /** 总数 */
  total: number;
  /** 失败文件列表 */
  list: ICopyFailFileItem[];
}

