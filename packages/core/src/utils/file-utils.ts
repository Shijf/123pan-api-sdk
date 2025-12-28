/**
 * 文件处理工具函数（Node.js环境专用）
 */

import crypto from 'crypto';

/**
 * 计算文件的 MD5 哈希值（Node.js环境）
 * @param file 文件数据（Buffer、Uint8Array 或 ArrayBuffer）
 * @returns MD5 哈希值的十六进制字符串
 */
export async function calculateMD5(file: ArrayBuffer | Buffer | Uint8Array): Promise<string> {
  let buffer: Buffer;

  // 转换为 Buffer
  if (Buffer.isBuffer(file)) {
    buffer = file;
  } else if (file instanceof Uint8Array) {
    buffer = Buffer.from(file);
  } else if (file instanceof ArrayBuffer) {
    buffer = Buffer.from(file);
  } else {
    throw new Error('Unsupported file type for MD5 calculation. Expected Buffer, Uint8Array, or ArrayBuffer.');
  }

  return crypto.createHash('md5').update(buffer).digest('hex');
}

/**
 * 将文件切分为分片（Node.js环境）
 * @param file 文件数据（Buffer、Uint8Array 或 ArrayBuffer）
 * @param sliceSize 分片大小（字节）
 * @returns 分片数组，每个分片都是 Buffer
 */
export function sliceFile(
  file: ArrayBuffer | Buffer | Uint8Array,
  sliceSize: number
): Buffer[] {
  const slices: Buffer[] = [];

  if (Buffer.isBuffer(file)) {
    let offset = 0;
    while (offset < file.length) {
      const end = Math.min(offset + sliceSize, file.length);
      slices.push(file.subarray(offset, end));
      offset = end;
    }
  } else if (file instanceof Uint8Array) {
    let offset = 0;
    while (offset < file.length) {
      const end = Math.min(offset + sliceSize, file.length);
      slices.push(Buffer.from(file.subarray(offset, end)));
      offset = end;
    }
  } else if (file instanceof ArrayBuffer) {
    const buffer = Buffer.from(file);
    let offset = 0;
    while (offset < buffer.length) {
      const end = Math.min(offset + sliceSize, buffer.length);
      slices.push(buffer.subarray(offset, end));
      offset = end;
    }
  } else {
    throw new Error('Unsupported file type. Expected Buffer, Uint8Array, or ArrayBuffer.');
  }

  return slices;
}

/**
 * 获取文件大小（Node.js环境）
 * @param file 文件数据（Buffer、Uint8Array 或 ArrayBuffer）
 * @returns 文件大小（字节）
 */
export function getFileSize(file: ArrayBuffer | Buffer | Uint8Array): number {
  if (Buffer.isBuffer(file) || file instanceof Uint8Array) {
    return file.length;
  }
  if (file instanceof ArrayBuffer) {
    return file.byteLength;
  }
  return 0;
}

/**
 * 计算分片的MD5（Node.js环境）
 * @param slice 分片数据（Buffer、Uint8Array 或 ArrayBuffer）
 * @returns MD5 哈希值的十六进制字符串
 */
export async function calculateSliceMD5(slice: ArrayBuffer | Buffer | Uint8Array): Promise<string> {
  return calculateMD5(slice);
}

