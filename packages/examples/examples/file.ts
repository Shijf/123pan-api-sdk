import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { calculateMD5, calculateSliceMD5 } from '@123pan/core';
import sdk from "../core/index";

// 获取当前文件目录（ES模块兼容）
const currentDir = path.dirname(fileURLToPath(import.meta.url));

// 测试文件路径
const DEMO_DIR = path.join(currentDir, '../demo-files');
const SMALL_FILE = path.join(DEMO_DIR, 'small-file.txt');
const LARGE_FILE = path.join(DEMO_DIR, 'large-file2.bin');

// 确保demo文件存在
if (!fs.existsSync(SMALL_FILE)) {
  fs.writeFileSync(SMALL_FILE, '这是一个小文件测试内容\nHello, 123 Pan SDK!');
  console.log('✅ 创建了小文件:', SMALL_FILE);
}

if (!fs.existsSync(LARGE_FILE)) {
  // 创建一个2MB的文件用于测试分片上传
  const buffer = Buffer.alloc(200 * 1024 * 1024, 'A');
  fs.writeFileSync(LARGE_FILE, buffer);
  console.log('✅ 创建了大文件:', LARGE_FILE);
}

/**
 * 测试1: 创建目录
 */
async function testCreateFolder() {
  console.log('\n📁 测试1: 创建目录');
  try {
    const res = await sdk.file.upload.createFolder({
      name: `test-${Date.now()}`,
      parentID: 0
    });
    console.log('✅ 创建目录成功:', res);
    return res.data?.dirID;
  } catch (err) {
    console.error('❌ 创建目录失败:', err);
    return null;
  }
}

/**
 * 测试2: 获取上传域名
 */
async function testGetUploadDomain() {
  console.log('\n🌐 测试2: 获取上传域名');
  try {
    const res = await sdk.file.upload.getUploadDomain();
    console.log('✅ 获取上传域名成功:', res);
    return res.data?.[0];
  } catch (err) {
    console.error('❌ 获取上传域名失败:', err);
    return null;
  }
}

/**
 * 测试3: 创建文件（用于分片上传）
 */
async function testCreateFile(parentFileID: number) {
  console.log('\n📄 测试3: 创建文件');
  try {
    const fileBuffer = fs.readFileSync(SMALL_FILE);
    const md5 = await calculateMD5(fileBuffer);
    
    const res = await sdk.file.upload.createFile({
      parentFileID,
      filename: `test-${Date.now()}.txt`,
      etag: md5,
      size: fileBuffer.length,
    });
    console.log('✅ 创建文件成功:', res);
    return res.data;
  } catch (err) {
    console.error('❌ 创建文件失败:', err);
    return null;
  }
}

/**
 * 测试4: 单步上传（小文件）
 */
async function testSingleUpload(parentFileID: number, uploadServer: string) {
  console.log('\n🚀 测试4: 单步上传（小文件）');
  try {
    const fileBuffer = fs.readFileSync(SMALL_FILE);
    const md5 = await calculateMD5(fileBuffer);
    
    let uploadedBytes = 0;
    const res = await sdk.file.upload.singleUpload({
      uploadServer,
      parentFileID,
      filename: `single-upload-${Date.now()}.txt`,
      etag: md5,
      size: fileBuffer.length,
      file: fileBuffer,
      onProgress: (progress) => {
        if (progress.total) {
          const percent = Math.round((progress.loaded / progress.total) * 100);
          if (percent !== uploadedBytes) {
            uploadedBytes = percent;
            process.stdout.write(`\r📊 上传进度: ${percent}%`);
          }
        }
      },
    });
    console.log('\n✅ 单步上传成功:', res);
    return res.data?.fileID;
  } catch (err) {
    console.error('\n❌ 单步上传失败:', err);
    return null;
  }
}

/**
 * 测试5: 分片上传（大文件）
 */
async function testSliceUpload(parentFileID: number, uploadServer: string) {
  console.log('\n📦 测试5: 分片上传（大文件）');
  try {
    const fileBuffer = fs.readFileSync(LARGE_FILE);
    const md5 = await calculateMD5(fileBuffer);
    
    // 1. 创建文件
    const createRes = await sdk.file.upload.createFile({
      parentFileID,
      filename: `slice-upload-${Date.now()}.bin`,
      etag: md5,
      size: fileBuffer.length,
    });
    
    if (createRes.code !== 0) {
      throw new Error(`创建文件失败: ${createRes.message}`);
    }
    
    const { reuse, preuploadID, fileID, sliceSize } = createRes.data;
    
    // 2. 如果是秒传，直接返回
    if (reuse && fileID) {
      console.log('✅ 秒传成功，文件已存在:', fileID);
      return fileID;
    }
    
    if (!preuploadID || !sliceSize) {
      throw new Error('缺少预上传ID或分片大小');
    }
    
    // 3. 分片上传
    const slices = [];
    for (let i = 0; i < fileBuffer.length; i += sliceSize) {
      slices.push(fileBuffer.subarray(i, i + sliceSize));
    }
    
    console.log(`📊 总共 ${slices.length} 个分片，每个分片 ${sliceSize} 字节`);
    
    for (let i = 0; i < slices.length; i++) {
      const slice = slices[i];
      const sliceMd5 = await calculateSliceMD5(slice);
      
      await sdk.file.upload.uploadSlice({
        uploadServer,
        preuploadID,
        sliceNo: i + 1,
        sliceMD5: sliceMd5,
        slice: slice,
        onProgress: (progress) => {
          if (progress.total) {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            process.stdout.write(`\r📊 分片 ${i + 1}/${slices.length} 上传进度: ${percent}%`);
          }
        },
      });
    }
    
    console.log('\n✅ 所有分片上传完成');
    
    // 4. 上传完成
    const completeRes = await sdk.file.upload.uploadComplete({
      preuploadID,
    });
    
    if (completeRes.code !== 0) {
      throw new Error(`上传完成失败: ${completeRes.message}`);
    }
    
    let finalFileID = completeRes.data?.fileID;
    
    // 5. 如果未完成，轮询结果
    if (!completeRes.data?.completed || !finalFileID) {
      console.log('⏳ 等待服务器处理，开始轮询...');
      let attempts = 0;
      const maxAttempts = 30;
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const pollRes = await sdk.file.upload.uploadComplete({ preuploadID });
        
        if (pollRes.code === 0 && pollRes.data?.completed && pollRes.data?.fileID) {
          finalFileID = pollRes.data.fileID;
          break;
        }
        attempts++;
        process.stdout.write(`\r⏳ 轮询中... (${attempts}/${maxAttempts})`);
      }
      console.log('');
    }
    
    if (finalFileID) {
      console.log('✅ 分片上传成功，文件ID:', finalFileID);
      return finalFileID;
    } else {
      throw new Error('上传超时或失败');
    }
  } catch (err) {
    console.error('\n❌ 分片上传失败:', err);
    return null;
  }
}

