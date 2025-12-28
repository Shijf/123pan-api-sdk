/** 图片文件信息 */
export interface IImageFileInfo {
  /** 文件ID */
  fileId: string;
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
  /** 创建时间 */
  createAt: string;
  /** 更新时间 */
  updateAt: string;
  /** 下载链接 */
  downloadURL: string;
  /** 自定义域名链接 */
  userSelfURL: string;
  /** 流量统计 */
  totalTraffic: number;
  /** 父级ID */
  parentFileId: string;
  /** 父级文件名称 */
  parentFilename: string;
  /** 后缀名称 */
  extension: string;
  /** S3 Key Flag */
  s3KeyFlag?: string;
  /** 存储节点 */
  storageNode?: string;
  /** OSS 索引 */
  ossIndex?: number;
}

/** 获取图片详情返回数据 */
export interface IGetImageDetailResponse extends IImageFileInfo {}

/** 获取图片列表返回数据 */
export interface IGetImageListResponse {
  /** -1代表最后一页（无需再翻页查询），其他代表下一页开始的文件id，携带到请求参数中 */
  lastFileId: string;
  /** 文件列表 */
  fileList: IImageFileInfo[];
}

