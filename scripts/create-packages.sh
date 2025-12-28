#!/bin/bash

# 批量创建模块包的脚本

PACKAGES_DIR="packages"
MODULES=("share" "offline" "user" "direct-link" "image" "video")

# 创建模块包
for module in "${MODULES[@]}"; do
    echo "创建 @123pan/$module 包..."
    
    # 创建目录
    mkdir -p "$PACKAGES_DIR/$module/src"
    
    # 创建 package.json
    cat > "$PACKAGES_DIR/$module/package.json" << EOF
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

    # 复制源文件
    if [ -f "src/modules/$module.ts" ]; then
        cp "src/modules/$module.ts" "$PACKAGES_DIR/$module/src/index.ts"
        
        # 更新导入路径
        sed -i '' "s|from '../http/http-client'|from '@123pan/core'|g" "$PACKAGES_DIR/$module/src/index.ts"
        sed -i '' "s|from '../types'|from '@123pan/core'|g" "$PACKAGES_DIR/$module/src/index.ts"
    fi
    
    # 复制配置文件
    cp tsconfig.json "$PACKAGES_DIR/$module/"
    cp rollup.config.js "$PACKAGES_DIR/$module/"
    
    echo "✅ @123pan/$module 包创建完成"
done

echo "🎉 所有模块包创建完成！"
