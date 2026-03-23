import { config } from '../config';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const levels: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

const currentLevel = levels[config.logging.level as LogLevel] ?? 0;

const timestamp = () => new Date().toISOString();

const format = (level: string, message: string, ...args: any[]) => {
  const prefix = `[${timestamp()}] [${level.toUpperCase()}]`;
  if (args.length > 0) {
    console.log(prefix, message, ...args);
  } else {
    console.log(prefix, message);
  }
};

export const logger = {
  debug: (message: string, ...args: any[]) => {
    if (currentLevel <= levels.debug) format('debug', message, ...args);
  },
  info: (message: string, ...args: any[]) => {
    if (currentLevel <= levels.info) format('info', message, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    if (currentLevel <= levels.warn) format('warn', message, ...args);
  },
  error: (message: string, ...args: any[]) => {
    if (currentLevel <= levels.error) format('error', message, ...args);
  },
  socket: (event: string, data?: any) => {
    if (currentLevel <= levels.debug) {
      format('socket', `[${event}]`, data ?? '');
    }
  },
  request: (method: string, url: string, status: number, duration: number) => {
    if (currentLevel <= levels.info) {
      format('request', `${method} ${url} ${status} ${duration}ms`);
    }
  },
};