/**
 * 测试6: 一键上传（自动选择单步或分片）
 */
async function testUploadFile(parentFileID: number) {
  console.log('\n🎯 测试6: 一键上传（自动选择单步或分片）');
  try {
    // 测试小文件（单步上传）
    console.log('📤 测试小文件单步上传...');
    const smallFileBuffer = fs.readFileSync(SMALL_FILE);
    const smallMd5 = await calculateMD5(smallFileBuffer);
    
    let progressPercent = 0;
    const smallResult = await sdk.file.upload.uploadFile({
      filename: `auto-upload-small-${Date.now()}.txt`,
      file: smallFileBuffer,
      etag: smallMd5,
      parentFileID,
      onProgress: (progress) => {
        const percent = Math.round(progress.percent || 0);
        if (percent !== progressPercent) {
          progressPercent = percent;
          process.stdout.write(`\r📊 小文件上传进度: ${percent}%`);
        }
      },
    });
    console.log('\n✅ 小文件一键上传成功:', smallResult);
    
    // 测试大文件（分片上传）
    console.log('\n📤 测试大文件分片上传...');
    const largeFileBuffer = fs.readFileSync(LARGE_FILE);
    const largeMd5 = await calculateMD5(largeFileBuffer);
    
    progressPercent = 0;
    const largeResult = await sdk.file.upload.uploadFile({
      filename: `auto-upload-large-${Date.now()}.bin`,
      file: largeFileBuffer,
      etag: largeMd5,
      parentFileID,
      onProgress: (progress) => {
        const percent = Math.round(progress.percent || 0);
        if (percent !== progressPercent) {
          progressPercent = percent;
          const currentSlice = progress.currentSlice ? ` (分片 ${progress.currentSlice}/${progress.totalSlices})` : '';
          process.stdout.write(`\r📊 大文件上传进度: ${percent}%${currentSlice}`);
        }
      },
    });
    console.log('\n✅ 大文件一键上传成功:', largeResult);
    
    return { small: smallResult, large: largeResult };
  } catch (err) {
    console.error('\n❌ 一键上传失败:', err);
    return null;
  }
}

/**
 * 测试7: 异步模式上传（分片上传）
 */
async function testAsyncUpload(parentFileID: number) {
  console.log('\n⚡ 测试7: 异步模式上传（分片上传）');
  try {
    // 测试大文件异步上传
    console.log('📤 测试大文件异步上传...');
    const largeFileBuffer = fs.readFileSync(LARGE_FILE);
    const largeMd5 = await calculateMD5(largeFileBuffer);
    
    let progressPercent = 0;
    const asyncResult = await sdk.file.upload.uploadFile({
      filename: `async-upload-${Date.now()}.bin`,
      file: largeFileBuffer,
      etag: largeMd5,
      parentFileID,
      asyncMode: true, // 启用异步模式
      onProgress: (progress) => {
        const percent = Math.round(progress.percent || 0);
        if (percent !== progressPercent) {
          progressPercent = percent;
          const currentSlice = progress.currentSlice ? ` (分片 ${progress.currentSlice}/${progress.totalSlices})` : '';
          process.stdout.write(`\r📊 异步上传进度: ${percent}%${currentSlice}`);
        }
      },
    });
    
    console.log('\n✅ 异步上传完成，返回结果:', asyncResult);
    
    // 返回异步上传结果
    return asyncResult;
    
    // 如果是异步模式且有 preuploadID，开始查询结果
    // if (asyncResult.isAsync && asyncResult.preuploadID) {
    //   console.log('\n⏳ 开始异步查询上传结果...');
    //   console.log('📋 预上传ID:', asyncResult.preuploadID);
      
    //   let attempts = 0;
    //   const maxAttempts = 60; // 最多查询60次（1分钟）
    //   let queryPercent = 0;
      
    //   while (attempts < maxAttempts) {
    //     await new Promise((resolve) => setTimeout(resolve, 1000)); // 每秒查询一次
        
    //     const queryResult = await sdk.file.upload.queryUploadResult({
    //       preuploadID: asyncResult.preuploadID,
    //     });
        
    //     if (queryResult.code !== 0) {
    //       console.error(`\n❌ 查询上传结果失败: ${queryResult.message}`);
    //       // 查询失败，返回当前状态
    //       return {
    //         fileID: 0,
    //         isAsync: true,
    //         preuploadID: asyncResult.preuploadID,
    //       };
    //     }
        
    //     const { completed, fileID } = queryResult.data;
        
    //     // 显示查询进度
    //     const percent = Math.min(95 + (attempts / maxAttempts) * 5, 99);
    //     if (percent !== queryPercent) {
    //       queryPercent = percent;
    //       process.stdout.write(`\r⏳ 查询中... ${attempts + 1}/${maxAttempts} (${Math.round(percent)}%)`);
    //     }
        
    //     if (completed && fileID && fileID !== 0) {
    //       console.log('\n✅ 异步上传完成！文件ID:', fileID);
    //       return {
    //         fileID,
    //         isAsync: true,
    //         preuploadID: asyncResult.preuploadID,
    //       };
    //     }
        
    //     attempts++;
    //   }
      
    //   // 查询超时
    //   console.log('\n⚠️  查询超时，但上传可能仍在处理中');
    //   return {
    //     fileID: 0,
    //     isAsync: true,
    //     preuploadID: asyncResult.preuploadID,
    //   };
    // } else if (asyncResult.fileID && asyncResult.fileID !== 0) {
    //   // 如果已经返回了 fileID（可能是秒传或单步上传已完成）
    //   console.log('\n✅ 上传已完成，文件ID:', asyncResult.fileID);
    //   return asyncResult;
    // } else {
    //   console.log('\n⚠️  异步上传已提交，但无法查询结果（可能缺少 preuploadID）');
    //   return asyncResult;
    // }
  } catch (err) {
    console.error('\n❌ 异步上传失败:', err);
    return null;
  }
}

/**
 * 测试8: 批量重命名文件
 */
