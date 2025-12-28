/**
 * 图床模块
 */

import { HttpClient } from '@123pan/core';
import { UploadModule } from './upload';
import { CopyModule } from './copy';
import { MoveModule } from './move';
import { DeleteModule } from './delete';
import { InfoModule } from './info';
import { ViewModule } from './view';

export interface ImageUploadResponse {
  imageId: string;
  imageUrl: string;
  thumbnailUrl?: string;
  deleteUrl?: string;
  fileSize: number;
  width?: number;
  height?: number;
}

export class ImageModule {
  public readonly upload: UploadModule;
  public readonly copy: CopyModule;
  public readonly move: MoveModule;
  public readonly delete: DeleteModule;
  public readonly info: InfoModule;
  public readonly view: ViewModule;

  constructor(private httpClient: HttpClient) {
    this.upload = new UploadModule(this.httpClient);
    this.copy = new CopyModule(this.httpClient);
    this.move = new MoveModule(this.httpClient);
    this.delete = new DeleteModule(this.httpClient);
    this.info = new InfoModule(this.httpClient);
    this.view = new ViewModule(this.httpClient);
  }
}

// 导出上传模块和类型
export { UploadModule as UploadModuleOfImage } from './upload';
export type {
  ICreateFolderResponse as ICreateFolderResponseOfImage,
  ICreateFileResponse as ICreateFileResponseOfImage,
  IGetUploadUrlResponse as IGetUploadUrlResponseOfImage,
  IUploadCompleteResponse as IUploadCompleteResponseOfImage,
  IGetUploadResultResponse as IGetUploadResultResponseOfImage,
} from './upload/types';

// 导出复制模块和类型
export { CopyModule } from './copy';
export type {
  ICreateCopyTaskResponse,
  IGetCopyTaskProcessResponse,
  IGetCopyFailFilesResponse,
  ICopyFailFileItem,
} from './copy/types';
export { CopyTaskStatus } from './copy/types';

// 导出移动模块和类型
export { MoveModule } from './move';
export type { IMoveFilesResponse } from './move/types';

// 导出删除模块和类型
export { DeleteModule } from './delete';
export type { IDeleteFilesResponse } from './delete/types';

// 导出信息查询模块和类型
export { InfoModule } from './info';
export type {
  IGetImageDetailResponse,
  IGetImageListResponse,
  IImageFileInfo,
} from './info/types';

// 导出图片查看/下载模块和类型
export { ViewModule } from './view';
export type {
  IGetImageUrlParams,
  IGetImageUrlResponse,
  IGetImageStreamResponse,
  IGetImageBlobResponse,
} from './view/types';
