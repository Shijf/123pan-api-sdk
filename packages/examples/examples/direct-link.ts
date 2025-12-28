import sdk from '../core/index';

/**
 * 测试1: 获取IP黑名单列表
 */
async function testGetIpBlacklist() {
  console.log('\n📋 测试1: 获取IP黑名单列表');
  try {
    const result = await sdk.directLink.ip.getBlacklist();

    if (result.code === 0 && result.data) {
      console.log('✅ 获取IP黑名单列表成功！');
      console.log(`   状态: ${result.data.status === 1 ? '✅ 已启用' : '⚠️  已禁用'}`);
      console.log(`   IP数量: ${result.data.ipList.length}`);

      if (result.data.ipList.length > 0) {
        console.log('\n   IP黑名单列表:');
        result.data.ipList.forEach((ip, index) => {
          console.log(`   ${index + 1}. ${ip}`);
        });
      } else {
        console.log('   ⚠️  当前黑名单为空');
      }

      return result.data;
    } else {
      console.error('❌ 获取IP黑名单列表失败:', result.message);
      console.error('   错误代码:', result.code);
      return null;
    }
  } catch (err) {
    console.error('\n❌ 获取IP黑名单列表测试失败:', err);
    return null;
  }
}

/**
 * 测试2: 开启或关闭IP黑名单
 */
async function testToggleIpBlacklist(status: 1 | 2) {
  console.log(`\n🔄 测试2: ${status === 1 ? '启用' : '禁用'}IP黑名单`);
  try {
    const result = await sdk.directLink.ip.toggleBlacklist({
      Status: status,
    });

    if (result.code === 0 && result.data) {
      console.log(`✅ ${status === 1 ? '启用' : '禁用'}IP黑名单成功！`);
      console.log(`   操作完成: ${result.data.Done ? '是' : '否'}`);
      return result.data;
    } else {
      console.error(`❌ ${status === 1 ? '启用' : '禁用'}IP黑名单失败:`, result.message);
      console.error('   错误代码:', result.code);
      return null;
    }
  } catch (err) {
    console.error(`\n❌ ${status === 1 ? '启用' : '禁用'}IP黑名单测试失败:`, err);
    return null;
  }
}

/**
 * 测试3: 更新IP黑名单列表
 */
async function testUpdateIpBlacklist(ipList: string[]) {
  console.log('\n📝 测试3: 更新IP黑名单列表');
  try {
    console.log(`   要添加的IP数量: ${ipList.length}`);
    console.log('   IP列表:');
    ipList.forEach((ip, index) => {
      console.log(`   ${index + 1}. ${ip}`);
    });

    const result = await sdk.directLink.ip.updateBlacklist({
      IpList: ipList,
    });

    if (result.code === 0) {
      console.log('✅ 更新IP黑名单列表成功！');
      return true;
    } else {
      console.error('❌ 更新IP黑名单列表失败:', result.message);
      console.error('   错误代码:', result.code);
      return false;
    }
  } catch (err: any) {
    console.error('\n❌ 更新IP黑名单列表测试失败:', err.message);
    return false;
  }
}

/**
 * 测试4: 获取直链离线日志
 */
async function testGetOfflineLogs() {
  console.log('\n📜 测试4: 获取直链离线日志');
  try {
    // 获取当前时间
    const now = new Date();
    
    // 计算开始时间（24小时前）
    const startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // 格式化时间为 YYYYMMDDHH 格式
    const formatHour = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hour = String(date.getHours()).padStart(2, '0');
      return `${year}${month}${day}${hour}`;
    };

    const startHour = formatHour(startTime);
    const endHour = formatHour(now);

    console.log(`   查询时间范围: ${startHour} ~ ${endHour}`);

    const result = await sdk.directLink.logger.getOfflineLogs({
      startHour,
      endHour,
      pageNum: 1,
      pageSize: 10,
    });

    if (result.code === 0 && result.data) {
      console.log('✅ 获取离线日志成功！');
      console.log(`   总数: ${result.data.total}`);
      console.log(`   当前页数量: ${result.data.list.length}`);

      if (result.data.list.length > 0) {
        console.log('\n   日志列表:');
        result.data.list.forEach((log, index) => {
          console.log(`\n   ${index + 1}. 日志文件:`);
          console.log(`      ID: ${log.id}`);
          console.log(`      文件名: ${log.fileName}`);
          console.log(`      大小: ${(log.fileSize / 1024).toFixed(2)} KB`);
          console.log(`      时间范围: ${log.logTimeRange}`);
          console.log(`      下载地址: ${log.downloadURL.substring(0, 80)}...`);
        });
      } else {
        console.log('   ⚠️  该时间段内暂无日志数据');
      }

      return result.data;
    } else {
      console.error('❌ 获取离线日志失败:', result.message);
      console.error('   错误代码:', result.code);
      return null;
    }
  } catch (err: any) {
    console.error('\n❌ 获取离线日志测试失败:', err.message);
    return null;
  }
}