async function testBatchRename(parentFileID: number) {
  console.log('\n📝 测试8: 批量重命名文件');
  try {
    // 先上传几个文件用于测试重命名
    console.log('📤 先上传几个文件用于测试重命名...');
    const smallFileBuffer = fs.readFileSync(SMALL_FILE);
    const smallMd5 = await calculateMD5(smallFileBuffer);
    
    const uploadedFiles: number[] = [];
    
    // 上传3个文件
    for (let i = 1; i <= 3; i++) {
      const uploadResult = await sdk.file.upload.uploadFile({
        filename: `rename-test-${i}-${Date.now()}.txt`,
        file: smallFileBuffer,
        etag: smallMd5,
        parentFileID,
      });
      
      if (uploadResult.fileID) {
        uploadedFiles.push(uploadResult.fileID);
        console.log(`✅ 上传文件 ${i}，文件ID: ${uploadResult.fileID}`);
      }
    }
    
    if (uploadedFiles.length === 0) {
      console.log('⚠️  没有成功上传文件，跳过批量重命名测试');
      return null;
    }
    
    // 测试批量重命名（少量文件，<=20）
    console.log('\n📝 测试批量重命名（少量文件）...');
    const renameList = uploadedFiles.map((fileID, index) => ({
      fileID,
      newName: `重命名后的文件-${index + 1}-${Date.now()}.txt`,
    }));
    
    const renameResult = await sdk.file.batchRename({
      renameList,
    });
    
    if (renameResult.code === 0 && renameResult.data) {
      console.log('✅ 批量重命名成功！');
      console.log(`   成功: ${renameResult.data.successList.length} 个文件`);
      console.log(`   失败: ${renameResult.data.failList.length} 个文件`);
      
      if (renameResult.data.successList.length > 0) {
        console.log('   成功列表:');
        renameResult.data.successList.forEach((item) => {
          console.log(`     - 文件ID: ${item.fileID}, 更新时间: ${item.updateAt}`);
        });
      }
      
      if (renameResult.data.failList.length > 0) {
        console.log('   失败列表:');
        renameResult.data.failList.forEach((item) => {
          console.log(`     - 文件ID: ${item.fileID}, 错误: ${item.message}`);
        });
      }
      
      return renameResult.data;
    } else {
      console.error('❌ 批量重命名失败:', renameResult.message);
      return null;
    }
  } catch (err) {
    console.error('\n❌ 批量重命名测试失败:', err);
    return null;
  }
}

/**
 * 测试9: 批量重命名（大量文件，测试分批处理）
 */
async function testBatchRenameLarge(parentFileID: number) {
  console.log('\n📝 测试9: 批量重命名（大量文件，测试分批处理）');
  try {
    // 先上传多个文件用于测试分批处理
    console.log('📤 先上传25个文件用于测试分批处理（每批20个）...');
    const smallFileBuffer = fs.readFileSync(SMALL_FILE);
    const smallMd5 = await calculateMD5(smallFileBuffer);
    
    const uploadedFiles: number[] = [];
    const totalFiles = 25; // 上传25个文件，会分成2批（20 + 5）
    
    for (let i = 1; i <= totalFiles; i++) {
      const uploadResult = await sdk.file.upload.uploadFile({
        filename: `batch-rename-test-${i}-${Date.now()}.txt`,
        file: smallFileBuffer,
        etag: smallMd5,
        parentFileID,
      });
      
      if (uploadResult.fileID) {
        uploadedFiles.push(uploadResult.fileID);
        if (i % 5 === 0 || i === totalFiles) {
          process.stdout.write(`\r📤 已上传 ${i}/${totalFiles} 个文件`);
        }
      }
    }
    console.log('');
    
    if (uploadedFiles.length < 20) {
      console.log(`⚠️  只成功上传了 ${uploadedFiles.length} 个文件，不足以测试分批处理`);
      return null;
    }
    
    // 测试批量重命名（大量文件，会分批处理）
    console.log(`\n📝 测试批量重命名（${uploadedFiles.length} 个文件，将分成 ${Math.ceil(uploadedFiles.length / 20)} 批）...`);
    const renameList = uploadedFiles.map((fileID, index) => ({
      fileID,
      newName: `批量重命名-${index + 1}-${Date.now()}.txt`,
    }));
    
    const startTime = Date.now();
    const renameResult = await sdk.file.batchRename({
      renameList,
    });
    const endTime = Date.now();
    
    if (renameResult.code === 0 && renameResult.data) {
      console.log(`✅ 批量重命名完成！耗时: ${endTime - startTime}ms`);
      console.log(`   总文件数: ${uploadedFiles.length}`);
      console.log(`   成功: ${renameResult.data.successList.length} 个文件`);
      console.log(`   失败: ${renameResult.data.failList.length} 个文件`);
      
      if (renameResult.data.successList.length > 0) {
        console.log(`\n   成功重命名的文件（前5个）:`);
        renameResult.data.successList.slice(0, 5).forEach((item) => {
          console.log(`     - 文件ID: ${item.fileID}`);
        });
        if (renameResult.data.successList.length > 5) {
          console.log(`     ... 还有 ${renameResult.data.successList.length - 5} 个成功`);
        }
      }
      
      if (renameResult.data.failList.length > 0) {
        console.log(`\n   失败的文件:`);
        renameResult.data.failList.forEach((item) => {
          console.log(`     - 文件ID: ${item.fileID}, 错误: ${item.message}`);
        });
      }
      
      return renameResult.data;
    } else {
      console.error('❌ 批量重命名失败:', renameResult.message);
      return null;
    }
  } catch (err) {
    console.error('\n❌ 批量重命名（大量文件）测试失败:', err);
    return null;
  }
}

/**
 * 测试10: 删除文件
 */
