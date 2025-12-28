# 123Pan API SDK

> 123Pan 开放平台的 Node.js SDK，提供完整的 TypeScript 类型支持

[![npm version](https://img.shields.io/npm/v/@sharef/123pan-sdk.svg)](https://www.npmjs.com/package/@sharef/123pan-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/@sharef/123pan-sdk.svg)](https://nodejs.org)

## 📚 文档

- **官方 API 文档**: [123Pan 开放平台文档](https://123yunpan.yuque.com/org-wiki-123yunpan-muaork/cr6ced)
- **开放平台**: [123Pan 开放平台](https://www.123pan.com/open)

> 本 SDK 基于 [123Pan 官方 API 文档](https://123yunpan.yuque.com/org-wiki-123yunpan-muaork/cr6ced) 开发，提供完整的 TypeScript 封装和类型支持。

## ✨ 特性

- 🚀 **完整的 API 覆盖** - 支持云盘、图床、视频转码、离线下载等功能
- 📦 **模块化设计** - 支持全量引入和按需引入，可减少 60-80% 打包体积
- 🔒 **类型安全** - 完整的 TypeScript 类型定义
- ⚡ **自动认证** - 自动管理 token 刷新和重试
- 🎯 **简单易用** - 直观的 API 设计，清晰的文档
- 🔄 **自动重试** - 请求失败时自动重试
- 🛡️ **限流保护** - 内置令牌桶算法防止 API 限流

## 安装

```bash
npm install @sharef/123pan-sdk
```

或使用 yarn/pnpm：

```bash
yarn add @sharef/123pan-sdk
pnpm add @sharef/123pan-sdk
```

## 快速开始

```typescript
import Pan123SDK from '@sharef/123pan-sdk';

// 初始化 SDK
const sdk = new Pan123SDK({
  clientID: 'your-client-id',
  clientSecret: 'your-client-secret',
});

// 获取用户信息
const userInfo = await sdk.user.getUserInfo();
console.log('用户名:', userInfo.data.nickname);

// 上传文件到云盘
const result = await sdk.file.upload.uploadFile({
  filePath: './document.pdf',
  fileName: 'document.pdf',
  parentId: 0,
  onProgress: (progress) => {
    console.log(`上传进度: ${progress}%`);
  }
});

// 创建分享
const share = await sdk.file.share.createShare({
  shareName: '我的文档',
  shareExpire: 7,
  fileIDList: [result.data.fileId],
});
console.log('分享链接:', share.data.shareUrl);
```

## 主要功能

### 📁 云盘管理

```typescript
// 文件上传（支持大文件自动分片）
await sdk.file.upload.uploadFile({ ... });

// 获取文件列表
await sdk.file.getFileList({ parentFileId: 0, limit: 100 });

// 批量重命名
await sdk.file.renameFiles({ ... });

// 移动文件
await sdk.file.moveFiles({ ... });

// 删除文件
await sdk.file.deleteFiles({ ... });

// 获取下载链接
await sdk.file.getDownloadInfo({ fileId: 123 });
```

### 🔗 分享管理

```typescript
// 创建普通分享
await sdk.file.share.createShare({
  shareName: '我的分享',
  shareExpire: 7,
  fileIDList: [123456],
  sharePwd: 'abc123', // 可选
});

// 创建付费分享
await sdk.file.share.createContentPaymentShare({
  shareName: '付费资源',
  fileIDList: [123456],
  price: 9.9,
});
```

### 🖼️ 图床功能

```typescript
// 图片上传
await sdk.image.upload.uploadFile({
  filePath: './photo.jpg',
  fileName: 'photo.jpg',
  parentId: 0,
});

// 获取图片列表
await sdk.image.info.getImageList({ 
  parentFileId: 0,
  limit: 100 
});

// 获取图片链接
await sdk.image.view.getImageUrl({
  fileId: 123,
  width: 800,
  height: 600,
});
```

### 🎬 视频转码

```typescript
// 从云盘上传到转码空间
await sdk.video.upload.fromCloudDisk({
  fileIds: [123456],
});

// 获取可转码分辨率
const resInfo = await sdk.video.info.getVideoResolutionsWithPolling({
  fileId: 123456,
});

// 启动转码任务
await sdk.video.transcodeVideo({
  fileId: 123456,
  codecName: 'H.264',
  videoTime: 120,
  resolutions: ['2160P', '1080P', '720P'],
});

// 查询转码结果
await sdk.video.info.getTranscodeList({ fileId: 123456 });
```

### 📥 离线下载

```typescript
// 创建单个离线任务
await sdk.offline.createTask({
  url: 'https://example.com/file.zip',
  parentId: 0,
});

// 批量创建任务
await sdk.offline.batchCreateTasks({
  urls: [
    'https://example.com/video1.mp4',
    'https://example.com/video2.mp4',
  ],
});

// 查询下载进度
await sdk.offline.getDownloadProcess({ taskID: 123 });
```

## 按需引入

支持按需引入，减小打包体积：

```typescript
// 只引入需要的模块
import { HttpClient } from '@sharef/123pan-sdk/core';
import { FileModule } from '@sharef/123pan-sdk/file';
import { ImageModule } from '@sharef/123pan-sdk/image';

const httpClient = new HttpClient({
  clientID: 'your-client-id',
  clientSecret: 'your-client-secret',
});

const file = new FileModule(httpClient);
const image = new ImageModule(httpClient);

// 打包体积减少 60-80%
```

## 配置选项

```typescript
const sdk = new Pan123SDK({
  // 必需参数
  clientID: 'your-client-id',
  clientSecret: 'your-client-secret',
  
  // 可选参数
  baseURL: 'https://open-api.123pan.com',  // API 基础 URL
  debug: false,                             // 调试模式
  debugToken: 'your-jwt-token',             // 调试令牌
});
```

## 错误处理

```typescript
try {
  const result = await sdk.file.getFileList({
    parentFileId: 0,
    limit: 100,
  });
  
  if (result.code === 0) {
    // 成功
    console.log('文件列表:', result.data.fileList);
  } else {
    // 业务错误
    console.error('错误:', result.code, result.message);
  }
} catch (error) {
  // 系统错误（网络错误、超时等）
  console.error('系统错误:', error);
}
```

## 文档

- 📚 [API 参考](https://github.com/shijf/123pan-api-sdk/tree/main/docs/api)
- 💡 [示例代码](https://github.com/shijf/123pan-api-sdk/tree/main/packages/examples)
- 🌐 [官方 API 文档](https://123yunpan.yuque.com/org-wiki-123yunpan-muaork/cr6ced)

## 示例项目

查看 [packages/examples](./packages/examples) 目录获取更多示例代码。

## 环境要求

- Node.js >= 16.0.0
- TypeScript >= 4.5.0（如果使用 TypeScript）

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

[MIT](./LICENSE)

## 相关链接

- [GitHub 仓库](https://github.com/shijf/123pan-api-sdk)
- [NPM 包](https://www.npmjs.com/package/@sharef/123pan-sdk)
- [123Pan 开放平台](https://www.123pan.com/open)
- [官方 API 文档](https://123yunpan.yuque.com/org-wiki-123yunpan-muaork/cr6ced)
- [官方网站](https://www.123pan.com)

## 版权声明

本项目中使用的 123Pan Logo、品牌标识、相关图标及文字等知识产权归 **123云盘官方** 所有。

如有侵权，请联系删除。

**免责声明**: 本 SDK 为非官方实现，仅供学习和参考使用。使用本 SDK 产生的任何问题与 123Pan 官方无关。
