# 示例代码

本章节提供各个模块的实际使用示例。

## 快速导航

- [文件操作](/examples/file) - 文件上传、下载、管理示例
- [图片处理](/examples/image) - 图片上传、处理、管理示例
- [视频转码](/examples/video) - 视频转码完整流程
- [离线下载](/examples/offline) - 离线下载任务管理

## 基础示例

### 初始化 SDK

```typescript
import Pan123SDK from '@sharef/123pan-sdk';

const sdk = new Pan123SDK({
  clientID: process.env.CLIENT_ID!,
  clientSecret: process.env.CLIENT_SECRET!,
  debug: true,  // 开发环境建议启用
});
```

### 错误处理

SDK 所有方法都返回统一的 `ApiResponse` 格式：

```typescript
interface ApiResponse<T> {
  code: number;      // 0 表示成功
  message: string;   // 响应消息
  data: T;          // 响应数据
}
```

**推荐的错误处理方式：**

```typescript
async function handleApiCall() {
  try {
    const result = await sdk.user.getUserInfo();
    
    if (result.code === 0) {
      // 成功
      console.log('数据:', result.data);
    } else {
      // API 错误
      console.error('API 错误:', result.message);
      console.error('错误代码:', result.code);
    }
  } catch (error) {
    // 网络错误或其他异常
    console.error('请求失败:', error);
  }
}
```

### 环境变量配置

建议使用环境变量管理敏感信息：

**.env 文件**
```env
CLIENT_ID=your_client_id
CLIENT_SECRET=your_client_secret
DEBUG=true
```

**代码中使用**
```typescript
import * as dotenv from 'dotenv';
dotenv.config();

const sdk = new Pan123SDK({
  clientID: process.env.CLIENT_ID!,
  clientSecret: process.env.CLIENT_SECRET!,
  debug: process.env.DEBUG === 'true',
});
```

## 常见场景

### 1. 文件备份

```typescript
async function backupFiles() {
  // 获取文件列表
  const files = await sdk.file.getFileList({
    parentFileId: 0,
    limit: 100,
  });

  // 下载所有文件
  for (const file of files.data.fileList) {
    if (file.type === 0) {  // 0=文件
      const downloadInfo = await sdk.file.getDownloadInfo({
        fileId: file.fileId,
      });
      
      if (downloadInfo.code === 0) {
        console.log(`下载: ${file.filename}`);
        console.log(`URL: ${downloadInfo.data.downloadUrl}`);
        // 使用 fetch 或其他工具下载
      }
    }
  }
}
```

### 2. 批量上传图片

```typescript
import * as fs from 'fs';
import * as path from 'path';

async function uploadImages(directory: string) {
  const files = fs.readdirSync(directory);
  const imageFiles = files.filter(f => 
    /\.(jpg|jpeg|png|gif|webp)$/i.test(f)
  );

  console.log(`找到 ${imageFiles.length} 张图片`);

  for (const filename of imageFiles) {
    const filePath = path.join(directory, filename);
    
    console.log(`上传: ${filename}`);
    const result = await sdk.image.upload.uploadFile({
      filePath,
      fileName: filename,
      parentId: 0,
      onProgress: (progress) => {
        console.log(`  进度: ${progress}%`);
      },
    });

    if (result.code === 0) {
      console.log(`  ✅ 成功! URL: ${result.data.downloadUrl}`);
    } else {
      console.error(`  ❌ 失败: ${result.message}`);
    }
  }
}
```

### 3. 定时任务 - 离线下载监控

```typescript
async function monitorOfflineTasks() {
  const tasks = await sdk.offline.getTaskList({
    page: 1,
    limit: 50,
  });

  if (tasks.code !== 0) return;

  for (const task of tasks.data.list) {
    // 查询进度
    const progress = await sdk.offline.getDownloadProcess({
      taskID: task.taskId,
    });

    if (progress.code === 0) {
      const { process, status } = progress.data;
      
      console.log(`任务 ${task.fileName}:`);
      console.log(`  进度: ${process}%`);
      console.log(`  状态: ${getStatusText(status)}`);

      // 如果下载成功，发送通知
      if (status === 2) {
        console.log(`  ✅ 下载完成!`);
        // 这里可以发送邮件或其他通知
      }
    }
  }
}

function getStatusText(status: number): string {
  const map = { 0: '进行中', 1: '失败', 2: '成功', 3: '重试中' };
  return map[status] || '未知';
}

// 每分钟执行一次
setInterval(monitorOfflineTasks, 60000);
```

### 4. 视频批量转码

```typescript
async function batchTranscode(fileIds: number[]) {
  // 1. 上传到转码空间
  const uploadResult = await sdk.video.upload.fromCloudDisk({
    fileIds,
  });

  if (uploadResult.code !== 0) {
    console.error('上传失败:', uploadResult.message);
    return;
  }

  console.log('✅ 上传成功');

  // 2. 获取转码空间文件列表
  const fileList = await sdk.video.getFileList({
    parentFileId: 0,
    limit: 100,
  });

  if (fileList.code !== 0) return;

  // 3. 为每个视频启动转码
  for (const file of fileList.data.fileList) {
    if (file.type === 0) {  // 0=文件
      console.log(`\n处理: ${file.filename}`);

      // 获取可转码分辨率
      const resolutions = await sdk.video.info.getVideoResolutionsWithPolling({
        fileId: file.fileId,
        pollingInterval: 5000,
        onPolling: (attempt) => {
          console.log(`  查询分辨率... 第 ${attempt} 次`);
        },
      });

      if (resolutions.code === 0) {
        const { Resolutions, CodecNames, VideoTime } = resolutions.data;
        
        // 提交转码任务（转所有可用分辨率）
        const transcodeResult = await sdk.video.transcodeVideo({
          fileId: file.fileId,
          codecName: CodecNames,
          videoTime: VideoTime,
          resolutions: Resolutions.split(','),
        });

        if (transcodeResult.code === 0) {
          console.log('  ✅ 转码任务已提交');
        }
      }
    }
  }
}
```

## 进阶技巧

### 并发控制

使用 `p-limit` 控制并发请求数：

```typescript
import pLimit from 'p-limit';

const limit = pLimit(5);  // 最多5个并发

const tasks = fileIds.map(fileId => 
  limit(() => sdk.file.getFileInfo({ fileId }))
);

const results = await Promise.all(tasks);
```

### 重试机制

```typescript
async function retryRequest<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}

// 使用
const result = await retryRequest(() => 
  sdk.user.getUserInfo()
);
```

### 进度追踪

```typescript
class ProgressTracker {
  private completed = 0;
  private total: number;

  constructor(total: number) {
    this.total = total;
  }

  increment() {
    this.completed++;
    const percent = ((this.completed / this.total) * 100).toFixed(2);
    console.log(`进度: ${this.completed}/${this.total} (${percent}%)`);
  }
}

// 使用
const tracker = new ProgressTracker(files.length);
for (const file of files) {
  await processFile(file);
  tracker.increment();
}
```

## 下一步

- 查看 [API 文档](/api/) 了解所有可用方法
- 阅读 [文件操作示例](/examples/file) 学习文件管理
- 查看 [图片处理示例](/examples/image) 学习图床使用

