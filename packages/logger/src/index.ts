import pino from "pino";
import { loadLoggerEnv } from "./env";

export type Logger = {
  info(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  debug(message: string, context?: Record<string, unknown>): void;
  trace(msg: string, data?: Record<string, unknown>): void;
  fatal(msg: string, data?: Record<string, unknown>): void;
  child(bindings: Record<string, unknown>): Logger;
};

function wrapPino(base: pino.Logger): Logger {
  return {
    info(msg: string, data?: Record<string, unknown>): void {
      if (data) {
        base.info(data, msg);
      } else {
        base.info(msg);
      }
    },
    error(msg: string, data?: Record<string, unknown>): void {
      if (data) {
        base.error(data, msg);
      } else {
        base.error(msg);
      }
    },
    warn(msg: string, data?: Record<string, unknown>): void {
      if (data) {
        base.warn(data, msg);
      } else {
        base.warn(msg);
      }
    },
    debug(msg: string, data?: Record<string, unknown>): void {
      if (data) {
        base.debug(data, msg);
      } else {
        base.debug(msg);
      }
    },
    trace(msg: string, data?: Record<string, unknown>): void {
      if (data) {
        base.trace(data, msg);
      } else {
        base.trace(msg);
      }
    },
    fatal(msg: string, data?: Record<string, unknown>): void {
      if (data) {
        base.fatal(data, msg);
      } else {
        base.fatal(msg);
      }
    },
    child(bindings: Record<string, unknown>): Logger {
      return wrapPino(base.child(bindings));
    },
  };
}

export function createLogger(name: string): Logger {
  const env = loadLoggerEnv();
  const isDev = env.NODE_ENV !== "production";
  const level = env.LOG_LEVEL ?? (isDev ? "debug" : "info");

  const base = pino({
    name,
    level,
    ...(isDev
      ? {
          transport: {
            target: "pino-pretty",
            options: {
              colorize: true,
              translateTime: "SYS:standard",
              ignore: "pid,hostname",
            },
          },
        }
      : {}),
  });

  return wrapPino(base);
}
