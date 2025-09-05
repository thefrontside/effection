import type { Operation } from "effection";
import { createApi } from "./context-api.ts";

export interface Logger {
  info: (message: string, ...args: unknown[]) => Operation<void>;
  debug: (message: string, ...args: unknown[]) => Operation<void>;
  warn: (message: string, ...args: unknown[]) => Operation<void>;
  error: (message: string, ...args: unknown[]) => Operation<void>;
}

export const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  gray: "\x1b[90m",
  green: "\x1b[32m",
};

const consoleLogger: Logger = {
  *info(message: string, ...args: unknown[]) {
    console.log(`${colors.blue}[INFO]${colors.reset} ${message}`, ...args);
  },
  *debug(message: string, ...args: unknown[]) {
    console.log(`${colors.gray}[DEBUG]${colors.reset} ${message}`, ...args);
  },
  *warn(message: string, ...args: unknown[]) {
    console.warn(`${colors.yellow}[WARN]${colors.reset} ${message}`, ...args);
  },
  *error(message: string, ...args: unknown[]) {
    console.error(`${colors.red}[ERROR]${colors.reset} ${message}`, ...args);
  },
};

export const loggerApi = createApi("logger", consoleLogger);
export const log = loggerApi.operations;

export function* verboseLogging(verbose: boolean) {
  yield* loggerApi.around({
    *info(args, next) {
      yield* next(...args);
    },
    *warn(args, next) {
      if (verbose) {
        yield* next(...args);
      }
    },
    *debug(args, next) {
      if (verbose) {
        yield* next(...args);
      }
    },
    *error(args, next) {
      yield* next(...args);
    },
  });
}

export function* namespace(namespace: string) {
  yield* loggerApi.around({
    *info(args, next) {
      yield* next(`[${namespace}] ${args[0]}`, ...args.slice(1));
    },
    *warn(args, next) {
      yield* next(`[${namespace}] ${args[0]}`, ...args.slice(1));
    },
    *debug(args, next) {
      yield* next(`[${namespace}] ${args[0]}`, ...args.slice(1));
    },
    *error(args, next) {
      yield* next(`[${namespace}] ${args[0]}`, ...args.slice(1));
    },
  });
}

export function* indent() {
  yield* loggerApi.around({
    *info(args, next) {
      yield* next(`   ${args[0]}`, ...args.slice(1));
    },
    *warn(args, next) {
      yield* next(`   ${args[0]}`, ...args.slice(1));
    },
    *debug(args, next) {
      yield* next(`   ${args[0]}`, ...args.slice(1));
    },
    *error(args, next) {
      yield* next(`   ${args[0]}`, ...args.slice(1));
    },
  });
}
