# 直链管理模块

直链管理模块提供完整的直链空间管理、IP黑名单控制和日志查询功能。

::: tip 💡 直链管理功能
- **空间管理**：启用/禁用直链空间，获取直链URL，刷新缓存
- **IP黑名单**：限制特定IP访问，支持最多2000个IP地址
- **日志查询**：查看离线日志（30天）和流量日志（3天）
- **开发者权益**：所有API均需要开通开发者权益

**工作流程**：
1. 启用直链空间（`space.enable`）
2. 配置IP黑名单（可选，`ip.*`）
3. 刷新缓存使配置生效（`space.refreshCache`）
4. 获取文件直链URL（`space.getUrl`）
5. 查看流量统计（`logger.getTrafficLogs`）
:::

## 子模块

直链模块包含以下子模块：

- `sdk.directLink.space` - 空间管理
- `sdk.directLink.ip` - IP黑名单管理
- `sdk.directLink.logger` - 日志查询

---

## 空间管理 (space)

### enable()

启用直链空间。

**参数**

```typescript
interface EnableDirectLinkParams {
  fileID: number;  // 启用直链空间的文件夹的fileID
}
```

**示例**

```typescript
const result = await sdk.directLink.space.enable({
  fileID: 4404009,
});

if (result.code === 0) {
  console.log('✅ 直链空间已启用');
  console.log('文件夹名称:', result.data.filename);
}
```

**返回值**

```typescript
interface EnableDirectLinkResponse {
  filename: string;  // 成功启用的文件夹名称
}
```

---

### disable()

禁用直链空间。

**参数**

```typescript
interface DisableDirectLinkParams {
  fileID: number;  // 禁用直链空间的文件夹的fileID
}
```

**示例**

```typescript
const result = await sdk.directLink.space.disable({
  fileID: 4404009,
});

if (result.code === 0) {
  console.log('✅ 直链空间已禁用');
  console.log('文件夹名称:', result.data.filename);
}
```

**返回值**

```typescript
interface DisableDirectLinkResponse {
  filename: string;  // 成功禁用的文件夹名称
}
```

---

### getUrl()

获取指定文件的直链URL。

**参数**

```typescript
interface GetDirectLinkUrlParams {
  fileID: number;  // 需要获取直链的文件ID（必须在已启用直链的文件夹下）
}
```

**示例**

```typescript
const result = await sdk.directLink.space.getUrl({
  fileID: 10861131,
});

if (result.code === 0) {
  console.log('✅ 直链URL:', result.data.url);
  // https://vip.123pan.cn/1815309870/测试直链文件夹/我从草原来.mp4
}
```

**返回值**

```typescript
interface GetDirectLinkUrlResponse {
  url: string;  // 文件对应的直链URL
}
```

**注意事项**：
- fileID 必须是文件ID，不能是文件夹ID
- 文件必须在已启用直链的文件夹中
- 返回的URL可以直接访问，是公开的

---

### refreshCache()

刷新直链缓存，使配置更新立即生效。

**参数**

无需参数

**示例**

```typescript
// 修改配置后刷新缓存
await sdk.directLink.ip.updateBlacklist({
  IpList: ['192.168.1.1', '10.0.0.1']
});

// 刷新缓存使配置立即生效
await sdk.directLink.space.refreshCache();

console.log('✅ 缓存已刷新，配置已生效');
```

**使用场景**：
- 修改IP黑名单后刷新
- 启用/禁用直链空间后刷新
- 批量修改配置后统一刷新

---

## IP黑名单管理 (ip)

### getBlacklist()

获取IP黑名单列表和状态。

**参数**

无需参数

**示例**

```typescript
const result = await sdk.directLink.ip.getBlacklist();

if (result.code === 0) {
  console.log('状态:', result.data.status === 1 ? '✅ 已启用' : '⚠️  已禁用');
  console.log('黑名单IP数量:', result.data.ipList.length);
  
  result.data.ipList.forEach((ip, index) => {
    console.log(`  ${index + 1}. ${ip}`);
  });
}
```

