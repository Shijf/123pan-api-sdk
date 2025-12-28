# 用户模块

用户模块提供用户信息查询功能。

## 方法

### getUserInfo()

获取当前授权用户的信息。

**示例**

```typescript
const result = await sdk.user.getUserInfo();

if (result.code === 0) {
  console.log('用户信息:', result.data);
}
```

**返回值**

```typescript
interface ApiResponse<UserInfo> {
  code: number;
  message: string;
  data: {
    userId: number;           // 用户ID
    userName: string;         // 用户名
    email?: string;          // 邮箱
    phone?: string;          // 手机号
    avatar?: string;         // 头像URL
    totalSpace: number;      // 总空间（字节）
    usedSpace: number;       // 已使用空间（字节）
    vipLevel: number;        // VIP等级
    vipExpireTime?: string;  // VIP过期时间
    createTime: string;      // 账号创建时间
    // ... 其他用户信息字段
  };
}
```

**响应字段说明**

| 字段 | 类型 | 说明 |
|------|------|------|
| `userId` | `number` | 用户唯一标识 |
| `userName` | `string` | 用户昵称 |
| `email` | `string` | 用户邮箱 |
| `phone` | `string` | 手机号码 |
| `avatar` | `string` | 用户头像URL |
| `totalSpace` | `number` | 总存储空间（字节） |
| `usedSpace` | `number` | 已使用空间（字节） |
| `vipLevel` | `number` | VIP等级（0=普通用户） |
| `vipExpireTime` | `string` | VIP过期时间 |
| `createTime` | `string` | 账号创建时间 |

## 完整示例

```typescript
import Pan123SDK from '123pan-api-sdk';

async function getUserProfile() {
  const sdk = new Pan123SDK({
    clientID: process.env.CLIENT_ID!,
    clientSecret: process.env.CLIENT_SECRET!,
  });

  try {
    const result = await sdk.user.getUserInfo();

    if (result.code === 0) {
      const user = result.data;
      
      console.log('用户信息:');
      console.log('- ID:', user.userId);
      console.log('- 用户名:', user.userName);
      console.log('- 邮箱:', user.email);
      console.log('- VIP等级:', user.vipLevel);
      
      // 计算存储使用率
      const usagePercent = ((user.usedSpace / user.totalSpace) * 100).toFixed(2);
      console.log(`- 存储使用: ${usagePercent}%`);
      console.log(`  (${formatBytes(user.usedSpace)} / ${formatBytes(user.totalSpace)})`);
    } else {
      console.error('获取用户信息失败:', result.message);
    }
  } catch (error) {
    console.error('请求失败:', error);
  }
}

// 格式化字节数
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

getUserProfile();
```

## 注意事项

1. **认证要求**: 需要有效的 access token
2. **权限**: 只能查询当前授权用户的信息
3. **缓存建议**: 用户信息变化不频繁，可以适当缓存减少 API 调用

