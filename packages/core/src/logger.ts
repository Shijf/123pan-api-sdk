/**
 * 123pan SDK Logger
 * 提供结构化日志记录功能
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  levelName: string;
  message: string;
  module?: string;
  data?: any;
  error?: Error;
  requestId?: string;
  userId?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  enableRemote: boolean;
  format: 'json' | 'text';
  prefix?: string;
  colors?: boolean;
  maxEntries?: number;
  remoteEndpoint?: string;
  onLog?: (entry: LogEntry) => void;
}

export interface LoggerTransport {
  log(entry: LogEntry): void | Promise<void>;
}

/**
 * 控制台传输器
 */
export class ConsoleTransport implements LoggerTransport {
  private colors: boolean;

  constructor(colors: boolean = true) {
    this.colors = colors;
  }

  log(entry: LogEntry): void {
    const { timestamp, levelName, message, module, data, error } = entry;
    
    let logMessage = `[${timestamp}] ${levelName}`;
    if (module) {
      logMessage += ` [${module}]`;
    }
    logMessage += `: ${message}`;

    // 根据日志级别选择控制台方法和颜色
    const logMethod = this.getLogMethod(entry.level);
    
    if (this.colors && typeof globalThis !== 'undefined' && typeof (globalThis as any).window === 'undefined') {
      // Node.js 环境下的颜色支持
      logMessage = this.colorize(logMessage, entry.level);
    }

    // 输出主要日志信息
    logMethod(logMessage);

    // 输出附加数据
    if (data) {
      logMethod('Data:', data);
    }

    // 输出错误信息
    if (error) {
      logMethod('Error:', error);
    }
  }

  private getLogMethod(level: LogLevel): (...args: any[]) => void {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug;
      case LogLevel.INFO:
        return console.info;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.ERROR:
        return console.error;
      default:
        return console.log;
    }
  }

  private colorize(message: string, level: LogLevel): string {
    const colors: Record<LogLevel, string> = {
      [LogLevel.DEBUG]: '\x1b[36m', // Cyan
      [LogLevel.INFO]: '\x1b[32m',  // Green
      [LogLevel.WARN]: '\x1b[33m',  // Yellow
      [LogLevel.ERROR]: '\x1b[31m', // Red
      [LogLevel.SILENT]: '',        // No color for silent
    };
    const reset = '\x1b[0m';
    return `${colors[level] || ''}${message}${reset}`;
  }
}

/**
 * 内存传输器（用于存储日志条目）
 */
export class MemoryTransport implements LoggerTransport {
  private entries: LogEntry[] = [];
  private maxEntries: number;

  constructor(maxEntries: number = 1000) {
    this.maxEntries = maxEntries;
  }

  log(entry: LogEntry): void {
    this.entries.push(entry);
    
    // 保持最大条目数限制
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }
  }

  getEntries(): LogEntry[] {
    return [...this.entries];
  }

  clear(): void {
    this.entries = [];
  }

  getEntriesByLevel(level: LogLevel): LogEntry[] {
    return this.entries.filter(entry => entry.level === level);
  }

  getEntriesByModule(module: string): LogEntry[] {
    return this.entries.filter(entry => entry.module === module);
  }
}

/**
 * 远程传输器（发送日志到远程服务器）
 */
export class RemoteTransport implements LoggerTransport {
  private endpoint: string;
  private buffer: LogEntry[] = [];
  private batchSize: number;
  private flushInterval: number;
  private timer?: NodeJS.Timeout;

  constructor(endpoint: string, batchSize: number = 10, flushInterval: number = 5000) {
    this.endpoint = endpoint;
    this.batchSize = batchSize;
    this.flushInterval = flushInterval;
    this.startTimer();
  }

  log(entry: LogEntry): void {
    this.buffer.push(entry);
    
    if (this.buffer.length >= this.batchSize) {
      this.flush();
    }
  }

  private startTimer(): void {
    this.timer = setInterval(() => {
      if (this.buffer.length > 0) {
        this.flush();
      }
    }, this.flushInterval);
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const entries = [...this.buffer];
    this.buffer = [];

    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs: entries }),
      });
    } catch (error) {
      // 如果发送失败，将日志重新加入缓冲区
      console.error('Failed to send logs to remote endpoint:', error);
      this.buffer.unshift(...entries);
    }
  }

  destroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.flush();
  }
}

