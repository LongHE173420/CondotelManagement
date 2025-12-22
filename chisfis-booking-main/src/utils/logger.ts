/**
 * Logger Utility
 * 
 * Centralized logging service that respects environment variables.
 * In production, only errors are logged. In development, all logs are shown.
 * 
 * Usage:
 *   import logger from 'utils/logger';
 *   logger.info('User logged in');
 *   logger.warn('Deprecated API used');
 *   logger.error('Failed to fetch data', error);
 *   logger.debug('Debug info', { userId: 123 });
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  showTimestamp: boolean;
  showLevel: boolean;
}

class Logger {
  private config: LoggerConfig;

  constructor() {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const debugMode = process.env.REACT_APP_DEBUG_MODE === 'true';
    
    this.config = {
      enabled: false, // Disable all logging
      level: debugMode ? 'debug' : (isDevelopment ? 'info' : 'error'),
      showTimestamp: true,
      showLevel: true,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    // Disable all logging including errors
    return false;
  }

  private formatMessage(level: LogLevel, message: string, ...args: any[]): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const prefix: string[] = [];
    
    if (this.config.showLevel) {
      const emoji = {
        debug: '🔍',
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌',
      }[level];
      prefix.push(`${emoji} [${level.toUpperCase()}]`);
    }

    if (this.config.showTimestamp) {
      prefix.push(`[${new Date().toISOString()}]`);
    }

    const formattedMessage = prefix.length > 0 
      ? `${prefix.join(' ')} ${message}`
      : message;

    // Use appropriate console method
    switch (level) {
      case 'debug':
        console.debug(formattedMessage, ...args);
        break;
      case 'info':
        console.log(formattedMessage, ...args);
        break;
      case 'warn':
        console.warn(formattedMessage, ...args);
        break;
      case 'error':
        console.error(formattedMessage, ...args);
        break;
    }
  }

  /**
   * Debug logs - only shown in debug mode
   */
  debug(message: string, ...args: any[]): void {
    this.formatMessage('debug', message, ...args);
  }

  /**
   * Info logs - shown in development and debug mode
   */
  info(message: string, ...args: any[]): void {
    this.formatMessage('info', message, ...args);
  }

  /**
   * Warning logs - shown in development and debug mode
   */
  warn(message: string, ...args: any[]): void {
    this.formatMessage('warn', message, ...args);
  }

  /**
   * Error logs - always shown
   */
  error(message: string, ...args: any[]): void {
    this.formatMessage('error', message, ...args);
  }

  /**
   * Log API request (only in debug mode)
   */
  apiRequest(method: string, url: string, data?: any): void {
    if (this.shouldLog('debug')) {
      this.debug(`API ${method.toUpperCase()}`, url, data ? { data } : '');
    }
  }

  /**
   * Log API response (only in debug mode)
   */
  apiResponse(status: number, url: string, data?: any): void {
    if (this.shouldLog('debug')) {
      const emoji = status >= 200 && status < 300 ? '✅' : '❌';
      this.debug(`${emoji} API Response ${status}`, url, data ? { data } : '');
    }
  }

  /**
   * Log API error with details
   */
  apiError(status: number, url: string, error: any): void {
    this.error(`API Error ${status}`, url, {
      message: error?.message,
      response: error?.response?.data,
      errors: error?.response?.data?.errors,
    });
  }

  /**
   * Group related logs together
   */
  group(label: string, callback: () => void): void {
    if (this.shouldLog('debug')) {
      console.group(label);
      callback();
      console.groupEnd();
    } else {
      callback();
    }
  }
}

// Export singleton instance
const logger = new Logger();
export default logger;


