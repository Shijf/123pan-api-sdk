# 按需引入

SDK 支持两种引入方式：**全量引入** 和 **按需引入**。您可以根据项目需求选择最合适的方式。

## 为什么需要按需引入？

按需引入可以帮助您：

- ✅ **减小打包体积** - 只打包使用的模块，可减少 60-80% 的体积
- ✅ **提升加载速度** - 更小的包体积意味着更快的加载速度
- ✅ **优化性能** - 减少不必要的代码执行
- ✅ **更清晰的依赖** - 明确知道使用了哪些功能

## 方式一：全量引入

全量引入包含所有功能模块，使用最简单：

```typescript
// 默认导出，包含所有功能
import Pan123SDK from '123pan-api-sdk';

const sdk = new Pan123SDK({
  clientID: 'your-client-id',
  clientSecret: 'your-client-secret',
});

// 可以使用所有模块
await sdk.file.getFileList({ parentFileId: 0, limit: 100 });
await sdk.user.getUserInfo();
await sdk.image.upload.uploadFile({ ... });
await sdk.video.transcodeVideo({ ... });
await sdk.offline.createTask({ ... });
```

### 适用场景

全量引入适合以下情况：

- 🎯 新手用户，刚开始使用 SDK
- 🎯 项目会使用 3 个或更多功能模块
- 🎯 对打包体积不敏感
- 🎯 想要最简单的使用方式
- 🎯 快速原型开发

### 优缺点

**优点：**
- ✅ 使用简单，一次引入全部功能
- ✅ 不需要管理多个导入
- ✅ SDK 内部自动管理所有模块

**缺点：**
- ⚠️ 打包体积较大（~200KB 未压缩）
- ⚠️ 可能包含用不到的功能

---

## 方式二：按需引入（推荐）

按需引入只加载需要的模块，可以显著减小打包体积：

```typescript
// 1. 引入核心模块（必需）
import { HttpClient } from '123pan-api-sdk/core';

// 2. 只引入需要的功能模块
import { FileModule } from '123pan-api-sdk/file';
import { UserModule } from '123pan-api-sdk/user';

// 3. 手动初始化 HttpClient
const httpClient = new HttpClient({
  clientID: 'your-client-id',
  clientSecret: 'your-client-secret',
});

// 4. 初始化需要的模块
const file = new FileModule(httpClient);
const user = new UserModule(httpClient);

// 5. 使用模块
await file.getFileList({ parentFileId: 0, limit: 100 });
await user.getUserInfo();
```

### 适用场景

按需引入适合以下情况：

- 🎯 只使用 1-2 个功能模块
- 🎯 对打包体积有要求的生产环境
- 🎯 性能敏感的应用
- 🎯 移动端或网络受限环境

### 优缺点

**优点：**
- ✅ 打包体积小，只包含使用的模块
- ✅ 加载速度快
- ✅ Tree-shaking 友好

**缺点：**
- ⚠️ 需要手动管理 HttpClient
- ⚠️ 代码稍微复杂

---

## 可用的模块

SDK 提供以下模块，可以单独引入：

| 模块 | 导入路径 | 导出内容 | 说明 |
|------|---------|---------|------|
| **核心** | `123pan-api-sdk/core` | `HttpClient`, 类型定义 | 必需，提供认证和HTTP请求 |
| **云盘** | `123pan-api-sdk/file` | `FileModule` | 云盘文件管理、上传下载、分享 |
| **用户** | `123pan-api-sdk/user` | `UserModule` | 用户信息查询 |
| **图床** | `123pan-api-sdk/image` | `ImageModule` | 图床功能，图片存储和管理 |
| **视频转码** | `123pan-api-sdk/video` | `VideoModule` | 视频转码服务 |
| **离线下载** | `123pan-api-sdk/offline` | `OfflineModule` | 离线下载任务 |
| **直链** | `123pan-api-sdk/direct-link` | `DirectLinkModule` | 直链管理 |

