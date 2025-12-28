#!/bin/bash

# 修复空的package.json文件

MODULES=("direct-link" "image" "video")

for module in "${MODULES[@]}"; do
    echo "修复 @123pan/$module 的 package.json..."
    
    # 创建package.json内容
    cat > "packages/$module/package.json" << EOF
{
  "name": "@123pan/$module",
  "version": "1.0.0",
  "description": "123pan API SDK ${module^} Module",
  "type": "module",
  "main": "dist/index.js",
  "module": "dist/index.esm.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist"
  ],
  "exports": {
    ".": {
      "import": "./dist/index.esm.js",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "rollup -c",
    "dev": "rollup -c -w",
    "clean": "rimraf dist",
    "prebuild": "npm run clean",
    "type-check": "tsc --noEmit"
  },
  "keywords": [
    "123pan",
    "api",
    "sdk",
    "$module"
  ],
  "author": "Your Name <1582157042@qq.com>",
  "license": "MIT",
  "devDependencies": {
    "@rollup/plugin-commonjs": "^25.0.7",
    "@rollup/plugin-node-resolve": "^15.2.3",
    "@rollup/plugin-typescript": "^11.1.5",
    "@types/node": "^20.9.0",
    "rimraf": "^5.0.5",
    "rollup": "^4.5.0",
    "rollup-plugin-dts": "^6.1.0",
    "tslib": "^2.6.2",
    "typescript": "^5.2.2"
  },
  "dependencies": {
    "@123pan/core": "workspace:*"
  },
  "publishConfig": {
    "access": "public"
  }
}
EOF

    echo "✅ 已修复 @123pan/$module"
done

echo "🎉 所有空package.json文件已修复！"
