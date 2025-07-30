// Use environment variable with fallback
const getNodeEnv = () => {
  try {
    // Try to import from static private first
    return process?.env?.NODE_ENV || 'production';
  } catch {
    // Fallback for build/deployment environments
    return 'production';
  }
};

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = getNodeEnv() === 'development';
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const levelUpper = level.toUpperCase().padEnd(5);

    let formatted = `[${timestamp}] ${levelUpper} ${message}`;

    if (context && Object.keys(context).length > 0) {
      formatted += ` | Context: ${JSON.stringify(context, null, 2)}`;
    }

    return formatted;
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.isDevelopment && level === 'debug') {
      return false;
    }
    return true;
  }

  debug(message: string, context?: LogContext) {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext) {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: LogContext) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context));
    }
  }

  error(message: string, context?: LogContext) {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, context));
    }
  }

  // Specialized logging methods for different parts of the application
  stripe(action: string, data?: LogContext) {
    this.info(`[STRIPE] ${action}`, data);
  }

  pexels(action: string, data?: LogContext) {
    this.info(`[PEXELS] ${action}`, data);
  }

  zapier(action: string, data?: LogContext) {
    this.info(`[ZAPIER] ${action}`, data);
  }

  webhook(action: string, data?: LogContext) {
    this.info(`[WEBHOOK] ${action}`, data);
  }

  payment(action: string, data?: LogContext) {
    this.info(`[PAYMENT] ${action}`, data);
  }

  // Performance logging
  startTimer(label: string): () => void {
    if (!this.isDevelopment) return () => {};

    const start = performance.now();
    this.debug(`⏱️  Started timer: ${label}`);

    return () => {
      const end = performance.now();
      const duration = Math.round(end - start);
      this.debug(`⏱️  Finished timer: ${label}`, { duration: `${duration}ms` });
    };
  }

  // Request logging
  request(method: string, url: string, data?: LogContext) {
    this.debug(`🌐 ${method.toUpperCase()} ${url}`, data);
  }

  response(status: number, url: string, data?: LogContext) {
    const level = status >= 400 ? 'warn' : 'debug';
    this[level](`🌐 Response ${status} for ${url}`, data);
  }

  // Environment info
  getEnvironmentInfo() {
    return {
      isDevelopment: this.isDevelopment,
      nodeEnv: getNodeEnv(),
      timestamp: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const logger = new Logger();

// Export helper functions for common patterns
export const logWebhookEvent = (eventType: string, sessionId: string, context?: LogContext) => {
  logger.webhook(`Processing ${eventType}`, { sessionId, ...context });
};

export const logPaymentFlow = (step: string, sessionId: string, context?: LogContext) => {
  logger.payment(`Payment flow: ${step}`, { sessionId, ...context });
};

export const logAPICall = (service: string, action: string, context?: LogContext) => {
  logger.info(`[${service.toUpperCase()}] ${action}`, context);
};

export const logError = (error: Error, context?: LogContext) => {
  logger.error(`❌ ${error.message}`, {
    stack: error.stack,
    ...context
  });
};

// Development-only detailed logging
export const devLog = (message: string, data?: any) => {
  if (getNodeEnv() === 'development') {
    console.log(`🔍 [DEV] ${message}`, data);
  }
};

// Production-safe logging (only errors and warnings)
export const prodLog = (level: 'error' | 'warn', message: string, context?: LogContext) => {
  if (level === 'error') {
    logger.error(message, context);
  } else {
    logger.warn(message, context);
  }
};
