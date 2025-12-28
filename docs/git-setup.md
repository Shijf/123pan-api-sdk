# Git 配置说明

本项目已配置了完整的 Git 忽略和属性设置，确保开发环境的一致性。

## 文件说明

### `.gitignore`

忽略以下类型的文件和目录：

- **依赖目录**: `node_modules/`, `jspm_packages/` 等
- **构建输出**: `dist/`, `build/`, `lib/` 等
- **缓存文件**: `.eslintcache`, `.tsbuildinfo`, `.rollup.cache/` 等
- **日志文件**: `*.log`, `npm-debug.log*` 等
- **环境配置**: `.env*` 文件
- **IDE配置**: `.vscode/`, `.idea/` 等
- **操作系统文件**: `.DS_Store`, `Thumbs.db` 等
- **临时文件**: `*.tmp`, `*.temp`, `tmp/`, `temp/` 等

### `.gitattributes`

配置文件属性：

- **行尾符规范化**: 所有文本文件使用 LF 行尾符
- **文件类型识别**: 自动检测文本文件
- **导出排除**: 排除开发相关文件不被包含在发布包中

## 包管理器选择

项目中同时存在 `package-lock.json` 和 `yarn.lock`，建议选择一个：

### 使用 npm
```bash
# 删除 yarn.lock 并在 .gitignore 中忽略它
rm yarn.lock
echo "yarn.lock" >> .gitignore
```

### 使用 yarn
```bash
# 删除 package-lock.json 并在 .gitignore 中忽略它
rm package-lock.json
echo "package-lock.json" >> .gitignore
```

## 开发建议

1. **提交前检查**: 使用 `git status` 确认没有意外文件被跟踪
2. **构建清理**: 定期运行 `npm run clean` 清理构建文件
3. **依赖更新**: 更新依赖后检查 lock 文件变化
4. **环境配置**: 敏感信息放在 `.env.local` 文件中（已被忽略）

## 常用命令

```bash
# 检查被忽略的文件
git check-ignore <file-or-directory>

# 查看所有被忽略的文件
git status --ignored

# 强制添加被忽略的文件（不推荐）
git add -f <file>

# 清理未跟踪的文件（谨慎使用）
git clean -fd
```

## 项目特定忽略

以下文件类型被特别忽略：

- `test-*.mjs` - 临时测试文件
- `credentials.json` - API凭证文件
- `api-keys.json` - API密钥文件
- `benchmark/` - 性能测试结果
- `examples/output/` - 示例输出文件
- `demo/uploads/` - 演示上传文件
