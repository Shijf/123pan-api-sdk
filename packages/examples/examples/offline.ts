/**
 * 离线下载功能测试
 */

import sdk from "../core/index";

/**
 * 测试1: 创建单个离线下载任务
 */
async function testCreateOfflineTask() {
  console.log('\n📥 测试1: 创建单个离线下载任务');
  try {
    // 使用一个公开的测试文件URL
    const testUrl = 'http://vjs.zencdn.net/v/oceans.mp4'; // 替换为实际的测试URL
    
    console.log(`📥 创建离线下载任务...`);
    console.log(`   URL: ${testUrl}`);
    
    const result = await sdk.offline.createTask({
      url: testUrl,
      parentId: 0, // 根目录
    });
    
    if (result.code === 0 && result.data) {
      console.log('✅ 创建离线下载任务成功！');
      const task = result.data;
      console.log(`   任务ID: ${(task as any).id || (task as any).taskID || 'N/A'}`);
      console.log(`   URL: ${(task as any).url || testUrl}`);
      console.log(`   状态: ${(task as any).status || 'N/A'}`);
      return task;
    } else {
      console.error('❌ 创建离线下载任务失败:', result.message);
      console.error('   错误代码:', result.code);
      return null;
    }
  } catch (err) {
    console.error('\n❌ 创建离线下载任务测试失败:', err);
    return null;
  }
}

/**
 * 测试2: 批量创建离线下载任务
 */
async function testBatchCreateOfflineTasks() {
  console.log('\n📥 测试2: 批量创建离线下载任务');
  try {
    // 使用多个测试URL（实际使用时替换为真实的下载链接）
    const testUrls = [
      'https://media.w3.org/2010/05/sintel/trailer.mp4',
      'http://vjs.zencdn.net/v/oceans.mp4',
      'http://mirror.aarnet.edu.au/pub/TED-talks/911Mothers_2010W-480p.mp4',
      // 可以添加更多URL进行测试
    ];
    
    console.log(`📥 批量创建离线下载任务...`);
    console.log(`   URL数量: ${testUrls.length}`);
    
    const result = await sdk.offline.batchCreateTasks({
      urls: testUrls,
      parentId: 0, // 根目录
    });
    
    if (result.code === 0 && result.data) {
      console.log('✅ 批量创建离线下载任务成功！');
      console.log(`   总共创建了 ${result.data.length} 个任务`);
      result.data.forEach((task, index) => {
        console.log(`   任务 ${index + 1}:`);
        console.log(`     ID: ${(task as any).id || (task as any).taskID || 'N/A'}`);
        console.log(`     URL: ${testUrls[index] || 'N/A'}`);
        console.log(`     状态: ${(task as any).status || 'N/A'}`);
      });
      return result.data;
    } else {
      console.error('❌ 批量创建离线下载任务失败:', result.message);
      console.error('   错误代码:', result.code);
      return null;
    }
  } catch (err) {
    console.error('\n❌ 批量创建离线下载任务测试失败:', err);
    return null;
  }
}

/**
 * 测试3: 获取离线下载进度
 */
async function testGetDownloadProcess(taskID: number | string) {
  console.log('\n📊 测试3: 获取离线下载进度');
  try {
    if (!taskID) {
      console.log('⚠️  没有任务ID，跳过获取进度测试');
      return null;
    }
    
    console.log(`📊 获取任务 ${taskID} 的下载进度...`);
    
    const result = await sdk.offline.getDownloadProcess({
      taskID: taskID,
    });
    
    if (result.code === 0 && result.data) {
      console.log('✅ 获取下载进度成功！');
      console.log(`   任务ID: ${taskID}`);
      console.log(`   下载进度: ${result.data.process}%`);
      
      // 解析状态
      const statusMap: Record<number, string> = {
        0: '进行中',
        1: '下载失败',
        2: '下载成功',
        3: '重试中',
      };
      const statusText = statusMap[result.data.status] || `未知(${result.data.status})`;
      console.log(`   下载状态: ${statusText} (${result.data.status})`);
      
      // 根据状态给出提示
      if (result.data.status === 0) {
        console.log('   💡 提示: 任务正在下载中，可以稍后再次查询进度');
      } else if (result.data.status === 2) {
        console.log('   ✅ 任务已完成！');
      } else if (result.data.status === 1) {
        console.log('   ❌ 任务下载失败，进度已归零');
      } else if (result.data.status === 3) {
        console.log('   🔄 任务正在重试中');
      }
      
      return result.data;
    } else {
      console.error('❌ 获取下载进度失败:', result.message);
      console.error('   错误代码:', result.code);
      return null;
    }
  } catch (err) {
    console.error('\n❌ 获取下载进度测试失败:', err);
    return null;
  }
}

/**
 * 测试4: 轮询下载进度（模拟实际使用场景）
 */