## 使用示例

### 示例1：只使用云盘功能

如果你只需要云盘文件管理功能：

```typescript
import { HttpClient } from '123pan-api-sdk/core';
import { FileModule } from '123pan-api-sdk/file';

const httpClient = new HttpClient({
  clientID: process.env.CLIENT_ID!,
  clientSecret: process.env.CLIENT_SECRET!,
});

const file = new FileModule(httpClient);

// 上传文件
await file.upload.uploadFile({
  filePath: './document.pdf',
  fileName: 'document.pdf',
  parentId: 0,
});

// 获取文件列表
const result = await file.getFileList({
  parentFileId: 0,
  limit: 100,
});

// 创建分享
await file.share.createShare({
  shareName: '我的分享',
  shareExpire: 7,
  fileIDList: [12345],
});
```

**打包体积**: ~60KB (未压缩)

---

### 示例2：只使用图床功能

如果你的应用是图床或图片管理：

```typescript
import { HttpClient } from '123pan-api-sdk/core';
import { ImageModule } from '123pan-api-sdk/image';

const httpClient = new HttpClient({
  clientID: process.env.CLIENT_ID!,
  clientSecret: process.env.CLIENT_SECRET!,
});

const image = new ImageModule(httpClient);

// 上传图片
await image.upload.uploadFile({
  filePath: './photo.jpg',
  fileName: 'photo.jpg',
  parentId: 0,
});

// 获取图片URL
const urlResult = await image.view.getImageUrl({
  fileId: 12345,
  width: 800,
  height: 600,
});

// 获取图片列表
const list = await image.info.getImageList({
  parentFileId: 0,
  limit: 50,
});
```

**打包体积**: ~55KB (未压缩)

---

### 示例3：组合多个模块

如果需要多个模块，可以按需引入：

```typescript
import { HttpClient } from '123pan-api-sdk/core';
import { FileModule } from '123pan-api-sdk/file';
import { UserModule } from '123pan-api-sdk/user';
import { OfflineModule } from '123pan-api-sdk/offline';

const httpClient = new HttpClient({
  clientID: process.env.CLIENT_ID!,
  clientSecret: process.env.CLIENT_SECRET!,
});

// 初始化需要的模块
const file = new FileModule(httpClient);
const user = new UserModule(httpClient);
const offline = new OfflineModule(httpClient);

// 使用各个模块
const userInfo = await user.getUserInfo();
const fileList = await file.getFileList({ parentFileId: 0, limit: 100 });
await offline.createTask({ url: 'https://example.com/file.zip' });
```

**打包体积**: ~100KB (未压缩)

---

### 示例4：封装自己的 SDK 类

如果你想要类似全量引入的使用体验，但只包含需要的模块：

```typescript
import { HttpClient } from '123pan-api-sdk/core';
import { FileModule } from '123pan-api-sdk/file';
import { UserModule } from '123pan-api-sdk/user';
import type { SdkConfig } from '123pan-api-sdk/core';

class MyCustomSDK {
  private httpClient: HttpClient;
  public readonly file: FileModule;
  public readonly user: UserModule;

  constructor(config: SdkConfig) {
    this.httpClient = new HttpClient(config);
    this.file = new FileModule(this.httpClient);
    this.user = new UserModule(this.httpClient);
  }

  // 可以添加自定义方法
  async getTokenInfo() {
    return this.httpClient.getAuthManager().getTokenInfo();
  }
}

// 使用
const sdk = new MyCustomSDK({
  clientID: process.env.CLIENT_ID!,
  clientSecret: process.env.CLIENT_SECRET!,
});

await sdk.file.getFileList({ parentFileId: 0, limit: 100 });
await sdk.user.getUserInfo();
```

---

## 类型支持

所有模块都完全支持 TypeScript：

