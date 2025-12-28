# 云盘操作示例

本章节展示云盘管理模块的实际使用案例。

::: tip 💡 云盘 vs 图床
本页面介绍的是**云盘**功能（`file` 模块），用于存储各种类型的文件。

如果你需要**图床**功能（图片外链），请查看 [图片处理示例](/examples/image)。
:::

## 基础操作

### 获取文件列表

```typescript
import Pan123SDK from '123pan-api-sdk';

const sdk = new Pan123SDK({
  clientID: process.env.CLIENT_ID!,
  clientSecret: process.env.CLIENT_SECRET!,
});

// 获取根目录文件
const result = await sdk.file.getFileList({
  parentFileId: 0,
  limit: 100,
});

if (result.code === 0) {
  console.log(`找到 ${result.data.fileList.length} 个文件/文件夹`);
  
  result.data.fileList.forEach(file => {
    const type = file.type === 0 ? '📄' : '📁';
    const size = file.type === 0 ? ` (${formatBytes(file.size)})` : '';
    console.log(`${type} ${file.filename}${size}`);
  });
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}
```

### 搜索文件

```typescript
// 模糊搜索
const searchResult = await sdk.file.getFileList({
  parentFileId: 0,
  limit: 50,
  searchData: 'report',     // 搜索关键字
  searchMode: 0,            // 0=模糊搜索
});

// 精确搜索
const exactResult = await sdk.file.getFileList({
  parentFileId: 0,
  limit: 50,
  searchData: 'report-2024.pdf',  // 完整文件名
  searchMode: 1,                   // 1=精确搜索
});
```

### 分页获取大量文件

```typescript
async function getAllFiles(parentFileId: number) {
  const allFiles: any[] = [];
  let lastFileId: number | undefined = undefined;

  while (true) {
    const result = await sdk.file.getFileList({
      parentFileId,
      limit: 100,
      lastFileId,
    });

    if (result.code !== 0) break;

    allFiles.push(...result.data.fileList);
    console.log(`已获取 ${allFiles.length} 个文件...`);

    // -1 表示最后一页
    if (result.data.lastFileId === -1) break;
    
    lastFileId = result.data.lastFileId;
  }

  return allFiles;
}

const allFiles = await getAllFiles(0);
console.log(`总共 ${allFiles.length} 个文件`);
```

## 文件上传

### 小文件上传（单步上传）

```typescript
import * as fs from 'fs';

async function uploadSmallFile() {
  const filePath = './document.pdf';
  const fileBuffer = fs.readFileSync(filePath);
  
  const result = await sdk.file.upload.uploadFile({
    filePath,
    fileName: 'document.pdf',
    parentId: 0,
    async: false,  // 同步模式，等待上传完成
    onProgress: (progress) => {
      console.log(`上传进度: ${progress}%`);
    },
  });

  if (result.code === 0) {
    console.log('✅ 上传成功!');
    console.log('文件ID:', result.data.fileId);
    console.log('下载链接:', result.data.downloadUrl);
  } else {
    console.error('上传失败:', result.message);
  }
}
```

### 大文件上传（多步上传）

```typescript
async function uploadLargeFile() {
  const result = await sdk.file.upload.uploadFile({
    filePath: './large-video.mp4',
    fileName: 'large-video.mp4',
    parentId: 0,
    async: false,
    onProgress: (progress) => {
      process.stdout.write(`\r上传进度: ${progress.toFixed(2)}%`);
    },
  });

  if (result.code === 0) {
    console.log('\n✅ 大文件上传成功!');
    console.log('文件信息:', result.data);
  }
}
```

### 异步上传模式

```typescript
async function asyncUpload() {
  // 启动异步上传（立即返回）
  const uploadResult = await sdk.file.upload.uploadFile({
    filePath: './huge-file.zip',
    fileName: 'huge-file.zip',
    async: true,  // 异步模式
    onProgress: (progress) => {
      console.log(`分片上传进度: ${progress}%`);
    },
  });

  if (uploadResult.code === 0) {
    const asyncUploadId = uploadResult.data.asyncUploadId;
    console.log('异步上传已启动，ID:', asyncUploadId);

    // 轮询查询结果
    while (true) {
      await new Promise(resolve => setTimeout(resolve, 5000));

      const statusResult = await sdk.file.upload.getUploadResult({
        asyncUploadId,
      });

      if (statusResult.code === 0) {
        const { status, fileId, downloadUrl } = statusResult.data;
        
        if (status === 'completed') {
          console.log('✅ 异步上传完成!');
          console.log('文件ID:', fileId);
          console.log('下载链接:', downloadUrl);
          break;
        } else if (status === 'failed') {
          console.error('❌ 异步上传失败');
          break;
        } else {
          console.log('⏳ 上传处理中...');
        }
      }
    }
  }
}
```