async function testPollDownloadProcess(taskID: number | string) {
  console.log('\n🔄 测试4: 轮询下载进度（模拟实际使用场景）');
  try {
    if (!taskID) {
      console.log('⚠️  没有任务ID，跳过轮询测试');
      return null;
    }
    
    console.log(`🔄 开始轮询任务 ${taskID} 的下载进度...`);
    console.log('   (每3秒查询一次，最多查询10次)');
    
    let pollAttempts = 0;
    const maxPollAttempts = 10;
    const pollInterval = 3000; // 3秒
    
    while (pollAttempts < maxPollAttempts) {
      pollAttempts++;
      console.log(`\n   第 ${pollAttempts} 次查询...`);
      
      const result = await sdk.offline.getDownloadProcess({
        taskID: taskID,
      });
      
      if (result.code === 0 && result.data) {
        console.log(`   进度: ${result.data.process}%`);
        
        const statusMap: Record<number, string> = {
          0: '进行中',
          1: '下载失败',
          2: '下载成功',
          3: '重试中',
        };
        const statusText = statusMap[result.data.status] || `未知(${result.data.status})`;
        console.log(`   状态: ${statusText}`);
        
        // 如果任务完成或失败，停止轮询
        if (result.data.status === 2) {
          console.log('\n✅ 任务已完成，停止轮询');
          return result.data;
        } else if (result.data.status === 1) {
          console.log('\n❌ 任务下载失败，停止轮询');
          return result.data;
        }
        
        // 如果还没完成，等待后继续
        if (pollAttempts < maxPollAttempts) {
          console.log(`   ⏳ 等待 ${pollInterval / 1000} 秒后继续查询...`);
          await new Promise((resolve) => setTimeout(resolve, pollInterval));
        }
      } else {
        console.error('   ❌ 查询失败:', result.message);
        break;
      }
    }
    
    if (pollAttempts >= maxPollAttempts) {
      console.log('\n⚠️  达到最大轮询次数，停止轮询');
    }
    
    return null;
  } catch (err) {
    console.error('\n❌ 轮询下载进度测试失败:', err);
    return null;
  }
}

/**
 * 测试5: 创建大量离线下载任务（测试分批处理）
 */
async function testBatchCreateLarge() {
  console.log('\n📥 测试5: 创建大量离线下载任务（测试分批处理）');
  try {
    // 创建60个URL（超过50的批次大小，测试分批处理）
    const testUrls: string[] = [];
    for (let i = 1; i <= 60; i++) {
      testUrls.push(`https://www.123pan.com/s/test-file${i}.zip`);
    }
    
    console.log(`📥 批量创建离线下载任务...`);
    console.log(`   URL数量: ${testUrls.length} (将自动分批处理)`);
    
    const result = await sdk.offline.batchCreateTasks({
      urls: testUrls,
      parentId: 0, // 根目录
    });
    
    if (result.code === 0 && result.data) {
      console.log('✅ 批量创建离线下载任务成功！');
      console.log(`   总共创建了 ${result.data.length} 个任务`);
      console.log(`   (如果URL数量超过50，会自动分成多批处理)`);
      
      // 只显示前5个任务的详情
      const displayCount = Math.min(5, result.data.length);
      console.log(`\n   前 ${displayCount} 个任务详情:`);
      for (let i = 0; i < displayCount; i++) {
        const task = result.data[i];
        console.log(`   任务 ${i + 1}:`);
        console.log(`     ID: ${(task as any).id || (task as any).taskID || 'N/A'}`);
        console.log(`     URL: ${testUrls[i]}`);
      }
      
      if (result.data.length > displayCount) {
        console.log(`   ... 还有 ${result.data.length - displayCount} 个任务`);
      }
      
      return result.data;
    } else {
      console.error('❌ 批量创建离线下载任务失败:', result.message);
      console.error('   错误代码:', result.code);
      return null;
    }
  } catch (err) {
    console.error('\n❌ 批量创建离线下载任务测试失败:', err);
    return null;
  }
}

/**
 * 主测试函数
 */
async function main() {
  console.log('🚀 开始测试离线下载API\n');
  
  // 测试1: 创建单个离线下载任务
  const task = await testCreateOfflineTask();
  
  // 测试2: 批量创建离线下载任务
  await testBatchCreateOfflineTasks();
  
  // 测试3: 获取离线下载进度（如果有任务ID）
  // if (task) {
  //   const taskID = (task as any).id || (task as any).taskID;
  //   if (taskID) {
  //     await testGetDownloadProcess(taskID);
      
  //     // 测试4: 轮询下载进度（可选，会等待较长时间）
  //     await testPollDownloadProcess(taskID);
  //   }
  // }
  
  // 测试5: 创建大量离线下载任务（测试分批处理）
  // await testBatchCreateLarge();
  
  console.log('\n✅ 所有测试完成！');
  
  // 退出
  process.exit(0);
}

// 运行测试
main().catch(console.error);