async function testDeleteFiles(parentFileID: number) {
  console.log('\n🗑️  测试10: 删除文件');
  try {
    // 先上传几个文件用于测试删除
    console.log('📤 先上传几个文件用于测试删除...');
    const smallFileBuffer = fs.readFileSync(SMALL_FILE);
    const smallMd5 = await calculateMD5(smallFileBuffer);
    
    const uploadedFiles: number[] = [];
    
    // 上传3个文件
    for (let i = 1; i <= 3; i++) {
      const uploadResult = await sdk.file.upload.uploadFile({
        filename: `delete-test-${i}-${Date.now()}.txt`,
        file: smallFileBuffer,
        etag: smallMd5,
        parentFileID,
      });
      
      if (uploadResult.fileID) {
        uploadedFiles.push(uploadResult.fileID);
        console.log(`✅ 上传文件 ${i}，文件ID: ${uploadResult.fileID}`);
      }
    }
    
    if (uploadedFiles.length === 0) {
      console.log('⚠️  没有成功上传文件，跳过删除测试');
      return null;
    }
    
    // 测试1: 删除至回收站
    console.log('\n🗑️  测试删除至回收站...');
    const deleteToTrashResult = await sdk.file.deleteFiles({
      fileIDs: uploadedFiles.slice(0, 2), // 删除前2个文件
      permanent: false, // 删除至回收站
    });
    
    if (deleteToTrashResult.code === 0) {
      console.log('✅ 删除至回收站成功！');
      console.log(`   已删除文件: ${uploadedFiles.slice(0, 2).join(', ')}`);
    } else {
      console.error('❌ 删除至回收站失败:', deleteToTrashResult.message);
    }
    
    // 等待一下，确保删除操作完成
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // 测试2: 彻底删除（从回收站）
    console.log('\n🗑️  测试彻底删除（从回收站）...');
    const permanentDeleteResult = await sdk.file.deleteFiles({
      fileIDs: uploadedFiles.slice(0, 2), // 彻底删除前2个文件
      permanent: true, // 彻底删除
    });
    
    if (permanentDeleteResult.code === 0) {
      console.log('✅ 彻底删除成功！');
      console.log(`   已彻底删除文件: ${uploadedFiles.slice(0, 2).join(', ')}`);
    } else {
      console.error('❌ 彻底删除失败:', permanentDeleteResult.message);
      console.log('   （注意：彻底删除前文件必须在回收站中）');
    }
    
    // 测试3: 批量删除（超过100个文件，测试分批处理）
    console.log('\n🗑️  测试批量删除（大量文件，测试分批处理）...');
    
    // 先上传更多文件用于测试
    const moreFiles: number[] = [];
    const totalFiles = 150; // 上传150个文件，会分成2批（100 + 50）
    
    console.log(`📤 上传 ${totalFiles} 个文件用于测试批量删除...`);
    for (let i = 1; i <= totalFiles; i++) {
      const uploadResult = await sdk.file.upload.uploadFile({
        filename: `batch-delete-test-${i}-${Date.now()}.txt`,
        file: smallFileBuffer,
        etag: smallMd5,
        parentFileID,
      });
      
      if (uploadResult.fileID) {
        moreFiles.push(uploadResult.fileID);
        if (i % 20 === 0 || i === totalFiles) {
          process.stdout.write(`\r📤 已上传 ${i}/${totalFiles} 个文件`);
        }
      }
    }
    console.log('');
    
    if (moreFiles.length < 100) {
      console.log(`⚠️  只成功上传了 ${moreFiles.length} 个文件，不足以测试分批处理`);
    } else {
      console.log(`🗑️  开始批量删除 ${moreFiles.length} 个文件（将分成 ${Math.ceil(moreFiles.length / 100)} 批）...`);
      const startTime = Date.now();
      
      const batchDeleteResult = await sdk.file.deleteFiles({
        fileIDs: moreFiles,
        permanent: false, // 删除至回收站
      });
      
      const endTime = Date.now();
      
      if (batchDeleteResult.code === 0) {
        console.log(`✅ 批量删除完成！耗时: ${endTime - startTime}ms`);
        console.log(`   已删除 ${moreFiles.length} 个文件至回收站`);
      } else {
        console.error('❌ 批量删除失败:', batchDeleteResult.message);
      }
    }
    
    return { success: true };
  } catch (err) {
    console.error('\n❌ 删除文件测试失败:', err);
    return null;
  }
}

/**
 * 测试11: 获取文件详情
 */
async function testGetFileInfos(parentFileID: number) {
  console.log('\n📋 测试11: 获取文件详情');
  try {
    // 先上传几个文件用于测试
    console.log('📤 先上传几个文件用于测试获取详情...');
    const smallFileBuffer = fs.readFileSync(SMALL_FILE);
    const smallMd5 = await calculateMD5(smallFileBuffer);
    
    const uploadedFiles: number[] = [];
    
    // 上传3个文件
    for (let i = 1; i <= 3; i++) {
      const uploadResult = await sdk.file.upload.uploadFile({
        filename: `info-test-${i}-${Date.now()}.txt`,
        file: smallFileBuffer,
        etag: smallMd5,
        parentFileID,
      });
      
      if (uploadResult.fileID) {
        uploadedFiles.push(uploadResult.fileID);
        console.log(`✅ 上传文件 ${i}，文件ID: ${uploadResult.fileID}`);
      }
    }
    
    if (uploadedFiles.length === 0) {
      console.log('⚠️  没有成功上传文件，跳过获取文件详情测试');
      return null;
    }
    
    // 测试获取文件详情
    console.log('\n📋 获取文件详情...');
    const fileInfosResult = await sdk.file.getFileInfos({
      fileIds: uploadedFiles,
    });
    
    if (fileInfosResult.code === 0 && fileInfosResult.data) {
      console.log('✅ 获取文件详情成功！');
      console.log(`   共获取到 ${fileInfosResult.data.list.length} 个文件详情`);
      
      fileInfosResult.data.list.forEach((file, index) => {
        console.log(`\n   文件 ${index + 1}:`);
        console.log(`     - 文件ID: ${file.fileId}`);
        console.log(`     - 文件名: ${file.filename}`);
        console.log(`     - 文件大小: ${file.size} 字节`);
        console.log(`     - 类型: ${file.type === 0 ? '文件' : '文件夹'}`);
        console.log(`     - MD5: ${file.etag || '(空)'}`);
        console.log(`     - 分类: ${file.category === 0 ? '未知' : file.category === 1 ? '音频' : file.category === 2 ? '视频' : '图片'}`);
        console.log(`     - 状态: ${file.status}`);
        console.log(`     - 是否在回收站: ${file.trashed === 0 ? '否' : '是'}`);
        console.log(`     - 创建时间: ${file.createAt}`);
        console.log(`     - 更新时间: ${file.updateAt}`);
      });
      
      return fileInfosResult.data;
    } else {
      console.error('❌ 获取文件详情失败:', fileInfosResult.message);
      return null;
    }
  } catch (err) {
    console.error('\n❌ 获取文件详情测试失败:', err);
    return null;
  }
}

/**
 * 测试12: 获取文件列表
 */
