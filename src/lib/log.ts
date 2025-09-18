// Simple console-based logger to avoid worker thread issues
// This replaces the pino logger that was causing worker thread crashes

interface LogData {
  [key: string]: any;
}

class SimpleLogger {
  private context: LogData;

  constructor(context: LogData = {}) {
    this.context = context;
  }

  // Create child logger with additional context
  child(context: LogData): SimpleLogger {
    return new SimpleLogger({ ...this.context, ...context });
  }

  trace(message: string, data?: LogData): void {
    console.log(`[TRACE] ${message}`, { ...this.context, ...data });
  }

  debug(message: string, data?: LogData): void {
    console.log(`[DEBUG] ${message}`, { ...this.context, ...data });
  }

  info(message: string, data?: LogData): void {
    console.log(`[INFO] ${message}`, { ...this.context, ...data });
  }

  warn(message: string, data?: LogData): void {
    console.warn(`[WARN] ${message}`, { ...this.context, ...data });
  }

  error(message: string, data?: LogData): void {
    console.error(`[ERROR] ${message}`, { ...this.context, ...data });
  }

  fatal(message: string, data?: LogData): void {
    console.error(`[FATAL] ${message}`, { ...this.context, ...data });
  }

  // Performance logging
  logPerformance(operation: string, durationMs: number, data?: LogData): void {
    this.info(`Performance: ${operation} took ${durationMs}ms`, {
      operation,
      durationMs,
      type: 'performance_metric',
      ...data
    });
  }

  // Security logging
  logSecurity(event: string, data?: LogData): void {
    this.warn(`Security: ${event}`, {
      event,
      type: 'security_event',
      ...data
    });
  }

  // Error logging with stack trace
  logError(error: Error, context?: LogData): void {
    this.error(`Error: ${error.message}`, {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...context
    });
  }

  // Image search logging
  logImageSearch(fileName: string, fileSize: number, resultCount: number, durationMs: number, tenantSlug?: string): void {
    this.info(`Image search completed`, {
      fileName,
      fileSize,
      resultCount,
      durationMs,
      tenantSlug,
      type: 'image_search_complete'
    });
  }
}

// Create the main logger instance
const logger = new SimpleLogger();

// Export functions for backward compatibility
export function createLogger(context: LogData = {}): SimpleLogger {
  return new SimpleLogger(context);
}

export function createApiLogger(route: string): SimpleLogger {
  return new SimpleLogger({ route, service: 'api' });
}

// Export the main logger
export default logger;

// Performance timer class
export class PerformanceTimer {
  private startTime: number;
  private operation: string;
  private logger: SimpleLogger;

  constructor(operation: string, logger: SimpleLogger) {
    this.operation = operation;
    this.logger = logger;
    this.startTime = Date.now();
  }

  end(data?: LogData): void {
    const duration = Date.now() - this.startTime;
    if (this.logger && this.logger.logPerformance) {
      this.logger.logPerformance(this.operation, duration, data);
    } else {
      console.log(`Performance: ${this.operation} took ${duration}ms`, data);
    }
  }
}

// Logger class for backward compatibility
export class Logger extends SimpleLogger {
  constructor(context: LogData = {}) {
    super(context);
  }
}