**返回值**

```typescript
interface GetIpBlacklistResponse {
  ipList: string[];  // IP地址列表
  status: 1 | 2;     // 1=启用, 2=禁用
}
```

---

### toggleBlacklist()

启用或禁用IP黑名单功能。

**参数**

```typescript
interface ToggleIpBlacklistParams {
  Status: 1 | 2;  // 1=启用, 2=禁用
}
```

**示例**

```typescript
// 启用IP黑名单
await sdk.directLink.ip.toggleBlacklist({
  Status: 1,
});

// 禁用IP黑名单
await sdk.directLink.ip.toggleBlacklist({
  Status: 2,
});
```

**返回值**

```typescript
interface ToggleIpBlacklistResponse {
  Done: boolean;  // 操作是否完成
}
```

---

### updateBlacklist()

更新IP黑名单列表（完全替换）。

**参数**

```typescript
interface UpdateIpBlacklistParams {
  IpList: string[];  // IP地址列表，最多2000个IPv4地址
}
```

**示例**

```typescript
// 完全替换黑名单
await sdk.directLink.ip.updateBlacklist({
  IpList: ['192.168.1.1', '10.0.0.1', '172.16.0.1'],
});

// 追加IP（需要先获取现有列表）
const current = await sdk.directLink.ip.getBlacklist();
const newIpList = [
  ...current.data.ipList,  // 保留现有IP
  '192.168.1.100',         // 添加新IP
];
await sdk.directLink.ip.updateBlacklist({ IpList: newIpList });
```

**注意事项**：
- 这是完全替换操作，不是追加
- 最多支持2000个IPv4地址
- SDK会自动验证IP格式
- IpList 不能为空数组

---

## 日志查询 (logger)

### getOfflineLogs()

获取直链离线日志（近30天）。

**参数**

```typescript
interface GetOfflineLogsParams {
  startHour: string;  // 开始时间，格式：2025010115（年月日时）
  endHour: string;    // 结束时间，格式：2025010116（年月日时）
  pageNum: number;    // 页数，从1开始
  pageSize: number;   // 分页大小
}
```

**示例**

```typescript
const result = await sdk.directLink.logger.getOfflineLogs({
  startHour: '2025010100',  // 2025-01-01 00:00
  endHour: '2025010200',    // 2025-01-02 00:00
  pageNum: 1,
  pageSize: 10,
});

if (result.code === 0) {
  console.log(`共 ${result.data.total} 条日志`);
  
  result.data.list.forEach(log => {
    console.log(`- ${log.fileName} (${log.logTimeRange})`);
    console.log(`  大小: ${(log.fileSize / 1024).toFixed(2)} KB`);
    console.log(`  下载: ${log.downloadURL}`);
  });
}
```

**返回值**

```typescript
interface GetOfflineLogsResponse {
  total: number;
  list: OfflineLogItem[];
}

interface OfflineLogItem {
  id: number;              // 唯一ID
  fileName: string;        // 文件名（.gz格式）
  fileSize: number;        // 文件大小（字节）
  logTimeRange: string;    // 日志时间范围，如 "2025-06-20 15:00~16:00"
  downloadURL: string;     // 下载地址
}
```

**注意事项**：
- 仅限查询近30天的日志
- 时间格式为10位数字：YYYYMMDDHH
- 日志文件为 .gz 压缩格式

---

### getTrafficLogs()

获取直链流量日志（近3天）。

**参数**

```typescript
interface GetTrafficLogsParams {
  pageNum: number;      // 页数
  pageSize: number;     // 分页大小
  startTime: string;    // 开始时间，格式：2025-01-01 00:00:00
  endTime: string;      // 结束时间，格式：2025-01-01 23:59:59
}
```

**示例**