async function testGetFileList(parentFileID: number) {
  console.log('\n📂 测试12: 获取文件列表');
  try {
    // 测试1: 获取指定目录的文件列表
    console.log(`📂 获取目录 ${parentFileID} 的文件列表...`);
    const fileListResult = await sdk.file.getFileList({
      parentFileId: parentFileID,
      limit: 50,
    });
    
    if (fileListResult.code === 0 && fileListResult.data) {
      console.log('✅ 获取文件列表成功！');
      console.log(`   共 ${fileListResult.data.fileList.length} 个文件/文件夹`);
      console.log(`   是否最后一页: ${fileListResult.data.lastFileId === -1 ? '是' : '否'}`);
      if (fileListResult.data.lastFileId !== -1) {
        console.log(`   下一页起始文件ID: ${fileListResult.data.lastFileId}`);
      }
      
      // 显示文件列表（前10个）
      const displayCount = Math.min(10, fileListResult.data.fileList.length);
      console.log(`\n   文件列表（前${displayCount}个）:`);
      fileListResult.data.fileList.slice(0, displayCount).forEach((file, index) => {
        const fileType = file.type === 0 ? '📄 文件' : '📁 文件夹';
        const trashedStatus = file.trashed === 0 ? '' : ' 🗑️ (回收站)';
        const categoryName = file.category === 0 ? '未知' : 
                            file.category === 1 ? '音频' : 
                            file.category === 2 ? '视频' : 
                            file.category === 3 ? '图片' : `分类${file.category}`;
        
        console.log(`     ${index + 1}. ${fileType}${trashedStatus}`);
        console.log(`        文件名: ${file.filename}`);
        console.log(`        文件ID: ${file.fileId}`);
        console.log(`        大小: ${file.size} 字节`);
        console.log(`        分类: ${categoryName}`);
        if (file.trashed === 1) {
          console.log(`        ⚠️  此文件在回收站中`);
        }
      });
      
      if (fileListResult.data.fileList.length > displayCount) {
        console.log(`     ... 还有 ${fileListResult.data.fileList.length - displayCount} 个文件/文件夹`);
      }
      
      // 统计信息
      const filesCount = fileListResult.data.fileList.filter(f => f.type === 0).length;
      const foldersCount = fileListResult.data.fileList.filter(f => f.type === 1).length;
      const trashedCount = fileListResult.data.fileList.filter(f => f.trashed === 1).length;
      console.log(`\n   统计信息:`);
      console.log(`     - 文件: ${filesCount} 个`);
      console.log(`     - 文件夹: ${foldersCount} 个`);
      console.log(`     - 回收站中的文件: ${trashedCount} 个`);
      
      // 测试翻页查询（如果有下一页）
      if (fileListResult.data.lastFileId !== -1) {
        console.log(`\n📄 测试翻页查询（下一页）...`);
        const nextPageResult = await sdk.file.getFileList({
          parentFileId: parentFileID,
          limit: 50,
          lastFileId: fileListResult.data.lastFileId,
        });
        
        if (nextPageResult.code === 0 && nextPageResult.data) {
          console.log(`✅ 翻页查询成功！`);
          console.log(`   第2页共 ${nextPageResult.data.fileList.length} 个文件/文件夹`);
          console.log(`   是否最后一页: ${nextPageResult.data.lastFileId === -1 ? '是' : '否'}`);
        }
      }
      
      // 测试搜索功能
      console.log(`\n🔍 测试搜索功能...`);
      const searchResult = await sdk.file.getFileList({
        parentFileId: 0, // 搜索时会忽略此参数
        limit: 20,
        searchData: 'test', // 搜索关键字
        searchMode: 0, // 全文模糊搜索
      });
      
      if (searchResult.code === 0 && searchResult.data) {
        console.log(`✅ 搜索成功！`);
        console.log(`   找到 ${searchResult.data.fileList.length} 个匹配的文件/文件夹`);
        if (searchResult.data.fileList.length > 0) {
          console.log(`   前3个结果:`);
          searchResult.data.fileList.slice(0, 3).forEach((file, index) => {
            console.log(`     ${index + 1}. ${file.filename} (ID: ${file.fileId})`);
          });
        }
      }
      
      return fileListResult.data;
    } else {
      console.error('❌ 获取文件列表失败:', fileListResult.message);
      return null;
    }
  } catch (err) {
    console.error('\n❌ 获取文件列表测试失败:', err);
    return null;
  }
}

/**
 * 测试13: 移动文件
 */
async function testMoveFiles(parentFileID: number) {
  console.log('\n📦 测试13: 移动文件');
  try {
    // 先创建两个目录：源目录和目标目录
    console.log('📁 创建测试目录...');
    const sourceDirResult = await sdk.file.upload.createFolder({
      name: `source-dir-${Date.now()}`,
      parentID: parentFileID,
    });
    
    const targetDirResult = await sdk.file.upload.createFolder({
      name: `target-dir-${Date.now()}`,
      parentID: parentFileID,
    });
    
    if (sourceDirResult.code !== 0 || !sourceDirResult.data?.dirID) {
      throw new Error('创建源目录失败');
    }
    if (targetDirResult.code !== 0 || !targetDirResult.data?.dirID) {
      throw new Error('创建目标目录失败');
    }
    
    const sourceDirID = sourceDirResult.data.dirID;
    const targetDirID = targetDirResult.data.dirID;
    
    console.log(`✅ 源目录ID: ${sourceDirID}`);
    console.log(`✅ 目标目录ID: ${targetDirID}`);
    
    // 在源目录中上传几个文件
    console.log('\n📤 在源目录中上传文件...');
    const smallFileBuffer = fs.readFileSync(SMALL_FILE);
    const smallMd5 = await calculateMD5(smallFileBuffer);
    
    const uploadedFiles: number[] = [];
    
    // 上传3个文件到源目录
    for (let i = 1; i <= 3; i++) {
      const uploadResult = await sdk.file.upload.uploadFile({
        filename: `move-test-${i}-${Date.now()}.txt`,
        file: smallFileBuffer,
        etag: smallMd5,
        parentFileID: sourceDirID,
      });
      
      if (uploadResult.fileID) {
        uploadedFiles.push(uploadResult.fileID);
        console.log(`✅ 上传文件 ${i}，文件ID: ${uploadResult.fileID}`);
      }
    }
    
    if (uploadedFiles.length === 0) {
      console.log('⚠️  没有成功上传文件，跳过移动测试');
      return null;
    }
    
    // 测试移动文件
    console.log(`\n📦 移动 ${uploadedFiles.length} 个文件从目录 ${sourceDirID} 到目录 ${targetDirID}...`);
    const moveResult = await sdk.file.moveFiles({
      fileIDs: uploadedFiles,
      toParentFileID: targetDirID,
    });
    
    if (moveResult.code === 0) {
      console.log('✅ 移动文件成功！');
      console.log(`   已移动 ${uploadedFiles.length} 个文件`);
      console.log(`   文件ID: ${uploadedFiles.join(', ')}`);
      
      // 验证移动结果：检查目标目录中的文件
      console.log('\n🔍 验证移动结果...');
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 等待1秒确保移动完成
      
      const targetDirList = await sdk.file.getFileList({
        parentFileId: targetDirID,
        limit: 100,
      });
      
      if (targetDirList.code === 0 && targetDirList.data) {
        const movedFiles = targetDirList.data.fileList.filter((f) =>
          uploadedFiles.includes(f.fileId)
        );
        console.log(`✅ 验证成功！目标目录中找到 ${movedFiles.length} 个已移动的文件`);
        
        if (movedFiles.length < uploadedFiles.length) {
          console.log(`⚠️  警告：期望移动 ${uploadedFiles.length} 个文件，但只找到 ${movedFiles.length} 个`);
        }
      }
      
      return { success: true, movedCount: uploadedFiles.length };
    } else {
      console.error('❌ 移动文件失败:', moveResult.message);
      return null;
    }
  } catch (err) {
    console.error('\n❌ 移动文件测试失败:', err);
    return null;
  }
}

