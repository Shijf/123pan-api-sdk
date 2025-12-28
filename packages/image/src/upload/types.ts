/** 创建文件夹返回数据 */
export interface ICreateFolderResponse {
    list: {
        /** 文件夹名称 */
        filename: string;
        /** 文件夹id */
        dirID: string
    }[]
}

/** 创建文件返回数据 */
export interface ICreateFileResponse {
    /** 文件id */
    fileID?: string;
    /** 预上传id */
    preuploadID: string;
    /** 是否秒传 */
    reuse: boolean;
    /** 分片大小 */
    sliceSize: number;
}


/**
 * 获取上传地址&上传分片返回数据
 * presignedURL	string	必填	上传地址
 */
export interface IGetUploadUrlResponse {
    presignedURL: string;
}

/** 
 * 上传完毕返回数据 
 */
export interface IUploadCompleteResponse {
    /** 文件id */
    fileID?: string;
    /** 是否需要异步查询上传结果 */
    async: boolean;
    /** 上传是否完成 */
    completed: boolean;
}

/**
 * 异步轮询获取上传结果
 */
export interface IGetUploadResultResponse {
    /** 上传合并是否完成 */
    completed: boolean;
    /** 上传成功的文件ID */
    fileID: string;
}

/** 上传进度回调函数 */
export interface UploadProgressCallback {
    (progress: {
        /** 已上传字节数 */
        loaded: number;
        /** 总字节数 */
        total: number;
        /** 上传百分比 (0-100) */
        percent: number;
        /** 当前上传的分片序号 */
        currentSlice?: number;
        /** 总分片数 */
        totalSlices?: number;
    }): void;
}

/** 上传文件参数（Node.js环境） */
export interface IUploadFileParams {
    /** 文件名：要小于255个字符且不能包含以下任何字符："\/:*?|><。（注：不能重名） */
    filename: string;
    /** 文件数据（ArrayBuffer、Buffer、Uint8Array） */
    file: ArrayBuffer | Buffer | Uint8Array;
    /** 文件md5（可选，如果不提供会自动计算） */
    fileMd5?: string;
    /** 父目录id，上传到根目录时填写 空 */
    parentFileID?: string;
    /** 上传进度回调 */
    onProgress?: UploadProgressCallback;
    /** 轮询间隔（毫秒），默认1000ms */
    pollInterval?: number;
    /** 最大轮询次数，默认300次（5分钟） */
    maxPollAttempts?: number;
}

/** 上传文件返回结果 */
export interface IUploadFileResult {
    /** 文件ID */
    fileID: string;
    /** 是否秒传 */
    isReuse: boolean;
    /** 是否异步完成 */
    isAsync: boolean;
}
