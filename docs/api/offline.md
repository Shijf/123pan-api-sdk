# 离线下载模块

离线下载模块提供创建和管理离线下载任务的功能。

## 方法

### createTask()

创建单个离线下载任务。

**参数**

```typescript
interface CreateOfflineTaskParams {
  url: string;              // 下载URL
  parentId?: number;        // 父目录ID（选填，默认为根目录）
}
```

**示例**

```typescript
const result = await sdk.offline.createTask({
  url: 'https://example.com/file.zip',
  parentId: 0,  // 0 表示根目录
});

if (result.code === 0) {
  console.log('任务创建成功:', result.data);
  console.log('任务ID:', result.data.taskId);
}
```

**返回值**

```typescript
interface OfflineTask {
  taskId: number;           // 任务ID
  url: string;             // 下载URL
  fileName: string;        // 文件名
  fileSize: number;        // 文件大小（字节）
  status: number;          // 任务状态
  progress: number;        // 下载进度（0-100）
  createTime: string;      // 创建时间
  updateTime: string;      // 更新时间
}
```

---

### batchCreateTasks()

批量创建离线下载任务。

**参数**

```typescript
interface BatchCreateOfflineTaskParams {
  urls: string[];          // 下载URL列表
  parentId?: number;       // 父目录ID（选填）
}
```

**示例**

```typescript
const result = await sdk.offline.batchCreateTasks({
  urls: [
    'https://example.com/file1.zip',
    'https://example.com/file2.zip',
    'https://example.com/file3.zip',
  ],
  parentId: 12345,
});

if (result.code === 0) {
  console.log(`成功创建 ${result.data.length} 个任务`);
  result.data.forEach(task => {
    console.log(`- ${task.fileName} (ID: ${task.taskId})`);
  });
}
```

**返回值**

```typescript
interface ApiResponse<OfflineTask[]> {
  code: number;
  message: string;
  data: OfflineTask[];
}
```

---

### getDownloadProcess()

获取离线下载任务的进度。

**参数**

```typescript
{
  taskID: number | string;  // 离线下载任务ID
}
```

**示例**

```typescript
const result = await sdk.offline.getDownloadProcess({
  taskID: 123456,
});

if (result.code === 0) {
  const { process, status } = result.data;
  console.log(`下载进度: ${process}%`);
  console.log(`任务状态: ${getStatusText(status)}`);
}

function getStatusText(status: number): string {
  const statusMap = {
    0: '进行中',
    1: '下载失败',
    2: '下载成功',
    3: '重试中',
  };
  return statusMap[status] || '未知';
}
```

**返回值**

```typescript
interface GetOfflineDownloadProcessResponse {
  process: number;         // 下载进度百分比（0-100）
  status: 0 | 1 | 2 | 3;  // 0-进行中，1-失败，2-成功，3-重试中
}
```

---

### getTaskList()

获取离线任务列表（支持分页）。

**参数**

```typescript
interface PaginationParams {
  page?: number;           // 页码（从1开始）
  limit?: number;          // 每页数量
}
```

**示例**

```typescript
const result = await sdk.offline.getTaskList({
  page: 1,
  limit: 20,
});

if (result.code === 0) {
  console.log(`共 ${result.data.total} 个任务`);
  result.data.list.forEach(task => {
    console.log(`${task.fileName}: ${task.progress}%`);
  });
}
```

---

### getTaskInfo()

获取指定任务的详细信息。

**参数**

- `taskId: string` - 任务ID

**示例**

```typescript
const result = await sdk.offline.getTaskInfo('123456');

if (result.code === 0) {
  console.log('任务详情:', result.data);
}
```

---

### deleteTask()

删除指定的离线任务。

**参数**

- `taskId: string` - 任务ID

**示例**

```typescript
const result = await sdk.offline.deleteTask('123456');

if (result.code === 0) {
  console.log('任务已删除');
}
```

---

### pauseTask()

暂停指定的离线任务。

**参数**

- `taskId: string` - 任务ID

**示例**

```typescript
const result = await sdk.offline.pauseTask('123456');

if (result.code === 0) {
  console.log('任务已暂停');
}
```

---

### resumeTask()

恢复（继续）暂停的离线任务。

**参数**

- `taskId: string` - 任务ID

**示例**

```typescript
const result = await sdk.offline.resumeTask('123456');

if (result.code === 0) {
  console.log('任务已恢复');
}
```

## 任务状态说明

| 状态码 | 说明 |
|--------|------|
| `0` | 下载进行中 |
| `1` | 下载失败 |
| `2` | 下载成功 |
| `3` | 正在重试 |

## 完整示例

```typescript
import Pan123SDK from '@sharef/123pan-sdk';

async function manageOfflineTasks() {
  const sdk = new Pan123SDK({
    clientID: process.env.CLIENT_ID!,
    clientSecret: process.env.CLIENT_SECRET!,
  });

  // 1. 创建离线任务
  const createResult = await sdk.offline.createTask({
    url: 'https://example.com/large-file.zip',
    parentId: 0,
  });

  if (createResult.code !== 0) {
    console.error('创建任务失败:', createResult.message);
    return;
  }

  const taskId = createResult.data.taskId;
  console.log('任务创建成功，ID:', taskId);

  // 2. 轮询查询进度
  const pollInterval = 5000; // 5秒
  const maxAttempts = 60;    // 最多查询5分钟
  
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, pollInterval));

    const processResult = await sdk.offline.getDownloadProcess({
      taskID: taskId,
    });

    if (processResult.code === 0) {
      const { process, status } = processResult.data;
      
      console.log(`进度: ${process}%, 状态: ${status}`);

      // 检查是否完成
      if (status === 2) {
        console.log('✅ 下载成功！');
        break;
      } else if (status === 1) {
        console.error('❌ 下载失败');
        break;
      }
    }
  }

  // 3. 获取任务列表
  const listResult = await sdk.offline.getTaskList({
    page: 1,
    limit: 10,
  });

  if (listResult.code === 0) {
    console.log('\n当前任务列表:');
    listResult.data.list.forEach(task => {
      console.log(`- ${task.fileName}: ${task.progress}%`);
    });
  }
}

manageOfflineTasks();
```

## 注意事项

1. **URL 限制**: 仅支持 HTTP/HTTPS 协议的 URL
2. **文件大小**: 单个文件最大支持 100GB
3. **并发限制**: 同时进行的离线任务数量有限制
4. **轮询建议**: 查询进度建议间隔 5-10 秒，避免频繁请求
5. **失败重试**: 下载失败后可能会自动重试，状态码为 3

