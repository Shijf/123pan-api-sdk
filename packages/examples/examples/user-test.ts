import sdk from "../core/index";
async function runTests() {
    try {
        console.log('🚀 开始运行SDK TypeScript测试...');

        // 1. 测试获取用户信息
        console.log('\n--- 测试获取用户信息 ---');
        const userInfoResponse = await sdk.user.getUserInfo();
        if (userInfoResponse.code === 0) {
            const userInfo = userInfoResponse.data;
            console.log('✅ 获取用户信息成功！');
            console.log(`   用户ID: ${userInfo.uid}`);
            console.log(`   昵称: ${userInfo.nickname}`);
            console.log(`   邮箱: ${userInfo.mail}`);
            console.log(`   VIP状态: ${userInfo.vip}`);
            console.log(`   永久空间: ${userInfo.spacePermanent}`);
            console.log(`   已用空间: ${userInfo.spaceUsed}`);
            console.log(`   头像: ${userInfo.headImage}`);
            
            // 类型安全的访问
            const freeSpace = userInfo.spacePermanent - userInfo.spaceUsed;
            console.log(`   剩余空间: ${freeSpace} bytes`);
            console.log(`   剩余空间: ${Math.round(freeSpace / 1024 / 1024 / 1024)} GB`);
        } else {
            console.error('❌ 获取用户信息失败:', userInfoResponse.message);
        }

        // 2. 测试获取文件列表

    } catch (error: any) {
        console.error('❌ 测试过程中发生错误:', error.message, error.details);
    }
}

// runTests();