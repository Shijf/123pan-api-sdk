# 视频转码示例

本章节展示视频转码模块的实际使用案例。

::: tip 💡 视频转码流程
视频转码功能的完整流程：

1. **上传到云盘** - 先将视频文件上传到云盘空间（使用 `file` 模块）
2. **转移到转码空间** - 从云盘上传到转码空间（`video.upload.fromCloudDisk`）
3. **获取可转码分辨率** - 查询视频支持的分辨率（`video.info.getVideoResolutions`）
4. **提交转码任务** - 选择分辨率开始转码（`video.transcodeVideo`）
5. **查询转码进度** - 监控转码状态（`video.info.getTranscodeList`）

**注意**：转码空间与云盘空间是独立的。
:::

## 完整转码流程

### 基础转码流程

```typescript
import Pan123SDK from '@sharef/123pan-sdk';

const sdk = new Pan123SDK({
  clientID: process.env.CLIENT_ID!,
  clientSecret: process.env.CLIENT_SECRET!,
});

async function basicTranscodeFlow() {
  const cloudDiskFileId = 12345;  // 云盘中的视频文件ID

  try {
    // 步骤1: 上传到转码空间
    console.log('步骤1: 上传视频到转码空间...');
    const uploadResult = await sdk.video.upload.fromCloudDisk({
      fileIds: [cloudDiskFileId],
    });

    if (uploadResult.code !== 0) {
      console.error('上传失败:', uploadResult.message);
      return;
    }
    console.log('✅ 上传成功');

    // 步骤2: 获取转码空间文件列表，找到上传的视频
    console.log('\n步骤2: 查询转码空间文件...');
    const fileListResult = await sdk.video.getFileList({
      parentFileId: 0,
      limit: 10,
    });

    if (fileListResult.code !== 0) return;

    const videoFile = fileListResult.data.fileList.find(f => f.type === 0);
    if (!videoFile) {
      console.error('未找到视频文件');
      return;
    }

    console.log('找到视频:', videoFile.filename);
    const transcodeFileId = videoFile.fileId;

    // 步骤3: 获取可转码分辨率（带轮询）
    console.log('\n步骤3: 获取可转码分辨率...');
    const resolutionsResult = await sdk.video.info.getVideoResolutionsWithPolling({
      fileId: transcodeFileId,
      pollingInterval: 5000,
      maxAttempts: 20,
      onPolling: (attempt, isGetting) => {
        console.log(`  第 ${attempt} 次查询: ${isGetting ? '获取中...' : '完成'}`);
      },
    });

    if (resolutionsResult.code !== 0) {
      console.error('获取分辨率失败');
      return;
    }

    const { Resolutions, NowOrFinishedResolutions, CodecNames, VideoTime } = resolutionsResult.data;
    
    console.log('✅ 分辨率信息:');
    console.log('- 可转码:', Resolutions);
    console.log('- 已转码:', NowOrFinishedResolutions || '(从未转码)');
    console.log('- 编码:', CodecNames);
    console.log('- 时长:', VideoTime, '秒');

    // 步骤4: 计算需要转码的分辨率
    const available = Resolutions.split(',').filter(r => r);
    const finished = NowOrFinishedResolutions 
      ? NowOrFinishedResolutions.split(',').filter(r => r)
      : [];
    const pending = available.filter(r => !finished.includes(r));

    if (pending.length === 0) {
      console.log('所有分辨率均已转码完成');
      return;
    }

    // 步骤5: 提交转码任务
    console.log('\n步骤5: 提交转码任务...');
    console.log('要转码的分辨率:', pending.join(', '));

    const transcodeResult = await sdk.video.transcodeVideo({
      fileId: transcodeFileId,
      codecName: CodecNames,
      videoTime: VideoTime,
      resolutions: pending,
    });

    if (transcodeResult.code === 0) {
      console.log('✅ 转码任务已提交:', transcodeResult.data);
      return transcodeFileId;
    }
  } catch (error) {
    console.error('操作失败:', error);
  }
}

basicTranscodeFlow();
```

