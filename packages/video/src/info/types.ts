/**
 * 视频信息模块类型定义
 */

import type { ApiResponse } from '@123pan/core';

/** 获取转码空间文件夹信息响应 */
export interface GetTranscodeFolderInfoResponse {
  /** 转码空间文件夹ID */
  fileID: number;
}

/** 获取视频文件可转码分辨率响应 */
export interface GetVideoResolutionsResponse {
  /** true 代表正在获取，false 代表已经获取结束 */
  IsGetResolution: boolean;
  /** 可转码的分辨率，多个用逗号分隔，如 "480p,720p,1080p" */
  Resolutions: string;
  /** 已经转码的分辨率，如果为空则代表该视频从未转码过 */
  NowOrFinishedResolutions: string;
  /** 编码方式，如 "H.264" */
  CodecNames: string;
  /** 视频时长，单位：秒 */
  VideoTime: number;
}

/** 视频转码列表项 */
export interface TranscodeListItem {
  /** 转码后的视频地址 */
  url: string;
  /** 分辨率，如 "2160p", "1080p" 等 */
  resolution: string;
  /** 转码后的时长（秒） */
  duration: number;
  /** 视频高度（像素） */
  height: number;
  /** 转码状态：255-全部成功 */
  status: number;
  /** 存储集群 */
  mc: string;
  /** 码率 */
  bitRate: number;
  /** 转码进度（0-100） */
  progress: number;
  /** 更新时间 */
  updateAt: string;
}

/** 获取视频转码列表响应 */
export interface GetTranscodeListResponse {
  /** 转码状态：1-待转码，3-转码失败，254-部分成功，255-全部成功 */
  status: number;
  /** 视频转码列表 */
  list: TranscodeListItem[];
}

/** 转码记录项 */
export interface TranscodeRecordItem {
  /** 创建时间 */
  create_at: string;
  /** 分辨率，如 "720P", "1080P" */
  resolution: string;
  /** 转码状态：1-准备转码，2-正在转码中，3-254-转码失败，255-转码成功 */
  status: number;
  /** 视频转码成功之后的 m3u8 链接（转码成功后才有） */
  link: string;
}

/** 查询视频转码记录响应 */
export interface GetTranscodeRecordResponse {
  /** 用户转码记录列表 */
  UserTranscodeVideoRecordList: TranscodeRecordItem[];
}

/** 转码文件项 */
export interface TranscodeFileItem {
  /** 转码文件名称，如 "stream.m3u8", "000.ts" */
  FileName: string;
  /** 转码文件大小，如 "177B", "497.17KB" */
  FileSize: string;
  /** 转码文件分辨率 */
  Resolution: string;
  /** 转码文件创建时间 */
  CreateAt: string;
  /** 转码文件播放地址，只有 m3u8 文件有播放地址，ts 文件为空 */
  Url: string;
}

/** 转码结果项 */
export interface TranscodeResultItem {
  /** 转码记录ID */
  Id: number;
  /** 用户ID */
  Uid: number;
  /** 分辨率，如 "720P", "1080P" */
  Resolution: string;
  /** 转码状态：1-准备转码，2-正在转码中，3-254-转码失败，255-转码成功 */
  Status: number;
  /** 创建时间 */
  CreateAt: string;
  /** 更新时间 */
  UpdateAt: string;
  /** 转码文件列表 */
  Files: TranscodeFileItem[];
}

/** 查询视频转码结果响应 */
export interface GetTranscodeResultResponse {
  /** 用户转码结果列表 */
  UserTranscodeVideoList: TranscodeResultItem[];
}

