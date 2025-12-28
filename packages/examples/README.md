# 123pan SDK Examples

这个包包含了 123pan API SDK 的使用示例和测试代码。

## 目录结构

```
packages/examples/
├── index.ts              # 综合测试示例
├── examples/
│   ├── user-test.ts      # 用户模块测试
│   ├── file-test.ts      # 文件模块测试
│   └── ...               # 其他模块测试
├── package.json
└── README.md
```

## 运行示例

### 安装依赖

```bash
# 在项目根目录运行
yarn install
```

### 运行所有测试

```bash
# 在项目根目录运行
yarn workspace @123pan/examples test

# 或者进入examples目录运行
cd packages/examples
yarn test
```

### 运行单个模块测试

```bash
# 测试用户模块
yarn workspace @123pan/examples test:user

# 测试文件模块
yarn workspace @123pan/examples test:file
```

### 直接运行

```bash
# 在examples目录下
npx tsx index.ts                    # 运行综合测试
npx tsx examples/user-test.ts       # 运行用户模块测试
npx tsx examples/file-test.ts       # 运行文件模块测试
```

## 配置说明

所有示例都使用了以下配置：

```typescript
const config = {
    clientID: '你的客户端ID',
    clientSecret: '你的客户端密钥',
    debug: true,                     // 启用调试模式
    debugToken: '你的调试Token'       // 使用调试Token避免频繁请求
};
```

### 获取调试Token

1. 登录 [123pan开放平台](https://open.123pan.com)
2. 创建应用获取 `clientID` 和 `clientSecret`
3. 使用API获取访问令牌作为 `debugToken`

### 使用真实API

如果要测试真实的API调用，请：

1. 移除 `debugToken` 配置
2. 确保 `clientID` 和 `clientSecret` 正确
3. 注意API调用频率限制

## 示例说明

### index.ts - 综合测试
- 测试用户信息获取
- 测试文件列表获取
- 测试Token信息获取
- 展示完整的错误处理

### examples/user-test.ts - 用户模块
- 获取用户基本信息
- 显示存储空间使用情况
- 展示VIP信息
- 格式化输出用户数据

### examples/file-test.ts - 文件模块
- 获取根目录文件列表
- 遍历文件夹内容
- 文件搜索功能
- 文件大小格式化

## TypeScript 支持

所有示例都使用 TypeScript 编写，提供：

- ✅ 完整的类型检查
- ✅ 智能代码补全
- ✅ 编译时错误检测
- ✅ 更好的开发体验

## 注意事项

1. **调试模式**: 示例默认启用调试模式，会输出详细的日志信息
2. **Token过期**: debugToken 有过期时间，过期后需要重新获取
3. **API限制**: 真实API调用有频率限制，请合理使用
4. **错误处理**: 示例展示了完整的错误处理模式，建议在实际项目中参考

## 添加新示例

要添加新的模块测试：

1. 在 `examples/` 目录下创建新的 `.ts` 文件
2. 在 `package.json` 中添加对应的脚本
3. 参考现有示例的结构和错误处理方式
