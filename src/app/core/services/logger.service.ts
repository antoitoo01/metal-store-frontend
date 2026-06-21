import { Injectable, isDevMode } from '@angular/core';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

const LEVEL_PRIORITY: Record<LogLevel, number> = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };

const LOG_COLORS: Record<LogLevel, string> = {
  DEBUG: '#6b7280',
  INFO: '#2563eb',
  WARN: '#d97706',
  ERROR: '#dc2626',
};

@Injectable({ providedIn: 'root' })
export class Logger {
  private minLevel: LogLevel = isDevMode() ? 'DEBUG' : 'INFO';

  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  debug(context: string, message: string, ...data: unknown[]): void {
    this.log('DEBUG', context, message, data);
  }

  info(context: string, message: string, ...data: unknown[]): void {
    this.log('INFO', context, message, data);
  }

  warn(context: string, message: string, ...data: unknown[]): void {
    this.log('WARN', context, message, data);
  }

  error(context: string, message: string, ...data: unknown[]): void {
    this.log('ERROR', context, message, data);
  }

  private log(level: LogLevel, context: string, message: string, data: unknown[]): void {
    if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[this.minLevel]) return;

    const timestamp = new Date().toISOString().slice(11, 23);
    const prefix = `%c[${timestamp}] [${level}] [${context}]`;

    const consoleFn = level === 'ERROR' ? console.error
      : level === 'WARN' ? console.warn
      : level === 'INFO' ? console.info
      : console.debug;

    if (data.length > 0) {
      consoleFn(prefix, `color:${LOG_COLORS[level]};font-weight:700`, message, ...data);
    } else {
      consoleFn(prefix, `color:${LOG_COLORS[level]};font-weight:700`, message);
    }
  }
}
