# 快速开始

本指南将帮助你在 5 分钟内开始使用 123Pan API SDK。

::: tip 📚 参考文档
- **SDK 文档**：本文档
- **官方 API 文档**：[123Pan 开放平台文档](https://123yunpan.yuque.com/org-wiki-123yunpan-muaork/cr6ced)
- **开放平台**：[123Pan 开放平台](https://www.123pan.com/open)
:::

## 前置要求

在开始之前，你需要：

1. **Node.js 环境** - 版本 >= 14.0.0
2. **123Pan 开放平台账号** - 从 [123Pan 开放平台](https://www.123pan.com/open) 获取
3. **Client ID 和 Client Secret** - 在开放平台创建应用后获得

## 安装

选择你喜欢的包管理器安装 SDK：

::: code-group
```bash [npm]
npm install @sharef/123pan-sdk
```

```bash [yarn]
yarn add @sharef/123pan-sdk
```

```bash [pnpm]
pnpm add @sharef/123pan-sdk
```
:::

## 初始化 SDK

```typescript
import Pan123SDK from '@sharef/123pan-sdk';

const sdk = new Pan123SDK({
  clientID: 'your-client-id',
  clientSecret: 'your-client-secret',
});
```

::: tip 配置选项
SDK 支持更多配置选项，查看 [配置文档](/guide/configuration) 了解详情。
:::

## 第一个请求

让我们从获取用户信息开始：

```typescript
async function getUserInfo() {
  try {
    const result = await sdk.user.getUserInfo();
    
    if (result.code === 0) {
      console.log('用户名:', result.data.nickname);
      console.log('用户ID:', result.data.uid);
    } else {
      console.error('获取失败:', result.message);
    }
  } catch (error) {
    console.error('请求出错:', error);
  }
}

getUserInfo();
```

## 常见操作示例

### 1. 上传文件

```typescript
import * as fs from 'fs';

async function uploadFile() {
  const fileBuffer = fs.readFileSync('document.pdf');
  
  const result = await sdk.file.upload.uploadFile({
    file: fileBuffer,
    filename: 'document.pdf',
    parentFileId: 0, // 0 表示根目录
    onProgress: (progress) => {
      console.log(`上传进度: ${progress.percent}%`);
    }
  });
  
  if (result.code === 0) {
    console.log('上传成功！文件ID:', result.data.fileId);
  }
}
```

### 2. 获取文件列表

```typescript
async function getFileList() {
  const result = await sdk.file.getFileList({
    parentFileId: 0,
    limit: 100,
  });
  
  if (result.code === 0) {
    result.data.fileList.forEach(file => {
      console.log(`${file.filename} - ${file.size} 字节`);
    });
  }
}
```

### 3. 创建分享链接

```typescript
async function createShare() {
  const result = await sdk.file.share.createShare({
    shareName: '我的文档',
    shareExpire: 7, // 7天有效
    fileIDList: [123456],
    sharePwd: 'abc123', // 可选的提取码
  });
  
  if (result.code === 0) {
    const shareUrl = `https://www.123pan.com/s/${result.data.shareKey}`;
    console.log('分享链接:', shareUrl);
  }
}
```

### 4. 创建离线下载任务

```typescript
async function createOfflineTask() {
  const result = await sdk.offline.createTask({
    url: 'https://example.com/video.mp4',
    parentId: 0,
  });
  
  if (result.code === 0) {
    console.log('离线任务创建成功！');
  }
}
```

## 错误处理

SDK 使用标准的错误响应格式：

```typescript
async function example() {
  const result = await sdk.file.getFileList({
    parentFileId: 0,
    limit: 100,
  });
  
  // 检查响应码
  if (result.code === 0) {
    // 成功
    console.log('数据:', result.data);
  } else {
    // 失败
    console.error('错误码:', result.code);
    console.error('错误信息:', result.message);
  }
}
```

::: warning 常见错误码
- `code: 0` - 成功
- `code: 1` - 通用错误
- `code: 401` - 未授权
- `code: 403` - 禁止访问
- `code: 429` - 请求过于频繁

查看 [错误处理文档](/guide/error-handling) 了解更多。
:::

## 完整示例

这是一个完整的文件管理示例：

```typescript
import Pan123SDK from '@sharef/123pan-sdk';
import * as fs from 'fs';

const sdk = new Pan123SDK({
  clientID: process.env.CLIENT_ID!,
  clientSecret: process.env.CLIENT_SECRET!,
});

async function main() {
  try {
    // 1. 获取用户信息
    console.log('📝 获取用户信息...');
    const userInfo = await sdk.user.getUserInfo();
    console.log(`✅ 用户: ${userInfo.data.nickname}\n`);
    
    // 2. 创建文件夹
    console.log('📁 创建文件夹...');
    const folder = await sdk.file.upload.createFolder({
      name: `测试文件夹-${Date.now()}`,
      parentFileId: 0,
    });
    console.log(`✅ 文件夹ID: ${folder.data.infoID}\n`);
    
    // 3. 上传文件
    console.log('📤 上传文件...');
    const fileBuffer = Buffer.from('Hello, 123Pan!');
    const upload = await sdk.file.upload.uploadFile({
      file: fileBuffer,
      filename: 'test.txt',
      parentFileId: folder.data.infoID,
      onProgress: (progress) => {
        process.stdout.write(`\r上传进度: ${progress.percent}%`);
      }
    });
    console.log(`\n✅ 文件ID: ${upload.data.fileId}\n`);
    
    // 4. 创建分享
    console.log('🔗 创建分享链接...');
    const share = await sdk.file.share.createShare({
      shareName: '测试分享',
      shareExpire: 7,
      fileIDList: [upload.data.fileId],
    });
    console.log(`✅ 分享链接: https://www.123pan.com/s/${share.data.shareKey}\n`);
    
    console.log('🎉 所有操作完成！');
  } catch (error) {
    console.error('❌ 错误:', error);
  }
}

main();
```

## 下一步

现在你已经了解了基础用法，可以：

- [查看完整的 API 文档](/api/) - 了解所有可用的方法
- [学习高级配置](/guide/configuration) - 自定义 SDK 行为
- [浏览示例代码](/examples/) - 查看更多实用示例
- [了解错误处理](/guide/error-handling) - 正确处理各种错误情况

