# 部署文档到 GitHub Pages

## 准备工作

### 1. 确保文档已创建

文档文件位于 `docs/` 目录：

```
docs/
├── .vitepress/
│   └── config.ts
├── guide/
├── api/
├── examples/
└── index.md
```

### 2. 初始化文档依赖

```bash
cd docs
npm install
```

### 3. 本地预览

```bash
npm run docs:dev
```

访问 http://localhost:5173 查看文档。

## 部署到 GitHub Pages

### 方式一：GitHub Actions 自动部署（推荐）

1. **在 GitHub 仓库中启用 Actions**

   - 进入仓库 Settings > Actions > General
   - 确保 "Actions permissions" 设置为 "Allow all actions and reusable workflows"

2. **配置 GitHub Pages**

   - 进入 Settings > Pages
   - Source 选择 "GitHub Actions"

3. **推送代码触发部署**

   ```bash
   git add .
   git commit -m "Add documentation"
   git push origin main
   ```

4. **查看部署状态**

   - 在 Actions 标签页查看部署进度
   - 部署成功后，访问 `https://yourusername.github.io/123pan-api-sdk/`

### 方式二：手动部署

1. **构建文档**

   ```bash
   cd docs
   npm run docs:build
   ```

2. **部署到 gh-pages 分支**

   ```bash
   cd .vitepress/dist
   
   # 初始化 git 仓库
   git init
   git add -A
   git commit -m 'deploy docs'
   
   # 推送到 gh-pages 分支
   git push -f git@github.com:yourusername/123pan-api-sdk.git main:gh-pages
   
   cd ../../../
   ```

3. **配置 GitHub Pages**

   - 进入 Settings > Pages
   - Source 选择 "Deploy from a branch"
   - Branch 选择 "gh-pages" 和 "/ (root)"
   - 点击 Save

4. **访问文档**

   等待几分钟后，访问 `https://yourusername.github.io/123pan-api-sdk/`

## 配置自定义域名

### 1. 购买域名

从域名注册商购买域名，例如 `docs.your-domain.com`

### 2. 配置 DNS

在域名注册商的 DNS 管理中添加记录：

```
类型: CNAME
名称: docs（或 @，如果使用根域名）
值: yourusername.github.io
```

### 3. 更新 CNAME 文件

编辑 `docs/public/CNAME` 文件：

```
docs.your-domain.com
```

### 4. 在 GitHub 配置自定义域名

- 进入 Settings > Pages
- Custom domain 输入你的域名
- 点击 Save
- 勾选 "Enforce HTTPS"

### 5. 更新 GitHub Actions 配置

编辑 `.github/workflows/deploy-docs.yml`：

```yaml
- name: Deploy to GitHub Pages
  uses: peaceiris/actions-gh-pages@v3
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    publish_dir: docs/.vitepress/dist
    cname: docs.your-domain.com  # 添加你的域名
```

### 6. 等待 DNS 生效

DNS 生效通常需要几分钟到 24 小时。

## 更新文档

### 自动部署（GitHub Actions）

只需推送代码到 main 分支：

```bash
git add docs/
git commit -m "Update documentation"
git push origin main
```

GitHub Actions 会自动构建并部署。

### 手动部署

1. 修改文档
2. 重新构建：`cd docs && npm run docs:build`
3. 按照"方式二"的步骤部署

## 常见问题

### 1. 文档页面显示 404

**解决方案：**
- 检查 GitHub Pages 设置中的分支是否正确
- 确认 `docs/.vitepress/dist` 目录已正确生成
- 查看 GitHub Actions 日志是否有错误

### 2. 样式或资源加载失败

**解决方案：**
检查 `docs/.vitepress/config.ts` 中的 `base` 配置：

```typescript
export default defineConfig({
  base: '/123pan-api-sdk/', // 仓库名称
  // ... 其他配置
})
```

如果使用自定义域名，`base` 应该设置为 `'/'`。

### 3. GitHub Actions 部署失败

**解决方案：**
- 检查 Actions 权限设置
- 查看 Actions 日志中的错误信息
- 确认 `docs/package.json` 和依赖正确安装

### 4. 自定义域名无法访问

**解决方案：**
- 检查 DNS 记录是否正确
- 等待 DNS 生效（最多 24 小时）
- 确认 `docs/public/CNAME` 文件内容正确
- 在 GitHub Pages 设置中重新保存自定义域名

## VitePress 配置

### 修改站点信息

编辑 `docs/.vitepress/config.ts`：

```typescript
export default defineConfig({
  title: '你的 SDK 名称',
  description: '你的 SDK 描述',
  // ...
})
```

### 修改导航栏

```typescript
themeConfig: {
  nav: [
    { text: '指南', link: '/guide/introduction' },
    { text: 'API', link: '/api/' },
    { text: 'GitHub', link: 'https://github.com/yourusername/your-repo' }
  ],
}
```

### 修改侧边栏

```typescript
themeConfig: {
  sidebar: {
    '/guide/': [
      {
        text: '开始',
        items: [
          { text: '介绍', link: '/guide/introduction' },
          { text: '快速开始', link: '/guide/quick-start' },
        ]
      }
    ]
  }
}
```

## 维护建议

1. **定期更新文档** - 随着 SDK 功能更新而更新文档
2. **添加示例代码** - 在 `/examples/` 目录添加实用示例
3. **收集用户反馈** - 通过 GitHub Issues 收集文档反馈
4. **检查链接** - 定期检查文档中的链接是否有效

## 参考资源

- [VitePress 官方文档](https://vitepress.dev)
- [GitHub Pages 文档](https://docs.github.com/pages)
- [GitHub Actions 文档](https://docs.github.com/actions)