/**
 * 测试5: 获取直链流量日志
 */
async function testGetTrafficLogs() {
  console.log('\n📊 测试5: 获取直链流量日志');
  try {
    // 获取当前时间
    const now = new Date();
    
    // 计算开始时间（24小时前）
    const startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // 格式化时间为 YYYY-MM-DD HH:MM:SS 格式
    const formatDateTime = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hour = String(date.getHours()).padStart(2, '0');
      const minute = String(date.getMinutes()).padStart(2, '0');
      const second = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
    };

    const startTimeStr = formatDateTime(startTime);
    const endTimeStr = formatDateTime(now);

    console.log(`   查询时间范围: ${startTimeStr} ~ ${endTimeStr}`);

    const result = await sdk.directLink.logger.getTrafficLogs({
      pageNum: 1,
      pageSize: 10,
      startTime: startTimeStr,
      endTime: endTimeStr,
    });

    if (result.code === 0 && result.data) {
      console.log('✅ 获取流量日志成功！');
      console.log(`   总数: ${result.data.total}`);
      console.log(`   当前页数量: ${result.data.list.length}`);

      if (result.data.list.length > 0) {
        console.log('\n   流量日志列表:');
        result.data.list.forEach((log, index) => {
          console.log(`\n   ${index + 1}. 文件信息:`);
          console.log(`      ID: ${log.uniqueID}`);
          console.log(`      文件名: ${log.fileName}`);
          console.log(`      大小: ${(log.fileSize / 1024 / 1024).toFixed(2)} MB`);
          console.log(`      路径: ${log.filePath}`);
          console.log(`      来源: ${log.fileSource === 1 ? '全部文件' : '图床'}`);
          console.log(`      消耗流量: ${(log.totalTraffic / 1024 / 1024).toFixed(2)} MB`);
          console.log(`      直链URL: ${log.directLinkURL.substring(0, 60)}...`);
        });

        // 计算总流量
        const totalTraffic = result.data.list.reduce((sum, log) => sum + log.totalTraffic, 0);
        console.log(`\n   📈 当前页总流量: ${(totalTraffic / 1024 / 1024).toFixed(2)} MB`);
      } else {
        console.log('   ⚠️  该时间段内暂无流量日志');
      }

      return result.data;
    } else {
      console.error('❌ 获取流量日志失败:', result.message);
      console.error('   错误代码:', result.code);
      return null;
    }
  } catch (err: any) {
    console.error('\n❌ 获取流量日志测试失败:', err.message);
    return null;
  }
}

/**
 * 测试6: 启用直链空间
 */
async function testEnableDirectLink(fileID: number) {
  console.log('\n🔓 测试6: 启用直链空间');
  try {
    console.log(`   文件夹ID: ${fileID}`);

    const result = await sdk.directLink.space.enable({
      fileID,
    });

    if (result.code === 0 && result.data) {
      console.log('✅ 启用直链空间成功！');
      console.log(`   文件夹名称: ${result.data.filename}`);
      return result.data;
    } else {
      console.error('❌ 启用直链空间失败:', result.message);
      console.error('   错误代码:', result.code);
      return null;
    }
  } catch (err: any) {
    console.error('\n❌ 启用直链空间测试失败:', err.message);
    return null;
  }
}

/**
 * 测试7: 禁用直链空间
 */
async function testDisableDirectLink(fileID: number) {
  console.log('\n🔒 测试7: 禁用直链空间');
  try {
    console.log(`   文件夹ID: ${fileID}`);

    const result = await sdk.directLink.space.disable({
      fileID,
    });

    if (result.code === 0 && result.data) {
      console.log('✅ 禁用直链空间成功！');
      console.log(`   文件夹名称: ${result.data.filename}`);
      return result.data;
    } else {
      console.error('❌ 禁用直链空间失败:', result.message);
      console.error('   错误代码:', result.code);
      return null;
    }
  } catch (err: any) {
    console.error('\n❌ 禁用直链空间测试失败:', err.message);
    return null;
  }
}

/**
 * 测试8: 获取直链链接
 */
async function testGetDirectLinkUrl(fileID: number) {
  console.log('\n🔗 测试8: 获取直链链接');
  try {
    console.log(`   文件ID: ${fileID}`);

    const result = await sdk.directLink.space.getUrl({
      fileID,
    });

    if (result.code === 0 && result.data) {
      console.log('✅ 获取直链链接成功！');
      console.log(`   直链URL: ${result.data.url}`);
      return result.data;
    } else {
      console.error('❌ 获取直链链接失败:', result.message);
      console.error('   错误代码:', result.code);
      return null;
    }
  } catch (err: any) {
    console.error('\n❌ 获取直链链接测试失败:', err.message);
    return null;
  }
}

