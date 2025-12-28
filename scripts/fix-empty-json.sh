#!/bin/bash

# 修复空的package.json文件

MODULES=("share" "offline" "user" "direct-link" "image" "video")

for module in "${MODULES[@]}"; do
    echo "修复 @123pan/$module 的 package.json..."
    
    cat > "packages/$module/package.json" << 'EOF'
{
  "name": "@123pan/MODULE_NAME",
  "version": "1.0.0",
  "description": "123pan API SDK MODULE_NAME Module",
  "type": "module",
  "main": "../../dist/MODULE_NAME.js",
  "module": "../../dist/MODULE_NAME.esm.js",
  "types": "../../dist/MODULE_NAME.d.ts",
  "keywords": [
    "123pan",
    "api",
    "sdk",
    "MODULE_NAME"
  ],
  "author": "Your Name <1582157042@qq.com>",
  "license": "MIT",
  "publishConfig": {
    "access": "public"
  }
}
EOF

    # 替换占位符
    sed -i '' "s/MODULE_NAME/$module/g" "packages/$module/package.json"
    
    echo "✅ 已修复 @123pan/$module"
done

echo "🎉 所有空package.json文件已修复！"