## 批量上传视频

### 从云盘批量上传

```typescript
async function batchUploadVideos(cloudDiskFileIds: number[]) {
  console.log(`准备上传 ${cloudDiskFileIds.length} 个视频文件`);

  // SDK 会自动处理分批（每批最多100个）
  const result = await sdk.video.upload.fromCloudDisk({
    fileIds: cloudDiskFileIds,
  });

  if (result.code === 0) {
    console.log('✅ 批量上传成功');
    return true;
  } else {
    console.error('批量上传失败:', result.message);
    return false;
  }
}

// 使用
const videoIds = [12345, 67890, 111, 222, 333];
await batchUploadVideos(videoIds);
```

### 超大批量上传（自动分批）

```typescript
async function massUploadVideos(cloudDiskFileIds: number[]) {
  const batchSize = 100;  // API限制每批100个
  const batches = [];

  // 分批
  for (let i = 0; i < cloudDiskFileIds.length; i += batchSize) {
    batches.push(cloudDiskFileIds.slice(i, i + batchSize));
  }

  console.log(`总共 ${cloudDiskFileIds.length} 个文件，分为 ${batches.length} 批`);

  for (let i = 0; i < batches.length; i++) {
    console.log(`\n上传第 ${i + 1}/${batches.length} 批...`);
    
    const result = await sdk.video.upload.fromCloudDisk({
      fileIds: batches[i],
    });

    if (result.code === 0) {
      console.log(`✅ 第 ${i + 1} 批上传成功`);
    } else {
      console.error(`❌ 第 ${i + 1} 批上传失败:`, result.message);
    }

    // 避免请求过快
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n✅ 所有批次上传完成');
}

// 上传200个视频
const largeVideoList = Array.from({ length: 200 }, (_, i) => i + 10000);
await massUploadVideos(largeVideoList);
```

## 转码空间文件管理

### 获取转码空间根目录

```typescript
async function getTranscodeFolderInfo() {
  const result = await sdk.video.info.getFolderInfo();

  if (result.code === 0) {
    console.log('转码空间文件夹ID:', result.data.fileID);
    return result.data.fileID;
  }
  return null;
}
```

### 列出所有转码视频

```typescript
async function listAllTranscodeVideos() {
  const allFiles: any[] = [];
  let lastFileId: number | undefined = undefined;

  while (true) {
    const result = await sdk.video.getFileList({
      parentFileId: 0,
      limit: 100,
      lastFileId,
    });

    if (result.code !== 0) break;

    // 只保留视频文件（type=0）
    const videoFiles = result.data.fileList.filter(f => f.type === 0);
    allFiles.push(...videoFiles);

    console.log(`已获取 ${allFiles.length} 个视频文件...`);

    // -1 表示最后一页
    if (result.data.lastFileId === -1) break;
    
    lastFileId = result.data.lastFileId;
  }

  console.log(`\n总共 ${allFiles.length} 个视频文件`);
  return allFiles;
}
```

### 搜索视频文件

```typescript
async function searchTranscodeVideos(keyword: string) {
  const result = await sdk.video.getFileList({
    parentFileId: 0,
    limit: 100,
    searchData: keyword,
    searchMode: 0,  // 模糊搜索
  });

  if (result.code === 0) {
    console.log(`找到 ${result.data.fileList.length} 个包含 "${keyword}" 的视频`);
    
    result.data.fileList.forEach((file, index) => {
      console.log(`${index + 1}. ${file.filename}`);
      console.log(`   ID: ${file.fileId}`);
      console.log(`   大小: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
    });

    return result.data.fileList;
  }
  return [];
}

