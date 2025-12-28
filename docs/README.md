# 123Pan API SDK 文档

这是 123Pan API SDK 的官方文档网站。

## 本地开发

### 安装依赖

```bash
cd docs
npm install
# 或
yarn install
# 或
pnpm install
```

### 启动开发服务器

```bash
npm run docs:dev
```

访问 http://localhost:5173 查看文档。

### 构建文档

```bash
npm run docs:build
```

构建后的文件在 `docs/.vitepress/dist` 目录。

## 部署到 GitHub Pages

### 方式1: 使用 GitHub Actions（推荐）

在仓库的 `.github/workflows/deploy-docs.yml` 文件已配置自动部署。
每次推送到 `main` 分支时会自动构建并部署文档。

### 方式2: 手动部署

```bash
# 构建文档
npm run docs:build

# 进入构建目录
cd docs/.vitepress/dist

# 初始化 git 并提交
git init
git add -A
git commit -m 'deploy docs'

# 推送到 gh-pages 分支
git push -f git@github.com:yourusername/123pan-api-sdk.git main:gh-pages

cd -
```

## 配置自定义域名

1. 在 GitHub 仓库的 Settings > Pages 中设置自定义域名
2. 在 `docs/public/CNAME` 文件中添加你的域名
3. 等待 DNS 生效

## 目录结构

```
docs/
├── .vitepress/
│   └── config.ts      # VitePress 配置
├── guide/             # 指南
│   ├── introduction.md
│   ├── quick-start.md
│   └── configuration.md
├── api/               # API 文档
│   ├── index.md
│   ├── sdk.md
│   ├── file.md
│   └── ...
├── examples/          # 示例代码
│   └── ...
└── index.md           # 首页
```

## 文档编写

- 使用 Markdown 格式
- 代码块支持语法高亮
- 支持 Vue 组件和自定义容器

详见 [VitePress 文档](https://vitepress.dev)

