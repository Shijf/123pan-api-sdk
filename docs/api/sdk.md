# SDK 主类

SDK 主类提供了初始化配置和全局管理功能。

## 初始化

```typescript
import Pan123SDK from '123pan-api-sdk';

const sdk = new Pan123SDK({
  clientID: 'your-client-id',
  clientSecret: 'your-client-secret',
  // 可选配置
  baseURL: 'https://open-api.123pan.com',
  debug: false,
  debugToken: 'your-debug-token', // 用于开发环境跳过 clientID/clientSecret 验证
});
```

## 配置选项

### SdkConfig

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `clientID` | `string` | 是 | 123云盘开放平台客户端ID |
| `clientSecret` | `string` | 是 | 123云盘开放平台客户端密钥 |
| `baseURL` | `string` | 否 | API基础URL，默认为 `https://open-api.123pan.com` |
| `debug` | `boolean` | 否 | 是否启用调试模式，默认为 `false` |
| `debugToken` | `string` | 否 | 调试用 JWT token，用于开发环境跳过认证 |

## 模块属性

SDK 实例提供以下模块：

```typescript
sdk.file        // 文件管理模块
sdk.user        // 用户模块
sdk.offline     // 离线下载模块
sdk.directLink  // 直链模块
sdk.image       // 图片/图床模块
sdk.video       // 视频转码模块
```

## 方法

### getTokenInfo()

获取当前访问令牌信息。

```typescript
const tokenInfo = await sdk.getTokenInfo();
console.log(tokenInfo);
// {
//   accessToken: 'eyJhbGc...',
//   expiresAt: 1234567890000,
//   uid: 12345678
// }
```

**返回值**
- `TokenInfo | null` - 令牌信息对象或 null

### refreshToken()

强制刷新访问令牌。

```typescript
await sdk.refreshToken();
```

**返回值**
- `Promise<void>`

### clearAuth()

清除本地认证信息。

```typescript
sdk.clearAuth();
```

### getRateLimiterStatus()

获取当前限流器状态。

```typescript
const status = sdk.getRateLimiterStatus();
console.log(status);
// { availableTokens: 85 }
```

**返回值**
- `{ availableTokens: number }` - 当前可用的令牌数

### resetRateLimit()

重置限流器。

```typescript
sdk.resetRateLimit();
```

### updateConfig()

更新 SDK 配置。

```typescript
sdk.updateConfig({
  debug: true,
  baseURL: 'https://custom-api.example.com'
});
```

**参数**
- `newConfig: Partial<SdkConfig>` - 要更新的配置项

### getHttpClient()

获取底层 HTTP 客户端实例（高级用法）。

```typescript
const httpClient = sdk.getHttpClient();
```

**返回值**
- `HttpClient` - HTTP 客户端实例

## 错误处理

SDK 统一使用 `ApiResponse` 格式返回：

```typescript
interface ApiResponse<T> {
  code: number;      // 0 表示成功，非 0 表示错误
  message: string;   // 响应消息
  data: T;          // 响应数据
}
```

**示例**

```typescript
try {
  const result = await sdk.user.getUserInfo();
  
  if (result.code === 0) {
    console.log('成功:', result.data);
  } else {
    console.error('API 错误:', result.message);
  }
} catch (error) {
  console.error('网络错误:', error);
}
```

## 完整示例

```typescript
import Pan123SDK from '123pan-api-sdk';

async function main() {
  // 初始化 SDK
  const sdk = new Pan123SDK({
    clientID: process.env.CLIENT_ID!,
    clientSecret: process.env.CLIENT_SECRET!,
    debug: true,
  });

  // 获取用户信息
  const userInfo = await sdk.user.getUserInfo();
  console.log('用户信息:', userInfo);

  // 获取文件列表
  const fileList = await sdk.file.getFileList({
    parentFileId: 0,
    limit: 100,
  });
  console.log('文件列表:', fileList);

  // 创建分享
  const share = await sdk.file.share.createShare({
    shareName: '我的分享',
    shareExpire: 7,
    fileIDList: [12345, 67890],
  });
  console.log('分享链接:', share);
}

main().catch(console.error);
```