### 批量上传

```typescript
import * as path from 'path';

async function batchUpload(directory: string) {
  const files = fs.readdirSync(directory);
  const uploadTasks = [];

  for (const filename of files) {
    const filePath = path.join(directory, filename);
    const stats = fs.statSync(filePath);

    if (stats.isFile()) {
      uploadTasks.push({
        filePath,
        fileName: filename,
      });
    }
  }

  console.log(`准备上传 ${uploadTasks.length} 个文件`);

  for (let i = 0; i < uploadTasks.length; i++) {
    const task = uploadTasks[i];
    console.log(`\n[${i + 1}/${uploadTasks.length}] 上传: ${task.fileName}`);

    const result = await sdk.file.upload.uploadFile({
      ...task,
      parentId: 0,
      onProgress: (progress) => {
        process.stdout.write(`\r  进度: ${progress.toFixed(2)}%`);
      },
    });

    if (result.code === 0) {
      console.log('\n  ✅ 成功');
    } else {
      console.log('\n  ❌ 失败:', result.message);
    }
  }
}

batchUpload('./documents');
```

## 文件下载

### 获取下载链接

```typescript
async function getDownloadLink(fileId: number) {
  const result = await sdk.file.getDownloadInfo({
    fileId,
  });

  if (result.code === 0) {
    console.log('下载链接:', result.data.downloadUrl);
    console.log('有效期:', result.data.expireTime);
    return result.data.downloadUrl;
  }
  return null;
}
```

### 下载文件到本地

```typescript
import * as https from 'https';
import * as fs from 'fs';

async function downloadFile(fileId: number, savePath: string) {
  // 获取下载链接
  const info = await sdk.file.getDownloadInfo({ fileId });
  
  if (info.code !== 0) {
    console.error('获取下载链接失败');
    return;
  }

  const url = info.data.downloadUrl;
  console.log('开始下载...');

  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`下载失败: ${response.statusCode}`));
        return;
      }

      const fileStream = fs.createWriteStream(savePath);
      const totalBytes = parseInt(response.headers['content-length'] || '0');
      let downloadedBytes = 0;

      response.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        const progress = ((downloadedBytes / totalBytes) * 100).toFixed(2);
        process.stdout.write(`\r下载进度: ${progress}%`);
      });

      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        console.log('\n✅ 下载完成!');
        resolve(savePath);
      });

      fileStream.on('error', reject);
    }).on('error', reject);
  });
}

// 使用
await downloadFile(12345, './downloaded-file.pdf');
```

## 文件管理

### 创建文件夹

```typescript
const result = await sdk.file.createFolder({
  name: 'My Documents',
  parentId: 0,  // 在根目录创建
});

if (result.code === 0) {
  console.log('文件夹创建成功，ID:', result.data.folderId);
}
```

### 重命名文件

```typescript
// 单个重命名
const result = await sdk.file.renameFiles({
  fileIds: [12345],
  newNames: ['新文件名.pdf'],
});

// 批量重命名（最多30个）
const batchResult = await sdk.file.renameFiles({
  fileIds: [12345, 67890, 111],
  newNames: ['文件1.pdf', '文件2.pdf', '文件3.pdf'],
});
```

### 移动文件

```typescript
// 移动单个文件
const result = await sdk.file.moveFiles({
  fileIds: [12345],
  targetFolderId: 99999,
});

// 批量移动（最多100个）
const batchResult = await sdk.file.moveFiles({
  fileIds: [12345, 67890, 111, 222],
  targetFolderId: 99999,
});

if (result.code === 0) {
  console.log('文件移动成功');
}
```

### 删除文件

