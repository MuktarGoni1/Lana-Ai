// import { createClient } from '@/lib/supabase/server';

// Define log levels
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Define log event types
type AuthEventType = 
  | 'AUTH_CHECK_START'
  | 'AUTH_CHECK_COMPLETE'
  | 'AUTH_ERROR'
  | 'LOGIN_ATTEMPT'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'LOGOUT_ATTEMPT'
  | 'LOGOUT_SUCCESS'
  | 'LOGOUT_FAILURE'
  | 'SESSION_REFRESH'
  | 'GUEST_ACCESS'
  | 'PROTECTED_ROUTE_ACCESS'
  | 'REDIRECT_PERFORMED'
  | 'ONBOARDING_STATUS_CHECK'
  | 'ROLE_VALIDATION'
  | 'GUEST_CONVERSION_START'
  | 'GUEST_CONVERSION_COMPLETE'
  | 'GUEST_CONVERSION_FAILURE';

// Define the structure of a log entry
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  eventType: AuthEventType;
  message: string;
  userId?: string;
  userEmail?: string;
  pathname?: string;
  userAgent?: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
  // Additional properties for specific event types
  isAuthenticated?: boolean;
  error?: string;
  hasGuestCookie?: boolean;
  redirectTarget?: string;
  reason?: string;
}

// Simple in-memory log buffer for development
let logBuffer: LogEntry[] = [];
const BUFFER_SIZE = 100;

class AuthLogger {
  private isEnabled: boolean;
  private minLevel: LogLevel;

  constructor() {
    // In a production environment, we would check environment variables
    // For now, we'll enable logging in all environments for demonstration
    this.isEnabled = true;
    this.minLevel = this.getLogLevelFromString(process.env.NEXT_PUBLIC_AUTH_LOG_LEVEL || 'info');
  }

  private getLogLevelFromString(level: string): LogLevel {
    switch (level.toLowerCase()) {
      case 'debug': return 'debug';
      case 'info': return 'info';
      case 'warn': return 'warn';
      case 'error': return 'error';
      default: return 'info';
    }
  }

  private getLogLevelPriority(level: LogLevel): number {
    switch (level) {
      case 'debug': return 0;
      case 'info': return 1;
      case 'warn': return 2;
      case 'error': return 3;
      default: return 1;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.isEnabled) return false;
    return this.getLogLevelPriority(level) >= this.getLogLevelPriority(this.minLevel);
  }

  private createLogEntry(
    level: LogLevel,
    eventType: AuthEventType,
    message: string,
    additionalData: Partial<LogEntry> = {}
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      eventType,
      message,
      ...additionalData
    };

