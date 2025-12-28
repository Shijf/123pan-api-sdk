/**
 * 文件上传工具函数（Node.js环境专用）
 * 
 * 注意：文件处理相关的工具函数（calculateMD5, sliceFile, getFileSize, calculateSliceMD5）
 * 已迁移到 @123pan/core 包中，请从那里导入。
 * 
 * 此文件保留仅为向后兼容，建议直接使用 @123pan/core 中的函数。
 */

// 重新导出 core 包中的文件工具函数
export {
  calculateMD5,
  sliceFile,
  getFileSize,
  calculateSliceMD5,
} from '@123pan/core';

