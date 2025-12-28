# 配置

了解如何配置 123Pan API SDK 以满足你的需求。

## 基础配置

创建 SDK 实例时，你需要提供以下必需参数：

```typescript
import Pan123SDK from '123pan-api-sdk';

const sdk = new Pan123SDK({
  clientID: 'your-client-id',      // 必需
  clientSecret: 'your-client-secret', // 必需
});
```

## 完整配置选项

SDK 支持以下所有配置选项：

```typescript
interface SdkConfig {
  // 必需参数
  clientID: string;        // 应用 Client ID
  clientSecret: string;    // 应用 Client Secret
  
  // 可选参数
  baseURL?: string;        // API 基础 URL，默认: 'https://open-api.123pan.com'
  timeout?: number;        // 请求超时时间（毫秒），默认: 30000
  maxRetries?: number;     // 最大重试次数，默认: 3
  retryDelay?: number;     // 重试延迟（毫秒），默认: 1000
  
  // 限流配置
  rateLimit?: {
    capacity?: number;     // 令牌桶容量，默认: 10
    refillRate?: number;   // 令牌恢复速率（个/秒），默认: 2
  };
  
  // 调试模式
  debug?: boolean;         // 开启调试日志，默认: false
  debugToken?: string;     // 调试用的 JWT token（用于避免限流）
}
```

## 常用配置示例

### 生产环境配置

```typescript
const sdk = new Pan123SDK({
  clientID: process.env.CLIENT_ID!,
  clientSecret: process.env.CLIENT_SECRET!,
  timeout: 60000,      // 增加超时时间到 60 秒
  maxRetries: 5,       // 增加重试次数
  debug: false,        // 关闭调试日志
});
```

### 开发环境配置

```typescript
const sdk = new Pan123SDK({
  clientID: process.env.DEV_CLIENT_ID!,
  clientSecret: process.env.DEV_CLIENT_SECRET!,
  debug: true,         // 开启调试日志
  debugToken: process.env.DEBUG_TOKEN, // 使用调试 token
  rateLimit: {
    capacity: 20,      // 增加令牌桶容量
    refillRate: 5,     // 加快令牌恢复速率
  },
});
```

### 自定义 API 地址

```typescript
const sdk = new Pan123SDK({
  clientID: 'your-client-id',
  clientSecret: 'your-client-secret',
  baseURL: 'https://custom-api.example.com', // 自定义 API 地址
});
```

## 环境变量配置

推荐使用环境变量存储敏感信息：

### 1. 创建 `.env` 文件

```bash
# .env
CLIENT_ID=your-client-id
CLIENT_SECRET=your-client-secret
DEBUG_TOKEN=your-debug-token  # 可选
```

### 2. 使用 dotenv 加载

```typescript
import 'dotenv/config';
import Pan123SDK from '123pan-api-sdk';

const sdk = new Pan123SDK({
  clientID: process.env.CLIENT_ID!,
  clientSecret: process.env.CLIENT_SECRET!,
  debugToken: process.env.DEBUG_TOKEN,
});
```

::: warning 安全提示
- 永远不要将 `.env` 文件提交到版本控制系统
- 在 `.gitignore` 中添加 `.env`
- 在生产环境使用环境变量或密钥管理服务
:::

## 限流配置

SDK 内置令牌桶算法来防止 API 限流：

```typescript
const sdk = new Pan123SDK({
  clientID: 'your-client-id',
  clientSecret: 'your-client-secret',
  rateLimit: {
    capacity: 10,     // 令牌桶容量：最多存储 10 个令牌
    refillRate: 2,    // 恢复速率：每秒恢复 2 个令牌
  },
});
```

### 限流工作原理

1. 每次 API 请求消耗 1 个令牌
2. 如果没有可用令牌，请求会等待
3. 令牌按配置的速率自动恢复

### 查看限流状态

```typescript
// 获取当前可用令牌数
const status = sdk.getRateLimiterStatus();
console.log('可用令牌:', status.availableTokens);

// 重置限流器
sdk.resetRateLimit();
```

## 重试配置

SDK 会自动重试失败的请求：

```typescript
const sdk = new Pan123SDK({
  clientID: 'your-client-id',
  clientSecret: 'your-client-secret',
  maxRetries: 5,      // 最多重试 5 次
  retryDelay: 2000,   // 每次重试等待 2 秒
});
```

### 重试条件

SDK 会在以下情况自动重试：
- 网络错误
- 超时错误
- 5xx 服务器错误
- 401 未授权（会先刷新 token）

::: tip 提示
不会重试的错误：
- 4xx 客户端错误（除了 401）
- 参数验证错误
:::

## 调试模式

开启调试模式查看详细日志：

```typescript
const sdk = new Pan123SDK({
  clientID: 'your-client-id',
  clientSecret: 'your-client-secret',
  debug: true,  // 开启调试模式
});

// 调试日志会输出到控制台
// [DEBUG] Request: POST /api/v1/user/info
// [DEBUG] Response: { code: 0, data: {...} }
```

### 使用调试 Token

在开发环境中，可以使用调试 token 避免频繁的 API 限流：

```typescript
const sdk = new Pan123SDK({
  clientID: 'your-client-id',
  clientSecret: 'your-client-secret',
  debugToken: 'your-jwt-token',  // 直接使用 JWT token
});
```

::: warning 注意
调试 token 仅用于开发环境，不要在生产环境使用。
:::

## 动态更新配置

在运行时更新部分配置：

```typescript
const sdk = new Pan123SDK({
  clientID: 'your-client-id',
  clientSecret: 'your-client-secret',
});

// 动态更新配置
sdk.updateConfig({
  timeout: 60000,
  debug: true,
});
```

## Token 管理

### 获取 Token 信息

```typescript
const tokenInfo = await sdk.getTokenInfo();
console.log('Access Token:', tokenInfo.accessToken);
console.log('过期时间:', tokenInfo.expiresAt);
```

### 手动刷新 Token

```typescript
await sdk.refreshToken();
console.log('Token 已刷新');
```

### 清除认证信息

```typescript
sdk.clearAuth();
console.log('认证信息已清除');
```

## 最佳实践

### 1. 使用环境变量

```typescript
// ✅ 推荐
const sdk = new Pan123SDK({
  clientID: process.env.CLIENT_ID!,
  clientSecret: process.env.CLIENT_SECRET!,
});

// ❌ 不推荐
const sdk = new Pan123SDK({
  clientID: 'hardcoded-client-id',
  clientSecret: 'hardcoded-secret',
});
```

### 2. 合理设置超时

```typescript
// 文件上传等耗时操作
const sdk = new Pan123SDK({
  clientID: process.env.CLIENT_ID!,
  clientSecret: process.env.CLIENT_SECRET!,
  timeout: 120000,  // 2 分钟
});
```

### 3. 生产环境关闭调试

```typescript
const sdk = new Pan123SDK({
  clientID: process.env.CLIENT_ID!,
  clientSecret: process.env.CLIENT_SECRET!,
  debug: process.env.NODE_ENV !== 'production',
});
```

### 4. 错误处理

```typescript
try {
  const result = await sdk.user.getUserInfo();
  if (result.code === 0) {
    // 处理成功响应
  } else {
    // 处理业务错误
    console.error('业务错误:', result.message);
  }
} catch (error) {
  // 处理网络错误、超时等
  console.error('系统错误:', error);
}
```

## 下一步

- [了解认证机制](/guide/authentication)
- [查看 API 文档](/api/)
- [浏览示例代码](/examples/)