/**
 * 测试14: 获取下载信息
 */
async function testGetDownloadInfo(parentFileID: number) {
  console.log('\n📥 测试14: 获取下载信息');
  try {
    // 先上传一个文件用于测试下载
    console.log('📤 上传测试文件...');
    const smallFileBuffer = fs.readFileSync(SMALL_FILE);
    const smallMd5 = await calculateMD5(smallFileBuffer);
    
    const uploadResult = await sdk.file.upload.uploadFile({
      filename: `download-test-${Date.now()}.txt`,
      file: smallFileBuffer,
      etag: smallMd5,
      parentFileID: parentFileID,
    });
    
    // 检查上传结果
    if (!uploadResult.fileID || uploadResult.fileID === 0) {
      console.error('❌ 上传文件失败：未获取到有效的文件ID');
      console.error('   上传结果:', JSON.stringify(uploadResult, null, 2));
      
      // 如果是异步模式，尝试轮询
      if (uploadResult.isAsync && uploadResult.preuploadID) {
        console.log('⏳ 检测到异步上传模式，开始轮询上传结果...');
        let pollAttempts = 0;
        const maxPollAttempts = 30; // 最多轮询30次（30秒）
        
        while (pollAttempts < maxPollAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 1000)); // 等待1秒
          pollAttempts++;
          
          const pollResult = await sdk.file.upload.queryUploadResult({
            preuploadID: uploadResult.preuploadID,
          });
          
          if (pollResult.code === 0 && pollResult.data) {
            if (pollResult.data.completed && pollResult.data.fileID) {
              console.log(`✅ 异步上传完成，文件ID: ${pollResult.data.fileID}`);
              const fileID = pollResult.data.fileID;
              
              // 等待一小段时间确保文件已处理完成
              console.log('⏳ 等待文件处理完成...');
              await new Promise((resolve) => setTimeout(resolve, 2000));
              
              // 获取下载信息
              console.log(`\n📥 获取文件 ${fileID} 的下载信息...`);
              const downloadResult = await sdk.file.getDownloadInfo({
                fileId: fileID,
              });
              
              return handleDownloadResult(downloadResult, fileID);
            }
          }
        }
        
        console.error('❌ 异步上传轮询超时');
        return null;
      }
      
      return null;
    }
    
    const fileID = uploadResult.fileID;
    console.log(`✅ 上传成功，文件ID: ${fileID}`);
    
    // 等待一小段时间确保文件已处理完成
    console.log('⏳ 等待文件处理完成...');
    await new Promise((resolve) => setTimeout(resolve, 20000));
    
    // 获取下载信息
    console.log(`\n📥 获取文件 ${fileID} 的下载信息...`);
    const downloadResult = await sdk.file.getDownloadInfo({
      fileId: fileID,
    });
    
    return handleDownloadResult(downloadResult, fileID);
  } catch (err) {
    console.error('\n❌ 获取下载信息测试失败:', err);
    return null;
  }
}

/**
 * 处理下载结果（辅助函数）
 */
function handleDownloadResult(downloadResult: any, fileID: number) {
    
  if (downloadResult.code === 0 && downloadResult.data) {
    console.log('✅ 获取下载信息成功！');
    console.log(`   文件ID: ${fileID}`);
    console.log(`   下载地址: ${downloadResult.data.downloadUrl}`);
    console.log(`   地址长度: ${downloadResult.data.downloadUrl.length} 字符`);
    
    // 验证下载地址格式
    if (downloadResult.data.downloadUrl.startsWith('http://') || 
        downloadResult.data.downloadUrl.startsWith('https://')) {
      console.log('✅ 下载地址格式正确（HTTP/HTTPS）');
    } else {
      console.log('⚠️  下载地址格式可能不正确');
    }
    
    return { success: true, downloadUrl: downloadResult.data.downloadUrl };
  } else {
    // 处理异常情况
    if (downloadResult.code === 5113) {
      console.error('❌ 获取下载信息失败: 自用下载流量不足');
      console.error('   提示: 您今日自用下载流量已超出1GB上限，升级VIP会员可无限流量下载');
    } else if (downloadResult.code === 5066) {
      console.error('❌ 获取下载信息失败: 文件不存在');
      console.error(`   文件ID: ${fileID}`);
      console.error('   提示: 文件可能还在处理中，请稍后重试');
    } else {
      console.error('❌ 获取下载信息失败:', downloadResult.message);
      console.error('   错误代码:', downloadResult.code);
      console.error(`   文件ID: ${fileID}`);
    }
    return null;
  }
}

/**
 * 测试15: 创建分享链接
 */
