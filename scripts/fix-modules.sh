#!/bin/bash

# 修复模块导入路径
MODULES=("share" "offline" "user" "direct-link" "image" "video")

for module in "${MODULES[@]}"; do
    echo "修复 @123pan/$module 模块..."
    
    # 更新导入路径
    if [ -f "packages/$module/src/index.ts" ]; then
        sed -i '' "s|from '../http/http-client'|from '@123pan/core'|g" "packages/$module/src/index.ts"
        sed -i '' "s|from '../types'|from '@123pan/core'|g" "packages/$module/src/index.ts"
        echo "✅ 已更新 @123pan/$module 的导入路径"
    fi
done

echo "🎉 所有模块修复完成！"
