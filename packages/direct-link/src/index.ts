/**
 * 直链管理模块
 * 注意：此模块的API需要开通开发者权益
 */

import { HttpClient } from '@123pan/core';
import { IpModule } from './ip';
import { LoggerModule } from './logger';
import { SpaceModule } from './space';

export class DirectLinkModule {
  /** IP黑名单管理子模块 */
  public readonly ip: IpModule;
  /** 日志管理子模块 */
  public readonly logger: LoggerModule;
  /** 空间管理子模块 */
  public readonly space: SpaceModule;

  constructor(private httpClient: HttpClient) {
    this.ip = new IpModule(this.httpClient);
    this.logger = new LoggerModule(this.httpClient);
    this.space = new SpaceModule(this.httpClient);
  }
}

// 导出IP模块类型
export type {
  ToggleIpBlacklistParams,
  ToggleIpBlacklistResponse,
  UpdateIpBlacklistParams,
  GetIpBlacklistResponse,
} from './ip/types';

// 导出日志模块类型
export type {
  GetOfflineLogsParams,
  GetOfflineLogsResponse,
  OfflineLogItem,
  GetTrafficLogsParams,
  GetTrafficLogsResponse,
  TrafficLogItem,
} from './logger/types';

// 导出空间模块类型
export type {
  EnableDirectLinkParams,
  EnableDirectLinkResponse,
  DisableDirectLinkParams,
  DisableDirectLinkResponse,
  GetDirectLinkUrlParams,
  GetDirectLinkUrlResponse,
} from './space/types';