async function testCreateShare(parentFileID: number) {
  console.log('\n🔗 测试15: 创建分享链接');
  try {
    // 先上传一个文件用于测试分享
    console.log('📤 上传测试文件...');
    const smallFileBuffer = fs.readFileSync(SMALL_FILE);
    const smallMd5 = await calculateMD5(smallFileBuffer);
    
    const uploadResult = await sdk.file.upload.uploadFile({
      filename: `share-test-${Date.now()}.txt`,
      file: smallFileBuffer,
      etag: smallMd5,
      parentFileID: parentFileID,
    });
    
    // 检查上传结果
    let fileID: number | null = null;
    
    if (uploadResult.fileID && uploadResult.fileID > 0) {
      fileID = uploadResult.fileID;
      console.log(`✅ 上传成功，文件ID: ${fileID}`);
    } else if (uploadResult.isAsync && uploadResult.preuploadID) {
      console.log('⏳ 检测到异步上传模式，开始轮询上传结果...');
      let pollAttempts = 0;
      const maxPollAttempts = 30;
      
      while (pollAttempts < maxPollAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        pollAttempts++;
        
        const pollResult = await sdk.file.upload.queryUploadResult({
          preuploadID: uploadResult.preuploadID,
        });
        
        if (pollResult.code === 0 && pollResult.data) {
          if (pollResult.data.completed && pollResult.data.fileID) {
            fileID = pollResult.data.fileID;
            console.log(`✅ 异步上传完成，文件ID: ${fileID}`);
            break;
          }
        }
      }
      
      if (!fileID) {
        console.log('⚠️  异步上传轮询超时，跳过分享测试');
        return null;
      }
    } else {
      console.log('⚠️  上传文件失败，跳过分享测试');
      return null;
    }
    
    // 等待文件处理完成
    console.log('⏳ 等待文件处理完成...');
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    // 测试1: 创建基本分享链接（1天有效期）
    console.log('\n📝 测试1: 创建基本分享链接（1天有效期）...');
    const shareResult1 = await sdk.file.share.createShare({
      shareName: `测试分享-${Date.now()}`,
      shareExpire: 1, // 1天
      fileIDList: [fileID],
    });
    
    if (shareResult1.code === 0 && shareResult1.data) {
      console.log('✅ 创建分享链接成功！');
      console.log(`   分享ID: ${shareResult1.data.shareID}`);
      console.log(`   分享码: ${shareResult1.data.shareKey}`);
      console.log(`   分享链接: https://www.123pan.com/s/${shareResult1.data.shareKey}`);
    } else {
      console.error('❌ 创建分享链接失败:', shareResult1.message);
      console.error('   错误代码:', shareResult1.code);
      return null;
    }
    
    // 测试2: 创建带提取码的分享链接（7天有效期）
    console.log('\n📝 测试2: 创建带提取码的分享链接（7天有效期）...');
    const shareResult2 = await sdk.file.share.createShare({
      shareName: `测试分享-提取码-${Date.now()}`,
      shareExpire: 7, // 7天
      fileIDList: [fileID],
      sharePwd: '1234', // 设置提取码
    });
    
    if (shareResult2.code === 0 && shareResult2.data) {
      console.log('✅ 创建带提取码的分享链接成功！');
      console.log(`   分享ID: ${shareResult2.data.shareID}`);
      console.log(`   分享码: ${shareResult2.data.shareKey}`);
      console.log(`   提取码: 1234`);
      console.log(`   分享链接: https://www.123pan.com/s/${shareResult2.data.shareKey}`);
    } else {
      console.error('❌ 创建带提取码的分享链接失败:', shareResult2.message);
    }
    
    // 测试3: 创建永久分享链接（使用字符串格式的文件ID列表）
    console.log('\n📝 测试3: 创建永久分享链接（使用字符串格式）...');
    const shareResult3 = await sdk.file.share.createShare({
      shareName: `测试分享-永久-${Date.now()}`,
      shareExpire: 0, // 永久
      fileIDList: String(fileID), // 使用字符串格式
      trafficSwitch: 4, // 全部开启
    });
    
    if (shareResult3.code === 0 && shareResult3.data) {
      console.log('✅ 创建永久分享链接成功！');
      console.log(`   分享ID: ${shareResult3.data.shareID}`);
      console.log(`   分享码: ${shareResult3.data.shareKey}`);
      console.log(`   有效期: 永久`);
      console.log(`   分享链接: https://www.123pan.com/s/${shareResult3.data.shareKey}`);
    } else {
      console.error('❌ 创建永久分享链接失败:', shareResult3.message);
    }
    
    // 测试4: 创建多个文件的分享链接（30天有效期）
    console.log('\n📝 测试4: 创建多个文件的分享链接（30天有效期）...');
    // 再上传一个文件
    const uploadResult2 = await sdk.file.upload.uploadFile({
      filename: `share-test-2-${Date.now()}.txt`,
      file: smallFileBuffer,
      etag: smallMd5,
      parentFileID: parentFileID,
    });
    
    let fileID2: number | null = null;
    if (uploadResult2.fileID && uploadResult2.fileID > 0) {
      fileID2 = uploadResult2.fileID;
    } else if (uploadResult2.isAsync && uploadResult2.preuploadID) {
      // 等待异步上传完成
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const pollResult = await sdk.file.upload.queryUploadResult({
        preuploadID: uploadResult2.preuploadID,
      });
      if (pollResult.code === 0 && pollResult.data?.fileID) {
        fileID2 = pollResult.data.fileID;
      }
    }
    
    if (fileID2) {
      const shareResult4 = await sdk.file.share.createShare({
        shareName: `测试分享-多文件-${Date.now()}`,
        shareExpire: 30, // 30天
        fileIDList: [fileID, fileID2], // 多个文件
        trafficSwitch: 2, // 打开游客免登录提取
        trafficLimitSwitch: 2, // 打开限制
        trafficLimit: 100 * 1024 * 1024, // 限制100MB
      });
      
      if (shareResult4.code === 0 && shareResult4.data) {
        console.log('✅ 创建多文件分享链接成功！');
        console.log(`   分享ID: ${shareResult4.data.shareID}`);
        console.log(`   分享码: ${shareResult4.data.shareKey}`);
        console.log(`   文件数量: 2`);
        console.log(`   分享链接: https://www.123pan.com/s/${shareResult4.data.shareKey}`);
      } else {
        console.error('❌ 创建多文件分享链接失败:', shareResult4.message);
      }
    } else {
      console.log('⚠️  第二个文件上传失败，跳过多文件分享测试');
    }
    
    return { success: true, shareID: shareResult1.data?.shareID };
  } catch (err) {
    console.error('\n❌ 创建分享链接测试失败:', err);
    return null;
  }
}

/**
 * 测试16: 创建付费分享链接
 */