```typescript
const result = await sdk.directLink.logger.getTrafficLogs({
  pageNum: 1,
  pageSize: 100,
  startTime: '2025-01-01 00:00:00',
  endTime: '2025-01-01 23:59:59',
});

if (result.code === 0) {
  console.log(`共 ${result.data.total} 条记录`);
  
  let totalTraffic = 0;
  result.data.list.forEach(log => {
    console.log(`\n文件: ${log.fileName}`);
    console.log(`  路径: ${log.filePath}`);
    console.log(`  来源: ${log.fileSource === 1 ? '云盘' : '图床'}`);
    console.log(`  流量: ${(log.totalTraffic / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  直链: ${log.directLinkURL}`);
    
    totalTraffic += log.totalTraffic;
  });
  
  console.log(`\n总流量: ${(totalTraffic / 1024 / 1024 / 1024).toFixed(2)} GB`);
}
```

**返回值**

```typescript
interface GetTrafficLogsResponse {
  total: number;
  list: TrafficLogItem[];
}

interface TrafficLogItem {
  uniqueID: string;       // 唯一ID
  fileName: string;       // 文件名
  fileSize: number;       // 文件大小（字节）
  filePath: string;       // 文件路径
  directLinkURL: string;  // 直链URL
  fileSource: 1 | 2;      // 1=全部文件（云盘），2=图床
  totalTraffic: number;   // 消耗流量（字节）
}
```

**注意事项**：
- 仅限查询近3天的日志
- 时间格式：YYYY-MM-DD HH:MM:SS
- 流量单位为字节，需要自行转换

---

## 完整示例

### 基础使用流程

```typescript
import Pan123SDK from '@sharef/123pan-sdk';

async function directLinkWorkflow() {
  const sdk = new Pan123SDK({
    clientID: process.env.CLIENT_ID!,
    clientSecret: process.env.CLIENT_SECRET!,
  });

  const folderID = 4404009;
  const fileID = 10861131;

  try {
    // 1. 启用直链空间
    console.log('步骤1: 启用直链空间');
    const enableResult = await sdk.directLink.space.enable({
      fileID: folderID,
    });
    console.log(`✅ 已启用文件夹: ${enableResult.data.filename}`);

    // 2. 配置IP黑名单
    console.log('\n步骤2: 配置IP黑名单');
    await sdk.directLink.ip.updateBlacklist({
      IpList: ['192.168.1.1', '10.0.0.1'],
    });
    await sdk.directLink.ip.toggleBlacklist({ Status: 1 });
    console.log('✅ IP黑名单已配置');

    // 3. 刷新缓存
    console.log('\n步骤3: 刷新缓存');
    await sdk.directLink.space.refreshCache();
    console.log('✅ 缓存已刷新');

    // 4. 获取直链URL
    console.log('\n步骤4: 获取直链URL');
    const urlResult = await sdk.directLink.space.getUrl({
      fileID: fileID,
    });
    console.log(`✅ 直链: ${urlResult.data.url}`);

    // 5. 查看流量统计
    console.log('\n步骤5: 查看流量统计');
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const formatDateTime = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hour = String(date.getHours()).padStart(2, '0');
      const minute = String(date.getMinutes()).padStart(2, '0');
      const second = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
    };
    
    const trafficLogs = await sdk.directLink.logger.getTrafficLogs({
      pageNum: 1,
      pageSize: 10,
      startTime: formatDateTime(yesterday),
      endTime: formatDateTime(now),
    });
    
    const totalTraffic = trafficLogs.data.list.reduce(
      (sum, log) => sum + log.totalTraffic,
      0
    );
    console.log(`✅ 24小时流量: ${(totalTraffic / 1024 / 1024).toFixed(2)} MB`);

    console.log('\n🎉 直链配置完成！');
  } catch (error) {
    console.error('操作失败:', error);
  }
}

directLinkWorkflow();
```

### 批量获取直链

```typescript
async function getBatchDirectLinks(fileIDs: number[]) {
  const results = [];
  
  for (const fileID of fileIDs) {
    try {
      const result = await sdk.directLink.space.getUrl({ fileID });
      if (result.code === 0) {
        results.push({
          fileID,
          url: result.data.url,
          success: true,
        });
        console.log(`✅ 文件 ${fileID}: ${result.data.url}`);
      } else {
        results.push({
          fileID,
          error: result.message,
          success: false,
        });
      }
    } catch (error: any) {
      results.push({
        fileID,
        error: error.message,
        success: false,
      });
    }
  }
  
  return results;
}

// 使用示例
const fileIDs = [10861131, 10861132, 10861133];
const results = await getBatchDirectLinks(fileIDs);

console.log('\n获取结果:');
console.log(`  成功: ${results.filter(r => r.success).length}`);
console.log(`  失败: ${results.filter(r => !r.success).length}`);
```

### IP黑名单管理

```typescript
async function manageIpBlacklist() {
  // 1. 获取当前配置
  const current = await sdk.directLink.ip.getBlacklist();
  console.log('当前状态:', current.data.status === 1 ? '已启用' : '已禁用');
  console.log('当前IP数量:', current.data.ipList.length);
  
  // 2. 添加新IP（保留现有）
  const newIpList = [
    ...current.data.ipList,
    '192.168.1.100',
    '192.168.1.101',
  ];
  
  await sdk.directLink.ip.updateBlacklist({ IpList: newIpList });
  
  // 3. 启用黑名单
  if (current.data.status !== 1) {
    await sdk.directLink.ip.toggleBlacklist({ Status: 1 });
  }
  
  // 4. 刷新缓存
  await sdk.directLink.space.refreshCache();
  
  // 5. 验证更新
  const updated = await sdk.directLink.ip.getBlacklist();
  console.log('更新后IP数量:', updated.data.ipList.length);
}
```

### 流量分析

```typescript
async function analyzeTraffic() {
  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  
  const formatDateTime = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
  };
  
  // 查询所有流量日志
  const allLogs = [];
  let pageNum = 1;
  const pageSize = 100;
  
  while (true) {
    const result = await sdk.directLink.logger.getTrafficLogs({
      pageNum,
      pageSize,
      startTime: formatDateTime(threeDaysAgo),
      endTime: formatDateTime(now),
    });
    
    allLogs.push(...result.data.list);
    
    if (result.data.list.length < pageSize) {
      break;
    }
    
    pageNum++;
  }
  
  // 统计分析
  const stats = {
    totalFiles: allLogs.length,
    totalTraffic: 0,
    cloudDiskTraffic: 0,
    imageBedTraffic: 0,
  };
  
  allLogs.forEach(log => {
    stats.totalTraffic += log.totalTraffic;
    
    if (log.fileSource === 1) {
      stats.cloudDiskTraffic += log.totalTraffic;
    } else {
      stats.imageBedTraffic += log.totalTraffic;
    }
  });
  
  console.log('📊 流量统计报告:');
  console.log(`   总文件数: ${stats.totalFiles}`);
  console.log(`   总流量: ${(stats.totalTraffic / 1024 / 1024 / 1024).toFixed(2)} GB`);
  console.log(`   云盘流量: ${(stats.cloudDiskTraffic / 1024 / 1024 / 1024).toFixed(2)} GB`);
  console.log(`   图床流量: ${(stats.imageBedTraffic / 1024 / 1024 / 1024).toFixed(2)} GB`);
  
  // Top 10 流量文件
  const topFiles = allLogs
    .sort((a, b) => b.totalTraffic - a.totalTraffic)
    .slice(0, 10);
  
  console.log('\n   Top 10 流量文件:');
  topFiles.forEach((log, index) => {
    console.log(`   ${index + 1}. ${log.fileName}`);
    console.log(`      流量: ${(log.totalTraffic / 1024 / 1024).toFixed(2)} MB`);
  });
}
```

## 使用场景

### 1. 外链分享

```typescript
// 为文件生成公开访问的直链
const result = await sdk.directLink.space.getUrl({ fileID: 12345 });
const shareUrl = result.data.url;

// 分享链接给他人
console.log('分享链接:', shareUrl);
// 用户可以直接访问：https://vip.123pan.cn/xxx/文件名.mp4
```

### 2. 网页嵌入

```typescript
// 获取图片/视频直链用于网页嵌入
const imageUrl = (await sdk.directLink.space.getUrl({ fileID: 11111 })).data.url;
const videoUrl = (await sdk.directLink.space.getUrl({ fileID: 22222 })).data.url;

// HTML 中使用
const html = `
  <img src="${imageUrl}" alt="图片" />
  <video src="${videoUrl}" controls></video>
`;
```

### 3. API接口返回

```typescript
// 作为API响应返回给前端
app.get('/api/file/:id', async (req, res) => {
  const fileID = parseInt(req.params.id);
  
  try {
    const result = await sdk.directLink.space.getUrl({ fileID });
    
    res.json({
      success: true,
      url: result.data.url,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
```

### 4. IP访问控制

```typescript
// 限制特定地区或IP访问
await sdk.directLink.ip.updateBlacklist({
  IpList: [
    '192.168.1.0/24',  // 整个网段（如果API支持）
    '10.0.0.1',        // 单个IP
    '172.16.0.1',
  ],
});

await sdk.directLink.ip.toggleBlacklist({ Status: 1 });
await sdk.directLink.space.refreshCache();

console.log('✅ IP黑名单已生效');
```

### 5. 流量监控

```typescript
// 定期检查流量使用情况
setInterval(async () => {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  const formatDateTime = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
  };
  
  const result = await sdk.directLink.logger.getTrafficLogs({
    pageNum: 1,
    pageSize: 100,
    startTime: formatDateTime(yesterday),
    endTime: formatDateTime(now),
  });
  
  const totalTraffic = result.data.list.reduce(
    (sum, log) => sum + log.totalTraffic,
    0
  );
  
  console.log(`24小时流量: ${(totalTraffic / 1024 / 1024 / 1024).toFixed(2)} GB`);
  
  // 流量告警
  if (totalTraffic > 10 * 1024 * 1024 * 1024) {  // 超过10GB
    console.warn('⚠️  流量超标，请注意！');
    // 发送告警通知...
  }
}, 60 * 60 * 1000); // 每小时检查一次
```

## 注意事项

### 通用注意事项

1. **开发者权益**: 所有API都需要开通开发者权益才能使用
2. **fileID类型**: 启用/禁用空间需要文件夹ID，获取URL需要文件ID
3. **直链公开性**: 直链URL是公开的，任何人都可以访问
4. **配置生效**: 修改配置后建议调用 `refreshCache()` 使其立即生效

### 空间管理

1. **文件夹ID**: `enable()` 和 `disable()` 必须传入文件夹ID
2. **文件ID**: `getUrl()` 必须传入文件ID，且文件必须在已启用直链的文件夹下
3. **重复操作**: 同一文件夹可能不能重复启用
4. **缓存刷新**: 建议在批量操作后统一刷新一次

### IP黑名单

1. **替换操作**: `updateBlacklist()` 是完全替换，不是追加
2. **数量限制**: 最多支持2000个IPv4地址
3. **格式验证**: SDK会自动验证IP格式
4. **空数组限制**: IpList 不能为空数组

### 日志查询

1. **离线日志**: 仅限查询近30天，时间格式 YYYYMMDDHH
2. **流量日志**: 仅限查询近3天，时间格式 YYYY-MM-DD HH:MM:SS
3. **分页处理**: 建议 pageSize 设置为 50-100
4. **流量单位**: API返回单位为字节，需要自行转换

### 性能优化

1. **批量操作**: 多次配置修改后统一刷新缓存
2. **轮询间隔**: 避免频繁调用刷新接口
3. **流量查询**: 合理设置查询时间范围和分页大小
4. **错误重试**: 建议添加重试机制处理临时错误

## 官方文档

本模块基于 [123Pan 开放平台官方文档](https://123yunpan.yuque.com/org-wiki-123yunpan-muaork/cr6ced) 实现。

所有用到的 123Pan Logo、品牌标识、相关图标及文字等知识产权归 123云盘官方所有，如有侵权请联系删除。
