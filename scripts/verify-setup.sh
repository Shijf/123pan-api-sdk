#!/bin/bash

# 验证项目设置是否正确

echo "🔍 验证 123pan SDK 项目设置..."
echo ""

# 检查包管理器
echo "📦 检查包管理器:"
if command -v yarn &> /dev/null; then
    echo "✅ Yarn 已安装: $(yarn --version)"
else
    echo "❌ Yarn 未安装"
fi

if command -v npm &> /dev/null; then
    echo "✅ npm 已安装: $(npm --version)"
else
    echo "❌ npm 未安装"
fi

echo ""

# 检查依赖
echo "📚 检查依赖安装:"
if [ -d "node_modules" ]; then
    echo "✅ node_modules 目录存在"
else
    echo "❌ node_modules 目录不存在，请运行 yarn install"
    exit 1
fi

# 检查关键依赖
DEPS=("rollup" "typescript" "axios")
for dep in "${DEPS[@]}"; do
    if [ -d "node_modules/$dep" ]; then
        echo "✅ $dep 已安装"
    else
        echo "❌ $dep 未安装"
    fi
done

echo ""

# 检查构建
echo "🔨 测试构建:"
if yarn build > /dev/null 2>&1; then
    echo "✅ 构建成功"
else
    echo "❌ 构建失败"
    exit 1
fi

# 检查构建输出
echo "📁 检查构建输出:"
BUILD_FILES=("dist/index.js" "dist/index.esm.js" "dist/bundle.js" "dist/modules/core.js")
for file in "${BUILD_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file 存在"
    else
        echo "❌ $file 不存在"
    fi
done

echo ""

# 检查Git配置
echo "🔧 检查Git配置:"
if [ -f ".gitignore" ]; then
    echo "✅ .gitignore 存在"
else
    echo "❌ .gitignore 不存在"
fi

if [ -f ".gitattributes" ]; then
    echo "✅ .gitattributes 存在"
else
    echo "❌ .gitattributes 不存在"
fi

# 检查忽略文件
if git check-ignore node_modules dist > /dev/null 2>&1; then
    echo "✅ 关键目录被正确忽略"
else
    echo "❌ Git忽略配置有问题"
fi

echo ""

# 检查包结构
echo "📦 检查包结构:"
PACKAGES=("core" "file" "user" "share" "offline" "direct-link" "image" "video" "sdk")
for pkg in "${PACKAGES[@]}"; do
    if [ -d "packages/$pkg" ]; then
        echo "✅ packages/$pkg 存在"
    else
        echo "❌ packages/$pkg 不存在"
    fi
done

echo ""

# 检查脚本
echo "📜 检查可用脚本:"
SCRIPTS=("build" "dev" "clean" "test-server" "demo")
for script in "${SCRIPTS[@]}"; do
    if yarn run --silent $script --help > /dev/null 2>&1 || grep -q "\"$script\":" package.json; then
        echo "✅ $script 脚本可用"
    else
        echo "❌ $script 脚本不可用"
    fi
done

echo ""
echo "🎉 项目设置验证完成！"

# 显示项目信息
echo ""
echo "📊 项目信息:"
echo "- 项目名称: $(grep '"name"' package.json | head -1 | cut -d'"' -f4)"
echo "- 版本: $(grep '"version"' package.json | head -1 | cut -d'"' -f4)"
echo "- 包管理器: Yarn $(yarn --version 2>/dev/null || echo "未安装")"
echo "- Node.js: $(node --version)"

# 显示构建文件大小
if [ -d "dist" ]; then
    echo ""
    echo "📏 构建文件大小:"
    ls -lh dist/*.js 2>/dev/null | awk '{print "- " $9 ": " $5}' || echo "- 无构建文件"
fi

echo ""
echo "🚀 开始开发:"
echo "  yarn dev      # 开发模式"
echo "  yarn build    # 构建项目"
echo "  yarn test-server  # 启动测试服务器"
echo "  yarn demo     # 启动演示页面"