// 搜索所有包含 "conference" 的视频
await searchTranscodeVideos('conference');
```

## 查询转码信息

### 查询单个视频的转码状态

```typescript
async function checkTranscodeStatus(fileId: number) {
  // 1. 获取可转码分辨率
  const resolutionsResult = await sdk.video.info.getVideoResolutions({
    fileId,
  });

  if (resolutionsResult.code !== 0) {
    console.error('获取分辨率失败');
    return;
  }

  const { IsGetResolution, Resolutions, NowOrFinishedResolutions } = resolutionsResult.data;

  if (IsGetResolution) {
    console.log('⏳ 正在获取分辨率信息，请稍后重试');
    return;
  }

  console.log('可转码分辨率:', Resolutions);
  console.log('已转码分辨率:', NowOrFinishedResolutions || '(从未转码)');

  // 2. 获取转码列表
  const listResult = await sdk.video.info.getTranscodeList({
    fileId,
  });

  if (listResult.code === 0) {
    console.log('\n转码状态:', getTranscodeStatusText(listResult.data.status));
    console.log('转码列表:');
    
    listResult.data.list.forEach((item, index) => {
      console.log(`\n${index + 1}. ${item.resolution} (${item.height}p)`);
      console.log(`   状态: ${item.status === 255 ? '✅ 完成' : '⏳ 处理中'}`);
      console.log(`   进度: ${item.progress}%`);
      console.log(`   时长: ${item.duration.toFixed(2)} 秒`);
      console.log(`   码率: ${(item.bitRate / 1000000).toFixed(2)} Mbps`);
      
      if (item.status === 255) {
        console.log(`   播放地址: ${item.url.substring(0, 50)}...`);
      }
    });
  }
}

function getTranscodeStatusText(status: number): string {
  const map = {
    1: '待转码',
    3: '转码失败',
    254: '部分成功',
    255: '全部成功',
  };
  return map[status] || '未知';
}
```

### 监控转码进度

```typescript
async function monitorTranscode(fileId: number) {
  console.log('开始监控转码进度...\n');

  const maxAttempts = 60;  // 最多监控5分钟（每5秒一次）
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const result = await sdk.video.info.getTranscodeList({
      fileId,
    });

    if (result.code !== 0) {
      console.error('查询失败:', result.message);
      break;
    }

    const { status, list } = result.data;
    
    console.clear();
    console.log(`=== 转码进度监控 (第 ${attempt} 次查询) ===\n`);
    console.log(`整体状态: ${getTranscodeStatusText(status)}\n`);

    list.forEach(item => {
      const statusIcon = item.status === 255 ? '✅' : '⏳';
      console.log(`${statusIcon} ${item.resolution}: ${item.progress}%`);
    });

    // 检查是否全部完成
    if (status === 255) {
      console.log('\n🎉 所有分辨率转码完成!');
      
      console.log('\n播放链接:');
      list.forEach(item => {
        console.log(`${item.resolution}: ${item.url}`);
      });
      break;
    } else if (status === 3) {
      console.log('\n❌ 转码失败');
      break;
    }

    // 等待5秒后继续
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}
```

## 批量转码管理

### 批量转码多个视频

```typescript
async function batchTranscodeVideos(fileIds: number[]) {
  console.log(`准备为 ${fileIds.length} 个视频启动转码任务\n`);

  const results = [];

  for (let i = 0; i < fileIds.length; i++) {
    const fileId = fileIds[i];
    console.log(`\n[${i + 1}/${fileIds.length}] 处理视频 ID: ${fileId}`);

    try {
      // 1. 获取分辨率信息（带轮询）
      console.log('  获取分辨率信息...');
      const resolutionsResult = await sdk.video.info.getVideoResolutionsWithPolling({
        fileId,
        pollingInterval: 3000,
        maxAttempts: 10,
        onPolling: (attempt) => {
          process.stdout.write(`\r    查询中... 第 ${attempt} 次`);
        },
      });

      if (resolutionsResult.code !== 0) {
        console.log('\n  ❌ 获取分辨率失败');
        results.push({ fileId, success: false, reason: '获取分辨率失败' });
        continue;
      }

      const { Resolutions, NowOrFinishedResolutions, CodecNames, VideoTime } = resolutionsResult.data;

      // 2. 计算需要转码的分辨率
      const available = Resolutions.split(',').filter(r => r);
      const finished = NowOrFinishedResolutions 
        ? NowOrFinishedResolutions.split(',').filter(r => r)
        : [];
      const pending = available.filter(r => !finished.includes(r));

      console.log(`\n  可转码: ${Resolutions}`);
      console.log(`  已转码: ${NowOrFinishedResolutions || '(无)'}`);

      if (pending.length === 0) {
        console.log('  ℹ️  所有分辨率均已转码');
        results.push({ fileId, success: true, reason: '已全部转码' });
        continue;
      }

      // 3. 提交转码任务
      console.log(`  提交转码: ${pending.join(', ')}`);
      const transcodeResult = await sdk.video.transcodeVideo({
        fileId,
        codecName: CodecNames,
        videoTime: VideoTime,
        resolutions: pending,
      });

      if (transcodeResult.code === 0) {
        console.log('  ✅ 转码任务已提交');
        results.push({ fileId, success: true, resolutions: pending });
      } else {
        console.log(`  ❌ 提交失败: ${transcodeResult.message}`);
        results.push({ fileId, success: false, reason: transcodeResult.message });
      }
    } catch (error) {
      console.log(`  ❌ 异常: ${error.message}`);
      results.push({ fileId, success: false, reason: error.message });
    }

    // 避免请求过快
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // 输出汇总
  console.log('\n\n=== 批量转码汇总 ===');
  const successCount = results.filter(r => r.success).length;
  console.log(`成功: ${successCount}/${fileIds.length}`);
  
  if (successCount < fileIds.length) {
    console.log('\n失败的任务:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`- 文件 ${r.fileId}: ${r.reason}`);
    });
  }

  return results;
}