async function testCreatePaidShare(parentFileID: number) {
  console.log('\n💰 测试16: 创建付费分享链接');
  try {
    // 先上传一个文件用于测试付费分享
    console.log('📤 上传测试文件...');
    const smallFileBuffer = fs.readFileSync(SMALL_FILE);
    const smallMd5 = await calculateMD5(smallFileBuffer);
    
    const uploadResult = await sdk.file.upload.uploadFile({
      filename: `paid-share-test-${Date.now()}.txt`,
      file: smallFileBuffer,
      etag: smallMd5,
      parentFileID: parentFileID,
    });
    
    // 检查上传结果
    let fileID: number | null = null;
    
    if (uploadResult.fileID && uploadResult.fileID > 0) {
      fileID = uploadResult.fileID;
      console.log(`✅ 上传成功，文件ID: ${fileID}`);
    } else if (uploadResult.isAsync && uploadResult.preuploadID) {
      console.log('⏳ 检测到异步上传模式，开始轮询上传结果...');
      let pollAttempts = 0;
      const maxPollAttempts = 30;
      
      while (pollAttempts < maxPollAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        pollAttempts++;
        
        const pollResult = await sdk.file.upload.queryUploadResult({
          preuploadID: uploadResult.preuploadID,
        });
        
        if (pollResult.code === 0 && pollResult.data) {
          if (pollResult.data.completed && pollResult.data.fileID) {
            fileID = pollResult.data.fileID;
            console.log(`✅ 异步上传完成，文件ID: ${fileID}`);
            break;
          }
        }
      }
      
      if (!fileID) {
        console.log('⚠️  异步上传轮询超时，跳过付费分享测试');
        return null;
      }
    } else {
      console.log('⚠️  上传文件失败，跳过付费分享测试');
      return null;
    }
    
    // 等待文件处理完成
    console.log('⏳ 等待文件处理完成...');
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    // 测试1: 创建基本付费分享链接
    console.log('\n📝 测试1: 创建基本付费分享链接（10元）...');
    const paidShareResult1 = await sdk.file.share.createPaidShare({
      shareName: `测试付费分享-${Date.now()}`,
      fileIDList: [fileID],
      payAmount: 10, // 10元
    });
    
    if (paidShareResult1.code === 0 && paidShareResult1.data) {
      console.log('✅ 创建付费分享链接成功！');
      console.log(`   分享ID: ${paidShareResult1.data.shareID}`);
      console.log(`   分享码: ${paidShareResult1.data.shareKey}`);
      console.log(`   付费金额: 10元`);
      console.log(`   付费分享链接: https://www.123pan.com/ps/${paidShareResult1.data.shareKey}`);
    } else {
      console.error('❌ 创建付费分享链接失败:', paidShareResult1.message);
      console.error('   错误代码:', paidShareResult1.code);
      return null;
    }
    
    // 测试2: 创建带打赏和描述的付费分享链接
    console.log('\n📝 测试2: 创建带打赏和描述的付费分享链接（50元）...');
    const paidShareResult2 = await sdk.file.share.createPaidShare({
      shareName: `付费分享-打赏-${Date.now()}`,
      fileIDList: [fileID],
      payAmount: 50, // 50元
      isReward: 1, // 开启打赏
      resourceDesc: '这是我的测试付费分享链接，用来测试openapi',
    });
    
    if (paidShareResult2.code === 0 && paidShareResult2.data) {
      console.log('✅ 创建带打赏的付费分享链接成功！');
      console.log(`   分享ID: ${paidShareResult2.data.shareID}`);
      console.log(`   分享码: ${paidShareResult2.data.shareKey}`);
      console.log(`   付费金额: 50元`);
      console.log(`   打赏: 已开启`);
      console.log(`   资源描述: 这是我的测试付费分享链接，用来测试openapi`);
      console.log(`   付费分享链接: https://www.123pan.com/ps/${paidShareResult2.data.shareKey}`);
    } else {
      console.error('❌ 创建带打赏的付费分享链接失败:', paidShareResult2.message);
    }
    
    // 测试3: 创建带流量限制的付费分享链接（使用字符串格式的文件ID列表）
    console.log('\n📝 测试3: 创建带流量限制的付费分享链接（100元，使用字符串格式）...');
    const paidShareResult3 = await sdk.file.share.createPaidShare({
      shareName: `付费分享-流量限制-${Date.now()}`,
      fileIDList: String(fileID), // 使用字符串格式
      payAmount: 100, // 100元
      trafficSwitch: 4, // 全部开启
      trafficLimitSwitch: 2, // 打开限制
      trafficLimit: 500 * 1024 * 1024, // 限制500MB
    });
    
    if (paidShareResult3.code === 0 && paidShareResult3.data) {
      console.log('✅ 创建带流量限制的付费分享链接成功！');
      console.log(`   分享ID: ${paidShareResult3.data.shareID}`);
      console.log(`   分享码: ${paidShareResult3.data.shareKey}`);
      console.log(`   付费金额: 100元`);
      console.log(`   流量限制: 500MB`);
      console.log(`   付费分享链接: https://www.123pan.com/ps/${paidShareResult3.data.shareKey}`);
    } else {
      console.error('❌ 创建带流量限制的付费分享链接失败:', paidShareResult3.message);
    }
    
    // 测试4: 创建最小金额的付费分享链接
    console.log('\n📝 测试4: 创建最小金额的付费分享链接（1元）...');
    const paidShareResult4 = await sdk.file.share.createPaidShare({
      shareName: `付费分享-最小金额-${Date.now()}`,
      fileIDList: [fileID],
      payAmount: 1, // 最小金额1元
      isReward: 0, // 不开启打赏
    });
    
    if (paidShareResult4.code === 0 && paidShareResult4.data) {
      console.log('✅ 创建最小金额付费分享链接成功！');
      console.log(`   分享ID: ${paidShareResult4.data.shareID}`);
      console.log(`   分享码: ${paidShareResult4.data.shareKey}`);
      console.log(`   付费金额: 1元（最小金额）`);
      console.log(`   付费分享链接: https://www.123pan.com/ps/${paidShareResult4.data.shareKey}`);
    } else {
      console.error('❌ 创建最小金额付费分享链接失败:', paidShareResult4.message);
    }
    
    return { success: true, shareID: paidShareResult1.data?.shareID };
  } catch (err) {
    console.error('\n❌ 创建付费分享链接测试失败:', err);
    return null;
  }
}

/**
 * 主测试函数
 */
async function main() {
  console.log('🚀 开始测试文件上传API\n');
  
  // 测试1: 创建目录
  const dirID = await testCreateFolder();
  // if (!dirID) {
  //   console.error('❌ 无法继续测试，因为创建目录失败');
  //   return;
  // }
  
  // 测试2: 获取上传域名
  // const uploadServer = await testGetUploadDomain();
  // if (!uploadServer) {
  //   console.error('❌ 无法继续测试，因为获取上传域名失败');
  //   return;
  // }
  
  // 测试3: 创建文件
  // await testCreateFile(dirID);
  
  // 测试4: 单步上传
  // await testSingleUpload(dirID, uploadServer);
  
  // // 测试5: 分片上传
  // await testSliceUpload(dirID, uploadServer);
  
  // // 测试6: 一键上传（同步模式，推荐使用）
  // // await testUploadFile(dirID);
  
  // // 测试7: 异步模式上传
  // await testAsyncUpload(dirID);
  
  // // 测试8: 批量重命名（少量文件）
  // await testBatchRename(dirID);
  
  // // 测试9: 批量重命名（大量文件，测试分批处理）
  // await testBatchRenameLarge(dirID);
  
  // 测试10: 删除文件（删除至回收站）
  // if (dirID) {
  //   await testDeleteFiles(dirID);
  // }
  
  // 测试11: 获取文件详情
  // if (dirID) {
  //   await testGetFileInfos(dirID);
  // }
  
  // // 测试12: 获取文件列表
  // if (dirID) {
  //   await testGetFileList(dirID);
  
  
  // 测试13: 移动文件
  if (dirID) {
    // await testMoveFiles(dirID);
  }
  
  // 测试14: 获取下载信息
  if (dirID) {
    // await testGetDownloadInfo(dirID);
  }
  
  // 测试15: 创建分享链接
  if (dirID) {
    // await testCreateShare(dirID);
  }
  
  // 测试16: 创建付费分享链接
  if (dirID) {
    // await testCreatePaidShare(dirID);
  }
  
  console.log('\n✅ 所有测试完成！');
  
  // 退出
  process.exit(0);
}

// 运行测试
// main().catch(console.error);
