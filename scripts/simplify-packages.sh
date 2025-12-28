#!/bin/bash

# 简化模块包配置的脚本

MODULES=("file" "share" "offline" "user" "direct-link" "image" "video")

for module in "${MODULES[@]}"; do
    echo "简化 @123pan/$module 包配置..."
    
    # 创建简化的 package.json
    cat > "packages/$module/package.json" << EOF
{
  "name": "@123pan/$module",
  "version": "1.0.0",
  "description": "123pan API SDK ${module^} Module",
  "type": "module",
  "main": "../../dist/$module.js",
  "module": "../../dist/$module.esm.js",
  "types": "../../dist/$module.d.ts",
  "keywords": [
    "123pan",
    "api",
    "sdk",
    "$module"
  ],
  "author": "Your Name <1582157042@qq.com>",
  "license": "MIT",
  "publishConfig": {
    "access": "public"
  }
}
EOF

    # 删除不需要的构建配置文件
    rm -f "packages/$module/tsconfig.json"
    rm -f "packages/$module/rollup.config.js"
    
    echo "✅ 已简化 @123pan/$module"
done

# 简化SDK包
echo "简化主SDK包配置..."
cat > "packages/sdk/package.json" << EOF
{
  "name": "123pan-api-sdk-main",
  "version": "1.0.0",
  "description": "123pan API SDK - Complete SDK with all modules",
  "type": "module",
  "main": "../../dist/index.js",
  "module": "../../dist/index.esm.js",
  "types": "../../dist/index.d.ts",
  "keywords": [
    "123pan",
    "api",
    "sdk",
    "typescript",
    "cloud-storage"
  ],
  "author": "Your Name <1582157042@qq.com>",
  "license": "MIT",
  "publishConfig": {
    "access": "public"
  }
}
EOF

rm -f "packages/sdk/tsconfig.json"
rm -f "packages/sdk/rollup.config.js"

echo "✅ 已简化主SDK包"

# 删除不需要的构建配置文件
rm -f "packages/core/tsconfig.json"
rm -f "packages/core/rollup.config.js"

echo "🎉 所有包配置已简化！现在使用统一构建。"