// 使用
const videoIds = [12345, 67890, 111, 222];
await batchTranscodeVideos(videoIds);
```

## 完整示例：视频转码工具

```typescript
import Pan123SDK from '@sharef/123pan-sdk';

class VideoTranscodeTool {
  private sdk: Pan123SDK;

  constructor(sdk: Pan123SDK) {
    this.sdk = sdk;
  }

  // 完整转码流程
  async transcodeVideoFromCloudDisk(cloudDiskFileId: number) {
    console.log('=== 视频转码完整流程 ===\n');

    // 1. 上传到转码空间
    console.log('步骤1: 上传视频到转码空间');
    const uploadResult = await this.sdk.video.upload.fromCloudDisk({
      fileIds: [cloudDiskFileId],
    });

    if (uploadResult.code !== 0) {
      throw new Error(`上传失败: ${uploadResult.message}`);
    }
    console.log('✅ 上传成功\n');

    // 等待文件处理
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 2. 获取转码空间文件
    console.log('步骤2: 查找上传的视频');
    const fileListResult = await this.sdk.video.getFileList({
      parentFileId: 0,
      limit: 10,
    });

    if (fileListResult.code !== 0) {
      throw new Error('获取文件列表失败');
    }

    const videoFile = fileListResult.data.fileList.find(f => f.type === 0);
    if (!videoFile) {
      throw new Error('未找到视频文件');
    }

    console.log(`✅ 找到视频: ${videoFile.filename}\n`);
    const transcodeFileId = videoFile.fileId;

    // 3. 获取可转码分辨率
    console.log('步骤3: 获取可转码分辨率');
    const resolutionsResult = await this.sdk.video.info.getVideoResolutionsWithPolling({
      fileId: transcodeFileId,
      pollingInterval: 5000,
      maxAttempts: 20,
      onPolling: (attempt, isGetting) => {
        console.log(`  查询第 ${attempt} 次: ${isGetting ? '获取中...' : '完成'}`);
      },
    });

    if (resolutionsResult.code !== 0) {
      throw new Error('获取分辨率失败');
    }

    const { Resolutions, NowOrFinishedResolutions, CodecNames, VideoTime } = resolutionsResult.data;
    console.log('✅ 分辨率信息:');
    console.log(`  可转码: ${Resolutions}`);
    console.log(`  已转码: ${NowOrFinishedResolutions || '(从未转码)'}\n`);

    // 4. 计算需要转码的分辨率
    const available = Resolutions.split(',').filter(r => r);
    const finished = NowOrFinishedResolutions 
      ? NowOrFinishedResolutions.split(',').filter(r => r)
      : [];
    const pending = available.filter(r => !finished.includes(r));

    if (pending.length === 0) {
      console.log('ℹ️  所有分辨率均已转码完成');
      return transcodeFileId;
    }

    // 5. 提交转码任务
    console.log('步骤4: 提交转码任务');
    console.log(`  转码分辨率: ${pending.join(', ')}`);
    
    const transcodeResult = await this.sdk.video.transcodeVideo({
      fileId: transcodeFileId,
      codecName: CodecNames,
      videoTime: VideoTime,
      resolutions: pending,
    });

    if (transcodeResult.code !== 0) {
      throw new Error(`转码失败: ${transcodeResult.message}`);
    }

    console.log('✅ 转码任务已提交:', transcodeResult.data);
    console.log('\n步骤5: 监控转码进度');

    // 6. 监控转码进度
    await this.monitorProgress(transcodeFileId);

    return transcodeFileId;
  }