```typescript
import { HttpClient } from '123pan-api-sdk/core';
import { FileModule } from '123pan-api-sdk/file';
import type { ApiResponse, FileListItem } from '123pan-api-sdk/core';

const httpClient = new HttpClient({
  clientID: process.env.CLIENT_ID!,
  clientSecret: process.env.CLIENT_SECRET!,
});

const file = new FileModule(httpClient);

// 完整的类型提示
const result: ApiResponse<{ fileList: FileListItem[] }> = await file.getFileList({
  parentFileId: 0,
  limit: 100,
});

// 类型安全
result.data.fileList.forEach(file => {
  console.log(file.filename); // ✅ 类型正确
  // console.log(file.notExist); // ❌ 类型错误
});
```

---

## 打包体积对比

以下是不同引入方式的打包体积对比（未压缩）：

| 引入方式 | 模块数量 | 体积 | gzip 后 | 相比全量 |
|---------|---------|------|---------|---------|
| 全量引入 | 全部 | ~200KB | ~50KB | 100% |
| 核心 + 1个模块 | 核心 + file | ~60KB | ~18KB | -70% |
| 核心 + 2个模块 | 核心 + file + user | ~80KB | ~24KB | -60% |
| 核心 + 3个模块 | 核心 + file + image + video | ~130KB | ~38KB | -35% |

> 💡 提示：实际体积取决于具体使用的功能和构建配置。使用现代打包工具（如 Webpack 5、Vite、Rollup）可以进一步优化体积。

---

## 构建配置

### Webpack 配置

Webpack 5 默认支持 `exports` 字段，无需额外配置：

```javascript
// webpack.config.js
module.exports = {
  resolve: {
    // Webpack 5 默认支持 exports
    conditionNames: ['import', 'require', 'default'],
  },
};
```

### Vite 配置

Vite 原生支持，无需配置：

```typescript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  // Vite 自动支持 package.json 的 exports 字段
});
```

### Rollup 配置

```javascript
// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';

export default {
  plugins: [
    resolve({
      exportConditions: ['import', 'default'],
    }),
  ],
};
```

---

## Tree Shaking

按需引入配合现代打包工具的 Tree Shaking 功能，可以自动移除未使用的代码：

```typescript
// 只引入使用的功能
import { HttpClient } from '123pan-api-sdk/core';
import { FileModule } from '123pan-api-sdk/file';

// 即使 FileModule 内部有很多方法，
// Tree Shaking 会移除你没有使用的部分
const file = new FileModule(httpClient);
await file.getFileList({ parentFileId: 0, limit: 100 });
// 如果你只用了 getFileList，其他方法的代码会被移除
```

---

## 如何选择？

### 选择全量引入，如果：

- ✅ 你是新手，刚开始使用 SDK
- ✅ 项目会使用 3 个或更多功能模块
- ✅ 快速原型开发
- ✅ 不关心打包体积
- ✅ 想要最简单的使用方式

### 选择按需引入，如果：

- ✅ 只使用 1-2 个功能模块
- ✅ 对打包体积有严格要求
- ✅ 生产环境项目
- ✅ 移动端或网络受限环境
- ✅ 想要极致的性能优化

---

## 常见问题

### Q: 按需引入会影响功能吗？

不会。按需引入和全量引入的功能完全一样，只是引入方式不同。

### Q: 可以混用两种方式吗？

不建议。选择一种方式在整个项目中保持一致，避免混淆。

### Q: 如何知道我需要哪些模块？

查看 [API 文档](/api/) 了解每个模块的功能，根据项目需求选择。

### Q: 按需引入需要修改 tsconfig.json 吗？

不需要。SDK 已经配置好了 TypeScript 类型导出。

### Q: 按需引入支持哪些打包工具？

支持所有现代打包工具：Webpack 5+、Vite、Rollup、esbuild 等。

---

## 下一步

- 查看 [API 文档](/api/) 了解各个模块的详细用法
- 查看 [示例代码](/examples/) 学习实际应用场景
- 查看 [配置文档](/guide/configuration) 了解更多配置选项