    return entry;
  }

  private async sendLogToServer(logEntry: LogEntry): Promise<void> {
    try {
      // In a real implementation, we would send logs to a logging service
      // For now, we'll just store in memory buffer and console log
      logBuffer.push(logEntry);
      
      // Keep buffer at reasonable size
      if (logBuffer.length > BUFFER_SIZE) {
        logBuffer = logBuffer.slice(-BUFFER_SIZE);
      }

      // Also log to console for immediate visibility
      const logMessage = `[${logEntry.timestamp}] [${logEntry.level.toUpperCase()}] [${logEntry.eventType}] ${logEntry.message}`;
      switch (logEntry.level) {
        case 'debug':
          console.debug(logMessage, logEntry.metadata || '');
          break;
        case 'info':
          console.info(logMessage, logEntry.metadata || '');
          break;
        case 'warn':
          console.warn(logMessage, logEntry.metadata || '');
          break;
        case 'error':
          console.error(logMessage, logEntry.metadata || '');
          break;
      }
    } catch (error) {
      console.error('Failed to log auth event:', error);
    }
  }

  public async log(
    level: LogLevel,
    eventType: AuthEventType,
    message: string,
    additionalData: Partial<LogEntry> = {}
  ): Promise<void> {
    if (!this.shouldLog(level)) return;

    const logEntry = this.createLogEntry(level, eventType, message, additionalData);
    await this.sendLogToServer(logEntry);
  }

  public async debug(
    eventType: AuthEventType,
    message: string,
    additionalData: Partial<LogEntry> = {}
  ): Promise<void> {
    await this.log('debug', eventType, message, additionalData);
  }

  public async info(
    eventType: AuthEventType,
    message: string,
    additionalData: Partial<LogEntry> = {}
  ): Promise<void> {
    await this.log('info', eventType, message, additionalData);
  }

  public async warn(
    eventType: AuthEventType,
    message: string,
    additionalData: Partial<LogEntry> = {}
  ): Promise<void> {
    await this.log('warn', eventType, message, additionalData);
  }

  public async error(
    eventType: AuthEventType,
    message: string,
    additionalData: Partial<LogEntry> = {}
  ): Promise<void> {
    await this.log('error', eventType, message, additionalData);
  }

  // Specific logging methods for common auth events
  public async logAuthCheckStart(pathname: string, userAgent?: string): Promise<void> {
    await this.info('AUTH_CHECK_START', `Starting authentication check for route: ${pathname}`, {
      pathname,
      userAgent
    });
  }

  public async logAuthCheckComplete(
    pathname: string,
    isAuthenticated: boolean,
    userId?: string,
    userEmail?: string
  ): Promise<void> {
    await this.info('AUTH_CHECK_COMPLETE', `Authentication check completed for route: ${pathname}`, {
      pathname,
      isAuthenticated,
      userId,
      userEmail
    });
  }

  public async logAuthError(
    pathname: string,
    error: string,
    userId?: string,
    userEmail?: string
  ): Promise<void> {
    await this.error('AUTH_ERROR', `Authentication error for route: ${pathname}`, {
      pathname,
      error,
      userId,
      userEmail
    });
  }

  public async logLoginAttempt(email: string, pathname: string): Promise<void> {
    await this.info('LOGIN_ATTEMPT', `Login attempt for email: ${email}`, {
      userEmail: email,
      pathname
    });
  }

  public async logLoginSuccess(userId: string, email: string, pathname: string): Promise<void> {
    await this.info('LOGIN_SUCCESS', `Successful login for user: ${email}`, {
      userId,
      userEmail: email,
      pathname
    });
  }

  public async logLoginFailure(email: string, error: string, pathname: string): Promise<void> {
    await this.warn('LOGIN_FAILURE', `Failed login attempt for email: ${email}`, {
      userEmail: email,
      error,
      pathname
    });
  }

  public async logLogoutAttempt(userId?: string, userEmail?: string): Promise<void> {
    await this.info('LOGOUT_ATTEMPT', 'Logout attempt', {
      userId,
      userEmail
    });
  }

  public async logLogoutSuccess(userId?: string, userEmail?: string): Promise<void> {
    await this.info('LOGOUT_SUCCESS', 'Successful logout', {
      userId,
      userEmail
    });
  }

  public async logGuestAccess(pathname: string, hasGuestCookie: boolean): Promise<void> {
    await this.info('GUEST_ACCESS', `Guest access to route: ${pathname}`, {
      pathname,
      hasGuestCookie
    });
  }

  public async logProtectedRouteAccess(
    pathname: string,
    isAuthenticated: boolean,
    userId?: string,
    userEmail?: string
  ): Promise<void> {
    await this.info('PROTECTED_ROUTE_ACCESS', `Access attempt to protected route: ${pathname}`, {
      pathname,
      isAuthenticated,
      userId,
      userEmail
    });
  }

  public async logRedirect(
    fromPath: string,
    toPath: string,
    reason: string,
    userId?: string,
    userEmail?: string
  ): Promise<void> {
    await this.info('REDIRECT_PERFORMED', `Redirect from ${fromPath} to ${toPath}`, {
      pathname: fromPath,
      redirectTarget: toPath,
      reason,
      userId,
      userEmail
    });
  }

  // Method to retrieve buffered logs (for debugging purposes)
  public getBufferedLogs(): LogEntry[] {
    return [...logBuffer];
  }

  // Method to clear buffered logs
  public clearBufferedLogs(): void {
    logBuffer = [];
  }

  // Methods for tracking guest-to-authenticated user conversion
  public async logGuestConversionStart(guestId: string, email?: string): Promise<void> {
    await this.info('GUEST_CONVERSION_START', `Guest user starting conversion process`, {
      userId: guestId,
      userEmail: email
    });
  }

  public async logGuestConversionComplete(userId: string, email?: string): Promise<void> {
    await this.info('GUEST_CONVERSION_COMPLETE', `Guest user successfully converted to authenticated user`, {
      userId,
      userEmail: email
    });
  }

  public async logGuestConversionFailure(guestId: string, error: string, email?: string): Promise<void> {
    await this.warn('GUEST_CONVERSION_FAILURE', `Guest user conversion failed`, {
      userId: guestId,
      userEmail: email,
      error
    });
  }
}

// Export singleton instance
export const authLogger = new AuthLogger();

// Export types for external use
export type { LogEntry, AuthEventType, LogLevel };