```typescript
// 移到回收站（可恢复）
const result = await sdk.file.deleteFiles({
  fileIds: [12345, 67890],
  permanent: false,  // false=回收站
});

// 永久删除（不可恢复）
const permanentResult = await sdk.file.deleteFiles({
  fileIds: [12345],
  permanent: true,  // true=永久删除
});

if (result.code === 0) {
  console.log('文件已删除');
}
```

## 分享管理

### 创建普通分享

```typescript
const result = await sdk.file.share.createShare({
  shareName: '我的分享',
  shareExpire: 7,           // 7天有效期
  fileIDList: [12345, 67890],
  sharePwd: '1234',         // 提取码（选填）
});

if (result.code === 0) {
  console.log('分享创建成功!');
  console.log('分享链接:', result.data.shareUrl);
  console.log('提取码:', result.data.sharePwd);
}
```

### 创建付费分享

```typescript
const result = await sdk.file.share.createContentPaymentShare({
  shareName: '付费资源',
  shareExpire: 30,
  fileIDList: [12345],
  price: 9.9,              // 价格（元）
  sharePwd: 'abcd',
});

if (result.code === 0) {
  console.log('付费分享创建成功!');
  console.log('分享链接:', result.data.shareUrl);
  console.log('价格:', result.data.price, '元');
}
```

## 完整示例：文件备份工具

```typescript
import Pan123SDK from '123pan-api-sdk';
import * as fs from 'fs';
import * as path from 'path';

class FileBackupTool {
  constructor(private sdk: Pan123SDK) {}

  // 备份本地目录到云盘
  async backupDirectory(localDir: string, remoteFolderId: number = 0) {
    const files = fs.readdirSync(localDir);
    
    console.log(`备份目录: ${localDir}`);
    console.log(`找到 ${files.length} 个项目\n`);

    for (const filename of files) {
      const localPath = path.join(localDir, filename);
      const stats = fs.statSync(localPath);

      if (stats.isDirectory()) {
        // 创建云盘文件夹
        const folderResult = await this.sdk.file.createFolder({
          name: filename,
          parentId: remoteFolderId,
        });

        if (folderResult.code === 0) {
          console.log(`📁 创建文件夹: ${filename}`);
          // 递归备份子目录
          await this.backupDirectory(localPath, folderResult.data.folderId);
        }
      } else {
        // 上传文件
        console.log(`📄 上传文件: ${filename}`);
        const uploadResult = await this.sdk.file.upload.uploadFile({
          filePath: localPath,
          fileName: filename,
          parentId: remoteFolderId,
          onProgress: (progress) => {
            process.stdout.write(`\r  进度: ${progress.toFixed(2)}%`);
          },
        });

        if (uploadResult.code === 0) {
          console.log('\n  ✅ 上传成功');
        } else {
          console.log(`\n  ❌ 上传失败: ${uploadResult.message}`);
        }
      }
    }

    console.log(`\n✅ 目录 ${localDir} 备份完成`);
  }

  // 从云盘恢复到本地
  async restoreDirectory(remoteFolderId: number, localDir: string) {
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }

    const result = await this.sdk.file.getFileList({
      parentFileId: remoteFolderId,
      limit: 100,
    });

    if (result.code !== 0) return;

    for (const file of result.data.fileList) {
      const localPath = path.join(localDir, file.filename);

      if (file.type === 1) {  // 文件夹
        console.log(`📁 创建目录: ${file.filename}`);
        await this.restoreDirectory(file.fileId, localPath);
      } else {  // 文件
        console.log(`📄 下载文件: ${file.filename}`);
        // 实现下载逻辑...
      }
    }
  }
}

// 使用
const sdk = new Pan123SDK({
  clientID: process.env.CLIENT_ID!,
  clientSecret: process.env.CLIENT_SECRET!,
});

const backupTool = new FileBackupTool(sdk);

// 备份
await backupTool.backupDirectory('./my-documents', 0);

// 恢复
// await backupTool.restoreDirectory(12345, './restored-documents');
```

## 注意事项

1. **并发限制**: 批量操作时注意限流，避免触发 API 限制
2. **大文件上传**: 建议使用异步模式，避免请求超时
3. **错误处理**: 实现重试机制，提高上传成功率
4. **进度追踪**: 使用 `onProgress` 回调提供用户反馈
5. **分片大小**: SDK 自动处理分片，无需手动设置