  // 监控转码进度
  async monitorProgress(fileId: number) {
    const maxAttempts = 60;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 5000));

      const result = await this.sdk.video.info.getTranscodeList({
        fileId,
      });

      if (result.code !== 0) continue;

      const { status, list } = result.data;

      console.log(`\n[查询 ${attempt}/${maxAttempts}]`);
      list.forEach(item => {
        const icon = item.status === 255 ? '✅' : '⏳';
        console.log(`  ${icon} ${item.resolution}: ${item.progress}%`);
      });

      if (status === 255) {
        console.log('\n🎉 转码完成!\n');
        console.log('播放链接:');
        list.forEach(item => {
          console.log(`  ${item.resolution}: ${item.url}`);
        });
        break;
      } else if (status === 3) {
        throw new Error('转码失败');
      }
    }
  }

  // 批量转码
  async batchTranscode(cloudDiskFileIds: number[]) {
    console.log(`=== 批量转码 ${cloudDiskFileIds.length} 个视频 ===\n`);

    for (let i = 0; i < cloudDiskFileIds.length; i++) {
      console.log(`\n[${i + 1}/${cloudDiskFileIds.length}] 处理视频 ID: ${cloudDiskFileIds[i]}`);
      
      try {
        await this.transcodeVideoFromCloudDisk(cloudDiskFileIds[i]);
        console.log('✅ 完成\n');
      } catch (error) {
        console.error(`❌ 失败: ${error.message}\n`);
      }
    }

    console.log('=== 批量转码完成 ===');
  }
}

// 使用
async function main() {
  const sdk = new Pan123SDK({
    clientID: process.env.CLIENT_ID!,
    clientSecret: process.env.CLIENT_SECRET!,
  });

  const tool = new VideoTranscodeTool(sdk);

  // 转码单个视频
  // await tool.transcodeVideoFromCloudDisk(12345);

  // 批量转码
  await tool.batchTranscode([12345, 67890, 111]);
}

main().catch(console.error);
```

## 注意事项

1. **分辨率格式**: P 必须大写，如 `2160P`、`1080P`、`720P`
2. **转码时间**: 取决于视频时长和分辨率，耐心等待
3. **重复转码**: 避免重复提交已转码的分辨率
4. **轮询间隔**: 查询分辨率信息建议间隔 10 秒
5. **空间类型**: 转码空间（businessType=2）与云盘空间独立
6. **批量限制**: 每次最多上传 100 个文件
7. **授权要求**: `getTranscodeList` 需要授权 access_token

