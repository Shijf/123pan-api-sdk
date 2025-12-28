# 介绍

## 什么是 123Pan API SDK？

123Pan API SDK 是一个为 Node.js 环境设计的软件开发工具包，它封装了 123Pan 开放平台的所有 API 接口，让你可以轻松地在你的应用中集成 123Pan 的云存储功能。

::: tip 📚 官方文档
本 SDK 基于 [123Pan 开放平台官方文档](https://123yunpan.yuque.com/org-wiki-123yunpan-muaork/cr6ced) 开发，提供完整的 TypeScript 封装和类型支持。

如需了解 API 的详细参数和限制，请参考官方文档。
:::

## 为什么选择这个 SDK？

### 🚀 完整的功能覆盖

SDK 提供了 123Pan 开放平台的所有核心功能：

- **云盘管理** (`file`) - 文件上传、下载、移动、重命名、删除等云盘操作
- **分享功能** (`file.share`) - 创建普通分享和付费分享链接
- **离线下载** (`offline`) - 创建和管理离线下载任务
- **图床功能** (`image`) - 图片上传、复制、移动和信息获取，专业图床服务
- **视频转码** (`video`) - 视频文件转码和管理，支持多分辨率转码
- **直链管理** (`directLink`) - 创建和管理文件直链
- **用户信息** (`user`) - 获取用户信息和配额

### 📦 模块化设计

SDK 采用模块化架构，每个功能模块独立组织：

```typescript
sdk.file.upload.uploadFile()      // 云盘文件上传
sdk.file.share.createShare()      // 创建分享链接
sdk.image.upload.uploadFile()     // 图床图片上传
sdk.video.transcodeVideo()         // 视频转码操作
sdk.offline.createTask()           // 创建离线下载任务
```

### 🔒 类型安全

完整的 TypeScript 类型定义，享受智能提示和类型检查：

```typescript
// 编辑器会自动提示所有可用的参数和返回类型
const result = await sdk.file.getFileList({
  parentFileId: 0,  // 编辑器提示：number
  limit: 100,       // 编辑器提示：number
});

// 返回值类型自动推断
if (result.data) {
  result.data.fileList.forEach(file => {
    console.log(file.filename); // ✅ 类型安全
  });
}
```

### ⚡ 自动化处理

SDK 内置了许多自动化功能，减少样板代码：

- **自动认证** - 自动获取和刷新 access token
- **自动重试** - 请求失败时自动重试
- **限流控制** - 内置令牌桶算法防止 API 限流
- **批量处理** - 自动分批处理超出限制的操作

### 🎯 简单易用

直观的 API 设计，遵循最佳实践：

```typescript
// 简单的文件上传
const result = await sdk.file.upload.uploadFile({
  file: fileBuffer,
  filename: 'document.pdf',
  parentFileId: 0,
  onProgress: (progress) => {
    console.log(`上传进度: ${progress.percent}%`);
  }
});

// 自动处理大文件分片上传
// 自动计算 MD5
// 自动重试失败的分片
```

## 适用场景

### 云存储集成

将 123Pan 云存储功能集成到你的应用中：

```typescript
// 实现文件备份
async function backupFile(localPath: string) {
  const fileBuffer = fs.readFileSync(localPath);
  await sdk.file.upload.uploadFile({
    file: fileBuffer,
    filename: path.basename(localPath),
    parentFileId: 0,
  });
}
```

### 内容分发

创建分享链接，分发内容给用户：

```typescript
// 创建付费资源分享
const share = await sdk.file.share.createPaidShare({
  shareName: '高清教程视频',
  fileIDList: [123456],
  payAmount: 9.9,
  resourceDesc: '完整的开发教程',
});
```

### 离线下载

批量下载网络资源到云盘：

```typescript
// 批量离线下载
const tasks = await sdk.offline.batchCreateTasks({
  urls: [
    'https://example.com/video1.mp4',
    'https://example.com/video2.mp4',
  ],
  parentId: 0,
});
```

### 媒体处理

图片和视频的处理：

```typescript
// 图片上传并获取处理后的链接
const result = await sdk.image.upload.uploadImage({
  file: imageBuffer,
  filename: 'photo.jpg',
});

// 视频转码
await sdk.video.transcodeVideo({
  fileId: 123456,
  codecName: 'H.264',
  videoTime: 120,
  resolutions: '1080P,720P,480P',
});
```

## 技术规格

- **Node.js** 版本要求：>= 14.0.0
- **TypeScript** 版本：>= 4.5.0
- **包管理器**：npm、yarn 或 pnpm
- **环境**：仅支持 Node.js 环境（不支持浏览器）

## 许可证

MIT License - 可自由用于商业和个人项目。

## 下一步

- [快速开始](/guide/quick-start) - 5 分钟快速上手
- [API 参考](/api/) - 完整的 API 文档
- [示例代码](/examples/) - 实用的代码示例

---

## 版权声明

::: warning 知识产权声明
本项目中使用的 **123Pan Logo、品牌标识、相关图标及文字** 等知识产权归 **123云盘官方** 所有。

如有侵权，请联系删除。

**免责声明**: 本 SDK 为非官方实现，仅供学习和参考使用。使用本 SDK 产生的任何问题与 123Pan 官方无关。

[查看完整版权声明 →](/COPYRIGHT)
:::

