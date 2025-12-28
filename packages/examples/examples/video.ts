import sdk from '../core/index';
import { logger } from '@123pan/logger';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 测试0: 获取转码空间文件夹信息
 */
async function testGetFolderInfo() {
  console.log('\n📂 测试0: 获取转码空间文件夹信息');
  try {
    const result = await sdk.video.info.getFolderInfo();

    if (result.code === 0 && result.data) {
      console.log('✅ 获取转码空间文件夹信息成功！');
      console.log(`   转码空间文件夹ID: ${result.data.fileID}`);
      return result.data.fileID;
    } else {
      console.error('❌ 获取转码空间文件夹信息失败:', result.message);
      console.error('   错误代码:', result.code);
      return null;
    }
  } catch (err) {
    console.error('\n❌ 获取转码空间文件夹信息测试失败:', err);
    return null;
  }
}

/**
 * 测试1: 获取转码空间文件列表
 */
async function testGetTranscodeFileList() {
  console.log('\n📋 测试1: 获取转码空间文件列表');
  try {
    const result = await sdk.video.getFileList({
      parentFileId: 0,
      limit: 20,
    });

    if (result.code === 0 && result.data) {
      console.log('✅ 获取转码空间文件列表成功！');
      console.log(`   文件总数: ${result.data.fileList.length}`);
      console.log(`   下一页起始ID: ${result.data.lastFileId === -1 ? '最后一页' : result.data.lastFileId}`);

      if (result.data.fileList.length > 0) {
        console.log('\n   前5个文件:');
        result.data.fileList.slice(0, 5).forEach((file, index) => {
          console.log(`   ${index + 1}. ${file.filename} (ID: ${file.fileId})`);
          console.log(`      大小: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
          console.log(`      类型: ${file.type === 1 ? '文件夹' : '文件'}`);
        });
      } else {
        console.log('   ⚠️  转码空间为空');
      }

      return result.data;
    } else {
      console.error('❌ 获取转码空间文件列表失败:', result.message);
      console.error('   错误代码:', result.code);
      return null;
    }
  } catch (err) {
    console.error('\n❌ 获取转码空间文件列表测试失败:', err);
    return null;
  }
}

/**
 * 测试2: 搜索转码空间文件
 */
async function testSearchTranscodeFiles() {
  console.log('\n🔍 测试2: 搜索转码空间文件');
  try {
    const searchKeyword = 'test';
    console.log(`   搜索关键字: "${searchKeyword}"`);

    const result = await sdk.video.getFileList({
      parentFileId: 0,
      limit: 10,
      searchData: searchKeyword,
      searchMode: 0, // 0: 全文模糊搜索
    });

    if (result.code === 0 && result.data) {
      console.log('✅ 搜索转码空间文件成功！');
      console.log(`   找到 ${result.data.fileList.length} 个文件`);

      if (result.data.fileList.length > 0) {
        console.log('\n   搜索结果:');
        result.data.fileList.forEach((file, index) => {
          console.log(`   ${index + 1}. ${file.filename} (ID: ${file.fileId})`);
        });
      } else {
        console.log(`   ⚠️  未找到包含 "${searchKeyword}" 的文件`);
      }

      return result.data;
    } else {
      console.error('❌ 搜索转码空间文件失败:', result.message);
      console.error('   错误代码:', result.code);
      return null;
    }
  } catch (err) {
    console.error('\n❌ 搜索转码空间文件测试失败:', err);
    return null;
  }
}

/**
 * 测试3: 从云盘空间上传到转码空间（单个文件）
 */
async function testUploadFromCloudDisk() {
  console.log('\n⬆️  测试3: 从云盘空间上传到转码空间（单个文件）');
  try {
    // 假设云盘中有一个视频文件 ID
    const cloudFileId = 12345; // 需要替换为真实的云盘文件ID
    console.log(`   云盘文件ID: ${cloudFileId}`);

    const result = await sdk.video.upload.fromCloudDisk({
      fileIds: [cloudFileId],
    });

    if (result.code === 0) {
      console.log('✅ 从云盘空间上传到转码空间成功！');
      console.log('   返回数据:', JSON.stringify(result.data, null, 2));
      return result.data;
    } else {
      console.error('❌ 从云盘空间上传到转码空间失败:', result.message);
      console.error('   错误代码:', result.code);
      return null;
    }
  } catch (err) {
    console.error('\n❌ 从云盘空间上传到转码空间测试失败:', err);
    return null;
  }
}

/**
 * 测试4: 批量从云盘空间上传到转码空间
 */
async function testBatchUploadFromCloudDisk() {
  console.log('\n⬆️  测试4: 批量从云盘空间上传到转码空间');
  try {
    // 假设需要先上传文件到云盘
    console.log('   步骤1: 先上传几个测试视频到云盘...');
    
    const fileIds: number[] = [];
    
    // 创建3个测试文件并上传到云盘
    for (let i = 1; i <= 3; i++) {
      const testVideoContent = `Test video content ${i} - ${new Date().toISOString()}`;
      const testVideoBuffer = Buffer.from(testVideoContent);
      
      const uploadResult = await sdk.file.upload.uploadFile({
        file: testVideoBuffer,
        filename: `test-video-${i}.mp4`,
        parentFileId: 0,
      });

      if (uploadResult.code === 0 && uploadResult.data) {
        fileIds.push(uploadResult.data.fileId);
        console.log(`   ✅ 文件 ${i} 上传成功，ID: ${uploadResult.data.fileId}`);
      } else {
        console.error(`   ❌ 文件 ${i} 上传失败:`, uploadResult.message);
      }
    }

    if (fileIds.length === 0) {
      console.error('❌ 没有成功上传的文件');
      return null;
    }

    console.log(`   步骤2: 批量从云盘空间上传到转码空间 (${fileIds.length} 个文件)...`);
    
    const transcodeResult = await sdk.video.upload.fromCloudDisk({
      fileIds: fileIds,
    });

    if (transcodeResult.code === 0) {
      console.log('✅ 批量从云盘空间上传到转码空间成功！');
      console.log('   返回数据:', JSON.stringify(transcodeResult.data, null, 2));
      return { fileIds, transcodeResult: transcodeResult.data };
    } else {
      console.error('❌ 批量从云盘空间上传到转码空间失败:', transcodeResult.message);
      console.error('   错误代码:', transcodeResult.code);
      return null;
    }
  } catch (err) {
    console.error('\n❌ 批量从云盘空间上传到转码空间测试失败:', err);
    return null;
  }
}

/**
 * 测试5: 获取视频文件可转码的分辨率（单次查询）
 */
async function testGetVideoResolutions(fileId: number) {
  console.log('\n🎬 测试5: 获取视频文件可转码的分辨率（单次查询）');
  try {
    console.log(`   查询文件ID: ${fileId}`);
    
    const result = await sdk.video.info.getVideoResolutions({ fileId });

    if (result.code === 0 && result.data) {
      console.log('✅ 获取视频分辨率信息成功！');
      console.log(`   正在获取: ${result.data.IsGetResolution ? '是' : '否'}`);
      console.log(`   可转码分辨率: ${result.data.Resolutions || '(空)'}`);
      console.log(`   已转码分辨率: ${result.data.NowOrFinishedResolutions || '(空)'}`);
      console.log(`   编码方式: ${result.data.CodecNames || '(空)'}`);
      console.log(`   视频时长: ${result.data.VideoTime} 秒`);
      
      if (result.data.IsGetResolution) {
        console.log('\n   ⚠️  正在获取中，需要轮询查询或使用 getVideoResolutionsWithPolling 方法');
      }
      
      return result.data;
    } else {
      console.error('❌ 获取视频分辨率信息失败:', result.message);
      console.error('   错误代码:', result.code);
      return null;
    }
  } catch (err) {
    console.error('\n❌ 获取视频分辨率信息测试失败:', err);
    return null;
  }
}

/**
 * 测试6: 获取视频文件可转码的分辨率（自动轮询）
 */
async function testGetVideoResolutionsWithPolling(fileId: number) {
  console.log('\n🎬 测试6: 获取视频文件可转码的分辨率（自动轮询）');
  try {
    console.log(`   查询文件ID: ${fileId}`);
    console.log('   开始轮询查询...');

    const result = await sdk.video.info.getVideoResolutionsWithPolling({
      fileId,
      pollingInterval: 5000, // 5秒轮询一次（测试用，生产环境建议10秒）
      maxAttempts: 20, // 最多轮询20次
      onPolling: (attempt, isGetting) => {
        console.log(`   轮询第 ${attempt} 次: ${isGetting ? '正在获取中...' : '已获取完成'}`);
      },
    });

    if (result.code === 0 && result.data) {
      console.log('\n✅ 获取视频分辨率信息成功！');
      console.log(`   可转码分辨率: ${result.data.Resolutions}`);
      console.log(`   已转码分辨率: ${result.data.NowOrFinishedResolutions || '(从未转码过)'}`);
      console.log(`   编码方式: ${result.data.CodecNames}`);
      console.log(`   视频时长: ${result.data.VideoTime} 秒`);

      // 解析可转码分辨率
      const availableResolutions = result.data.Resolutions.split(',').filter(r => r);
      const finishedResolutions = result.data.NowOrFinishedResolutions
        ? result.data.NowOrFinishedResolutions.split(',').filter(r => r)
        : [];

      console.log('\n   📊 分辨率分析:');
      console.log(`   - 可转码: ${availableResolutions.join(', ')}`);
      if (finishedResolutions.length > 0) {
        console.log(`   - 已转码: ${finishedResolutions.join(', ')}`);

        // 找出未转码的分辨率
        const pendingResolutions = availableResolutions.filter(r => !finishedResolutions.includes(r));
        if (pendingResolutions.length > 0) {
          console.log(`   - 可新增转码: ${pendingResolutions.join(', ')}`);
        } else {
          console.log(`   - 所有分辨率均已转码`);
        }
      } else {
        console.log(`   - 该视频从未转码过，可转码任意分辨率`);
      }

      return result.data;
    } else {
      console.error('❌ 获取视频分辨率信息失败:', result.message);
      console.error('   错误代码:', result.code);
      return null;
    }
  } catch (err) {
    console.error('\n❌ 获取视频分辨率信息测试失败:', err);
    return null;
  }
}

/**
 * 测试7: 获取视频转码列表
 */
async function testGetTranscodeList(fileId: number) {
  console.log('\n📋 测试7: 获取视频转码列表');
  try {
    console.log(`   查询文件ID: ${fileId}`);
    
    const result = await sdk.video.info.getTranscodeList({ fileId });

    if (result.code === 0 && result.data) {
      console.log('✅ 获取视频转码列表成功！');
      console.log(`   转码状态: ${result.data.status} (1-待转码, 3-转码失败, 254-部分成功, 255-全部成功)`);
      console.log(`   转码列表数量: ${result.data.list.length}`);

      if (result.data.list.length > 0) {
        console.log('\n   📺 转码列表详情:');
        result.data.list.forEach((item, index) => {
          console.log(`\n   ${index + 1}. 分辨率: ${item.resolution} (${item.height}p)`);
          console.log(`      状态: ${item.status === 255 ? '✅ 成功' : '⏳ 处理中'}`);
          console.log(`      进度: ${item.progress}%`);
          console.log(`      时长: ${item.duration.toFixed(2)} 秒`);
          console.log(`      码率: ${(item.bitRate / 1000000).toFixed(2)} Mbps`);
          console.log(`      存储集群: ${item.mc}`);
          console.log(`      更新时间: ${item.updateAt}`);
          console.log(`      播放地址: ${item.url.substring(0, 80)}...`);
        });

        // 统计信息
        const successCount = result.data.list.filter(item => item.status === 255).length;
        const processingCount = result.data.list.length - successCount;
        console.log(`\n   📊 统计: 成功 ${successCount} 个, 处理中 ${processingCount} 个`);
      } else {
        console.log('   ⚠️  该视频暂无转码记录');
      }

      return result.data;
    } else {
      console.error('❌ 获取视频转码列表失败:', result.message);
      console.error('   错误代码:', result.code);
      return null;
    }
  } catch (err) {
    console.error('\n❌ 获取视频转码列表测试失败:', err);
    return null;
  }
}

/**
 * 测试8: 视频转码操作
 */
async function testTranscodeVideo(fileId: number, codecName: string, videoTime: number, resolutionsToTranscode: string[]) {
  console.log('\n⚙️  测试8: 视频转码操作');
  try {
    console.log(`   文件ID: ${fileId}`);
    console.log(`   编码方式: ${codecName}`);
    console.log(`   视频时长: ${videoTime} 秒`);
    console.log(`   要转码的分辨率: ${resolutionsToTranscode.join(', ')}`);

    const result = await sdk.video.transcodeVideo({
      fileId,
      codecName,
      videoTime,
      resolutions: resolutionsToTranscode,
    });

    if (result.code === 0 && result.data) {
      console.log('✅ 视频转码任务提交成功！');
      console.log('   返回消息:', result.data);
      return result.data;
    } else {
      console.error('❌ 视频转码任务提交失败:', result.message);
      console.error('   错误代码:', result.code);
      return null;
    }
  } catch (err: any) {
    console.error('\n❌ 视频转码操作测试失败:', err.message);
    return null;
  }
}

/**
 * 测试9: 查询视频转码记录
 */
async function testGetTranscodeRecord(fileId: number) {
  console.log('\n📝 测试9: 查询视频转码记录');
  try {
    console.log(`   查询文件ID: ${fileId}`);

    const result = await sdk.video.info.getTranscodeRecord({ fileId });

    if (result.code === 0 && result.data) {
      console.log('✅ 获取视频转码记录成功！');
      console.log(`   转码记录数量: ${result.data.UserTranscodeVideoRecordList.length}`);

      if (result.data.UserTranscodeVideoRecordList.length > 0) {
        console.log('\n   📋 转码记录详情:');
        result.data.UserTranscodeVideoRecordList.forEach((record, index) => {
          console.log(`\n   ${index + 1}. 分辨率: ${record.resolution}`);
          console.log(`      创建时间: ${record.create_at}`);
          console.log(`      状态: ${getTranscodeStatusText(record.status)}`);
          if (record.link) {
            console.log(`      播放链接: ${record.link.substring(0, 80)}...`);
          } else {
            console.log(`      播放链接: (转码中，暂无)`);
          }
        });

        // 统计信息
        const statusCount = {
          preparing: result.data.UserTranscodeVideoRecordList.filter(r => r.status === 1).length,
          transcoding: result.data.UserTranscodeVideoRecordList.filter(r => r.status === 2).length,
          failed: result.data.UserTranscodeVideoRecordList.filter(r => r.status >= 3 && r.status < 255).length,
          success: result.data.UserTranscodeVideoRecordList.filter(r => r.status === 255).length,
        };

        console.log('\n   📊 状态统计:');
        console.log(`      准备转码: ${statusCount.preparing} 个`);
        console.log(`      正在转码: ${statusCount.transcoding} 个`);
        console.log(`      转码失败: ${statusCount.failed} 个`);
        console.log(`      转码成功: ${statusCount.success} 个`);
      } else {
        console.log('   ⚠️  该视频暂无转码记录');
      }

      return result.data;
    } else {
      console.error('❌ 获取视频转码记录失败:', result.message);
      console.error('   错误代码:', result.code);
      return null;
    }
  } catch (err) {
    console.error('\n❌ 查询视频转码记录测试失败:', err);
    return null;
  }
}

/**
 * 测试10: 查询视频转码结果
 */
async function testGetTranscodeResult(fileId: number) {
  console.log('\n🎬 测试10: 查询视频转码结果');
  try {
    console.log(`   查询文件ID: ${fileId}`);

    const result = await sdk.video.info.getTranscodeResult({ fileId });

    if (result.code === 0 && result.data) {
      console.log('✅ 获取视频转码结果成功！');
      console.log(`   转码结果数量: ${result.data.UserTranscodeVideoList.length}`);

      if (result.data.UserTranscodeVideoList.length > 0) {
        console.log('\n   🎥 转码结果详情:');
        result.data.UserTranscodeVideoList.forEach((item, index) => {
          console.log(`\n   ${index + 1}. 分辨率: ${item.Resolution}`);
          console.log(`      用户ID: ${item.Uid}`);
          console.log(`      状态: ${getTranscodeStatusText(item.Status)}`);
          console.log(`      创建时间: ${item.CreateAt}`);
          console.log(`      更新时间: ${item.UpdateAt}`);
          console.log(`      转码文件数量: ${item.Files.length}`);

          if (item.Files.length > 0) {
            console.log(`      转码文件:`);
            item.Files.forEach((file) => {
              console.log(`        - ${file.FileName} (${file.FileSize})`);
              if (file.Url) {
                console.log(`          播放地址: ${file.Url.substring(0, 80)}...`);
              }
            });
          }
        });

        // 统计信息
        const totalFiles = result.data.UserTranscodeVideoList.reduce((sum, item) => sum + item.Files.length, 0);
        const m3u8Files = result.data.UserTranscodeVideoList.reduce((sum, item) => {
          return sum + item.Files.filter(f => f.FileName.endsWith('.m3u8')).length;
        }, 0);
        const tsFiles = result.data.UserTranscodeVideoList.reduce((sum, item) => {
          return sum + item.Files.filter(f => f.FileName.endsWith('.ts')).length;
        }, 0);

        console.log('\n   📊 文件统计:');
        console.log(`      总文件数: ${totalFiles}`);
        console.log(`      m3u8 文件: ${m3u8Files} 个`);
        console.log(`      ts 文件: ${tsFiles} 个`);
      } else {
        console.log('   ⚠️  该视频暂无转码结果');
      }

      return result.data;
    } else {
      console.error('❌ 获取视频转码结果失败:', result.message);
      console.error('   错误代码:', result.code);
      return null;
    }
  } catch (err) {
    console.error('\n❌ 查询视频转码结果测试失败:', err);
    return null;
  }
}

/**
 * 辅助函数：获取转码状态文本
 */
function getTranscodeStatusText(status: number): string {
  if (status === 1) return '⏳ 准备转码';
  if (status === 2) return '🔄 正在转码中';
  if (status === 255) return '✅ 转码成功';
  if (status >= 3 && status < 255) return '❌ 转码失败';
  return `未知状态 (${status})`;
}

/**
 * 测试11: 删除转码视频
 */
async function testDeleteTranscodeVideo(fileId: number, trashed: 1 | 2) {
  console.log('\n🗑️  测试11: 删除转码视频');
  try {
    console.log(`   文件ID: ${fileId}`);
    console.log(`   删除类型: ${trashed === 1 ? '仅删除原文件' : '删除原文件+转码后的文件'}`);

    const result = await sdk.video.deleteTranscodeVideo({
      fileId,
      trashed,
    });

    if (result.code === 0 && result.data) {
      console.log('✅ 删除转码视频成功！');
      console.log('   返回消息:', result.data);
      return result.data;
    } else {
      console.error('❌ 删除转码视频失败:', result.message);
      console.error('   错误代码:', result.code);
      return null;
    }
  } catch (err: any) {
    console.error('\n❌ 删除转码视频测试失败:', err.message);
    return null;
  }
}

/**
 * 测试12: 下载原文件
 */
async function testDownloadOriginalFile(fileId: number) {
  console.log('\n⬇️  测试12: 下载原文件');
  try {
    console.log(`   文件ID: ${fileId}`);

    const result = await sdk.video.downloadOriginalFile({ fileId });

    if (result.code === 0 && result.data) {
      console.log('✅ 获取原文件下载地址成功！');
      
      if (result.data.isFull) {
        console.log('   ⚠️  转码空间已满，无法下载');
        console.log('   提示：需要购买转码空间或清理文件后才能下载');
      } else if (result.data.downloadUrl) {
        console.log('   ✅ 下载地址已准备好');
        console.log(`   下载链接: ${result.data.downloadUrl.substring(0, 100)}...`);
        console.log('   💡 提示：将下载链接复制到浏览器中即可下载');
      } else {
        console.log('   ⚠️  下载地址为空');
      }

      return result.data;
    } else {
      console.error('❌ 获取原文件下载地址失败:', result.message);
      console.error('   错误代码:', result.code);
      return null;
    }
  } catch (err: any) {
    console.error('\n❌ 下载原文件测试失败:', err.message);
    return null;
  }
}

/**
 * 测试13: 下载单个转码文件（m3u8 或 ts）
 */
async function testDownloadTranscodeFile(fileId: number, resolution: string, type: 1 | 2, tsName?: string) {
  console.log('\n⬇️  测试13: 下载单个转码文件');
  try {
    console.log(`   文件ID: ${fileId}`);
    console.log(`   分辨率: ${resolution}`);
    console.log(`   文件类型: ${type === 1 ? 'm3u8' : 'ts'}`);
    if (type === 2 && tsName) {
      console.log(`   ts文件名: ${tsName}`);
    }

    const result = await sdk.video.downloadTranscodeFile({
      fileId,
      resolution,
      type,
      tsName,
    });

    if (result.code === 0 && result.data) {
      console.log('✅ 获取转码文件下载地址成功！');
      
      if (result.data.isFull) {
        console.log('   ⚠️  转码空间已满，无法下载');
        console.log('   提示：需要购买转码空间或清理文件后才能下载');
      } else if (result.data.downloadUrl) {
        console.log('   ✅ 下载地址已准备好');
        console.log(`   下载链接: ${result.data.downloadUrl.substring(0, 100)}...`);
        console.log('   💡 提示：将下载链接复制到浏览器中即可下载');
      } else {
        console.log('   ⚠️  下载地址为空');
      }

      return result.data;
    } else {
      console.error('❌ 获取转码文件下载地址失败:', result.message);
      console.error('   错误代码:', result.code);
      return null;
    }
  } catch (err: any) {
    console.error('\n❌ 下载转码文件测试失败:', err.message);
    return null;
  }
}

/**
 * 测试14: 下载全部转码文件（自动轮询）
 */
async function testDownloadAllTranscodeFiles(fileId: number, zipName: string) {
  console.log('\n📦 测试14: 下载全部转码文件（自动轮询）');
  try {
    console.log(`   文件ID: ${fileId}`);
    console.log(`   压缩包名称: ${zipName}`);
    console.log('   开始轮询查询...');

    const result = await sdk.video.downloadAllTranscodeFilesWithPolling({
      fileId,
      zipName,
      pollingInterval: 5000, // 5秒轮询一次（测试用，生产环境建议10秒）
      maxAttempts: 20, // 最多轮询20次
      onPolling: (attempt, isDownloading, isFull) => {
        if (isFull) {
          console.log(`   轮询第 ${attempt} 次: ⚠️  转码空间已满`);
        } else if (isDownloading) {
          console.log(`   轮询第 ${attempt} 次: 📦 正在准备下载文件...`);
        } else {
          console.log(`   轮询第 ${attempt} 次: ✅ 下载链接已准备好`);
        }
      },
    });

    if (result.code === 0 && result.data) {
      console.log('\n✅ 下载全部转码文件任务完成！');
      
      if (result.data.isFull) {
        console.log('   ⚠️  转码空间已满，无法下载');
        console.log('   提示：需要购买转码空间或清理文件后才能下载');
      } else if (result.data.downloadUrl) {
        console.log('   ✅ 下载地址已准备好');
        console.log(`   下载链接: ${result.data.downloadUrl.substring(0, 100)}...`);
        console.log('   💡 提示：将下载链接复制到浏览器中即可下载zip压缩包');
        console.log('   📦 压缩包包含该视频的所有分辨率转码文件');
      } else {
        console.log('   ⚠️  下载地址为空');
      }

      return result.data;
    } else {
      console.error('❌ 下载全部转码文件失败:', result.message);
      console.error('   错误代码:', result.code);
      return null;
    }
  } catch (err: any) {
    console.error('\n❌ 下载全部转码文件测试失败:', err.message);
    return null;
  }
}

/**
 * 主测试函数
 */
async function main() {
  console.log('🚀 开始测试视频转码API\n');

  // 测试0: 获取转码空间文件夹信息
  const folderID = await testGetFolderInfo();

  // 测试1: 获取转码空间文件列表
  const fileList = await testGetTranscodeFileList();

  // 测试2: 搜索转码空间文件
  if (fileList && fileList.fileList.length > 0) {
    await testSearchTranscodeFiles();
  }

  // 测试3: 从云盘空间上传到转码空间（单个文件）
  const uploadResult = await testUploadFromCloudDisk();

  // 测试4: 批量从云盘空间上传到转码空间
  // await testBatchUploadFromCloudDisk(); // 取消注释以测试批量上传

  // 测试5 & 6: 获取视频分辨率（需要先有视频文件）
  // 如果上传成功，尝试获取视频分辨率
  if (uploadResult && uploadResult.fileId) {
    console.log('\n⏰ 等待5秒后查询视频分辨率...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 先单次查询看看状态
    const resolutionInfo = await testGetVideoResolutions(uploadResult.fileId);

    let resolutionsToTranscode: string[] = [];
    let codecName: string = '';
    let videoTime: number = 0;

    if (resolutionInfo) {
      codecName = resolutionInfo.CodecNames;
      videoTime = resolutionInfo.VideoTime;

      if (resolutionInfo.IsGetResolution) {
        console.log('\n   视频分辨率仍在获取中，将使用轮询方式...');
        const pollingResult = await testGetVideoResolutionsWithPolling(uploadResult.fileId);
        if (pollingResult) {
          const available = pollingResult.Resolutions.split(',').filter(r => r);
          const finished = pollingResult.NowOrFinishedResolutions
            ? pollingResult.NowOrFinishedResolutions.split(',').filter(r => r)
            : [];
          resolutionsToTranscode = available.filter(r => !finished.includes(r));
        }
      } else {
        const available = resolutionInfo.Resolutions.split(',').filter(r => r);
        const finished = resolutionInfo.NowOrFinishedResolutions
          ? resolutionInfo.NowOrFinishedResolutions.split(',').filter(r => r)
          : [];
        resolutionsToTranscode = available.filter(r => !finished.includes(r));
      }
    }

    // 测试8: 视频转码操作
    if (resolutionsToTranscode.length > 0 && codecName && videoTime) {
      console.log('\n⏰ 等待3秒后提交视频转码任务...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      await testTranscodeVideo(uploadResult.fileId, codecName, videoTime, resolutionsToTranscode);
    } else {
      console.log('\n⚠️  没有可转码的分辨率或缺少视频信息，跳过视频转码操作测试。');
    }

    // 测试7: 获取视频转码列表
    console.log('\n⏰ 等待3秒后查询视频转码列表...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    await testGetTranscodeList(uploadResult.fileId);

    // 测试9: 查询视频转码记录
    console.log('\n⏰ 等待2秒后查询视频转码记录...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    await testGetTranscodeRecord(uploadResult.fileId);

    // 测试10: 查询视频转码结果
    console.log('\n⏰ 等待2秒后查询视频转码结果...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    const transcodeResult = await testGetTranscodeResult(uploadResult.fileId);

    // 测试12: 下载原文件
    console.log('\n⏰ 等待2秒后测试下载原文件...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    await testDownloadOriginalFile(uploadResult.fileId);

    // 测试13: 下载单个转码文件
    if (transcodeResult && transcodeResult.UserTranscodeVideoList.length > 0) {
      const firstTranscode = transcodeResult.UserTranscodeVideoList[0];
      
      // 下载 m3u8 文件
      console.log('\n⏰ 等待2秒后测试下载 m3u8 文件...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      await testDownloadTranscodeFile(uploadResult.fileId, firstTranscode.Resolution, 1);

      // 下载 ts 文件（如果有）
      const tsFile = firstTranscode.Files.find(f => f.FileName.endsWith('.ts'));
      if (tsFile) {
        const tsName = tsFile.FileName.replace('.ts', ''); // 移除 .ts 扩展名
        console.log('\n⏰ 等待2秒后测试下载 ts 文件...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        await testDownloadTranscodeFile(uploadResult.fileId, firstTranscode.Resolution, 2, tsName);
      }
    }

    // 测试14: 下载全部转码文件
    console.log('\n⏰ 等待2秒后测试下载全部转码文件...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    await testDownloadAllTranscodeFiles(uploadResult.fileId, 'all-transcode-files.zip');

    // 测试11: 删除转码视频（可选）
    // 注意：这会真正删除文件，请谨慎使用
    // console.log('\n⏰ 等待2秒后删除转码视频...');
    // await new Promise(resolve => setTimeout(resolve, 2000));
    // await testDeleteTranscodeVideo(uploadResult.fileId, 2); // 2: 删除原文件+转码后的文件
  }

  console.log('\n✅ 所有测试完成！');
}

// 运行测试
main().catch(console.error);