/**
 * 测试9: 刷新直链缓存
 */
async function testRefreshCache() {
  console.log('\n🔄 测试9: 刷新直链缓存');
  try {
    const result = await sdk.directLink.space.refreshCache();

    if (result.code === 0) {
      console.log('✅ 刷新直链缓存成功！');
      console.log('   缓存已更新，配置变更将立即生效');
      return true;
    } else {
      console.error('❌ 刷新直链缓存失败:', result.message);
      console.error('   错误代码:', result.code);
      return false;
    }
  } catch (err: any) {
    console.error('\n❌ 刷新直链缓存测试失败:', err.message);
    return false;
  }
}

/**
 * 主测试函数
 */
async function main() {
  console.log('🚀 开始测试直链管理API\n');
  console.log('⚠️  注意：这些API需要开通开发者权益\n');

  console.log('=' .repeat(60));
  console.log('第一部分: IP黑名单管理');
  console.log('=' .repeat(60));

  // 测试1: 获取当前配置
  const currentConfig = await testGetIpBlacklist();

  // 测试2: 启用IP黑名单
  console.log('\n⏰ 等待2秒后启用IP黑名单...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  await testToggleIpBlacklist(1);

  // 测试3: 更新IP黑名单列表
  console.log('\n⏰ 等待2秒后更新IP黑名单列表...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 添加一些测试IP（使用私有IP地址，不会影响实际使用）
  const testIps = [
    '192.168.1.100',
    '192.168.1.101',
    '10.0.0.100',
  ];
  
  await testUpdateIpBlacklist(testIps);

  // 测试4: 再次获取配置，验证更新
  console.log('\n⏰ 等待2秒后再次获取配置...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  const updatedConfig = await testGetIpBlacklist();

  // 测试5: 禁用IP黑名单（可选）
  // console.log('\n⏰ 等待2秒后禁用IP黑名单...');
  // await new Promise(resolve => setTimeout(resolve, 2000));
  // await testToggleIpBlacklist(2);

  // 测试6: 清空IP黑名单（可选）
  // console.log('\n⏰ 等待2秒后清空IP黑名单...');
  // await new Promise(resolve => setTimeout(resolve, 2000));
  // await testUpdateIpBlacklist([]);

  // 显示测试总结
  if (currentConfig && updatedConfig) {
    console.log('\n📊 IP黑名单测试总结:');
    console.log(`   初始状态: ${currentConfig.status === 1 ? '启用' : '禁用'}`);
    console.log(`   初始IP数量: ${currentConfig.ipList.length}`);
    console.log(`   更新后状态: ${updatedConfig.status === 1 ? '启用' : '禁用'}`);
    console.log(`   更新后IP数量: ${updatedConfig.ipList.length}`);
  }

  // 第二部分：日志管理
  console.log('\n' + '='.repeat(60));
  console.log('第二部分: 日志管理');
  console.log('='.repeat(60));

  // 测试7: 获取离线日志
  await testGetOfflineLogs();

  // 测试8: 获取流量日志
  console.log('\n⏰ 等待2秒后测试获取流量日志...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  await testGetTrafficLogs();

  // 第三部分：空间管理
  console.log('\n' + '='.repeat(60));
  console.log('第三部分: 空间管理');
  console.log('='.repeat(60));

  // 测试10: 启用直链空间
  // 注意：需要提供一个有效的文件夹ID
  // 如果没有合适的测试文件夹ID，可以注释掉这个测试
  // await testEnableDirectLink(4404009);
  console.log('\n⚠️  测试10已跳过：启用直链空间需要提供有效的文件夹ID');
  console.log('   如需测试，请取消注释并提供文件夹ID');

  // 测试11: 禁用直链空间
  // 注意：需要提供一个有效的已启用直链的文件夹ID
  // await testDisableDirectLink(4404009);
  console.log('\n⚠️  测试11已跳过：禁用直链空间需要提供有效的文件夹ID');
  console.log('   如需测试，请取消注释并提供文件夹ID');

  // 测试12: 获取直链链接
  // 注意：需要提供一个有效的文件ID（必须在已启用直链的文件夹下）
  // await testGetDirectLinkUrl(10861131);
  console.log('\n⚠️  测试12已跳过：获取直链链接需要提供有效的文件ID');
  console.log('   如需测试，请取消注释并提供文件ID（必须在已启用直链的文件夹下）');

  // 测试13: 刷新直链缓存
  console.log('\n⏰ 等待2秒后测试刷新直链缓存...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  await testRefreshCache();

  console.log('\n✅ 所有测试完成！');
}

// 运行测试
main().catch(console.error);