/**
 * 主要的Logger类
 */
export class Logger {
  private config: LoggerConfig;
  private transports: LoggerTransport[] = [];
  private context: Record<string, any> = {};

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableFile: false,
      enableRemote: false,
      format: 'text',
      colors: true,
      maxEntries: 1000,
      ...config,
    };

    this.setupTransports();
  }

  private setupTransports(): void {
    // 控制台传输器
    if (this.config.enableConsole) {
      this.transports.push(new ConsoleTransport(this.config.colors));
    }

    // 内存传输器（总是启用，用于调试）
    this.transports.push(new MemoryTransport(this.config.maxEntries));

    // 远程传输器
    if (this.config.enableRemote && this.config.remoteEndpoint) {
      this.transports.push(new RemoteTransport(this.config.remoteEndpoint));
    }
  }

  /**
   * 设置上下文信息
   */
  setContext(key: string, value: any): void {
    this.context[key] = value;
  }

  /**
   * 获取上下文信息
   */
  getContext(): Record<string, any> {
    return { ...this.context };
  }

  /**
   * 清除上下文信息
   */
  clearContext(): void {
    this.context = {};
  }

  /**
   * 创建子logger
   */
  child(module: string, context?: Record<string, any>): Logger {
    const childLogger = new Logger(this.config);
    childLogger.context = { ...this.context, module, ...context };
    return childLogger;
  }

  /**
   * 记录日志
   */
  private log(level: LogLevel, message: string, data?: any, error?: Error): void {
    if (level < this.config.level) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      levelName: LogLevel[level],
      message,
      module: this.context.module,
      data,
      ...(error && { error }),
      requestId: this.context.requestId,
      userId: this.context.userId,
    };

    // 调用自定义日志处理器
    if (this.config.onLog) {
      this.config.onLog(entry);
    }

    // 发送到所有传输器
    this.transports.forEach(transport => {
      try {
        transport.log(entry);
      } catch (error) {
        console.error('Logger transport error:', error);
      }
    });
  }

  /**
   * Debug级别日志
   */
  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * Info级别日志
   */
  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * Warning级别日志
   */
  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  /**
   * Error级别日志
   */
  error(message: string, error?: Error, data?: any): void {
    this.log(LogLevel.ERROR, message, data, error);
  }

  /**
   * 获取内存中的日志条目
   */
  getMemoryLogs(): LogEntry[] {
    const memoryTransport = this.transports.find(t => t instanceof MemoryTransport) as MemoryTransport;
    return memoryTransport ? memoryTransport.getEntries() : [];
  }

  /**
   * 清除内存中的日志
   */
  clearMemoryLogs(): void {
    const memoryTransport = this.transports.find(t => t instanceof MemoryTransport) as MemoryTransport;
    if (memoryTransport) {
      memoryTransport.clear();
    }
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
    this.transports = [];
    this.setupTransports();
  }

  /**
   * 销毁logger
   */
  destroy(): void {
    this.transports.forEach(transport => {
      if (transport instanceof RemoteTransport) {
        transport.destroy();
      }
    });
    this.transports = [];
  }
}

/**
 * 默认logger实例
 */
export const defaultLogger = new Logger();

/**
 * 便捷的日志函数
 */
export const log = {
  debug: (message: string, data?: any) => defaultLogger.debug(message, data),
  info: (message: string, data?: any) => defaultLogger.info(message, data),
  warn: (message: string, data?: any) => defaultLogger.warn(message, data),
  error: (message: string, error?: Error, data?: any) => defaultLogger.error(message, error, data),
};

/**
 * 创建logger实例的工厂函数
 */
export function createLogger(config?: Partial<LoggerConfig>): Logger {
  return new Logger(config);
}

/**
 * 为模块创建专用logger
 */
export function createModuleLogger(moduleName: string, config?: Partial<LoggerConfig>): Logger {
  const logger = new Logger(config);
  logger.setContext('module', moduleName);
  return logger;
}
