/**
 * 限流器 - 控制API请求频率
 */

import type { RateLimiter } from '../types';

export interface RateLimiterConfig {
  maxRequests: number;
  perMilliseconds: number;
  maxRetries: number;
}

export class TokenBucketRateLimiter implements RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per millisecond
  private readonly maxRetries: number;

  constructor(config: RateLimiterConfig) {
    this.maxTokens = config.maxRequests;
    this.tokens = this.maxTokens;
    this.refillRate = config.maxRequests / config.perMilliseconds;
    this.maxRetries = config.maxRetries;
    this.lastRefill = Date.now();
  }

  /**
   * 检查是否可以发送请求，如果不能则等待
   */
  async checkLimit(): Promise<void> {
    let retries = 0;
    
    while (retries < this.maxRetries) {
      this.refillTokens();
      
      if (this.tokens >= 1) {
        this.tokens -= 1;
        return;
      }

      // 计算需要等待的时间
      const waitTime = Math.ceil(1 / this.refillRate);
      await this.sleep(waitTime);
      retries++;
    }

    throw new Error(`Rate limit exceeded. Max retries (${this.maxRetries}) reached.`);
  }

  /**
   * 重新填充令牌桶
   */
  private refillTokens(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = timePassed * this.refillRate;
    
    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  /**
   * 重置限流器
   */
  reset(): void {
    this.tokens = this.maxTokens;
    this.lastRefill = Date.now();
  }

  /**
   * 获取当前可用令牌数
   */
  getAvailableTokens(): number {
    this.refillTokens();
    return Math.floor(this.tokens);
  }

  /**
   * 睡眠指定毫秒数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * 创建默认的限流器
 */
export function createDefaultRateLimiter(): RateLimiter {
  return new TokenBucketRateLimiter({
    maxRequests: 100, // 每分钟最多100个请求
    perMilliseconds: 60 * 1000, // 1分钟
    maxRetries: 3, // 最多重试3次
  });
}
