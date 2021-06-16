import { HasEffectionTrace } from '@effection/core';
import { isMainError } from './error';
import chalk from 'chalk';
import { parse as parseStackTrace } from 'stacktrace-parser';

export function formatName(error: Error): string {
  return chalk.bgRed.white.bold(error.name);
}

export function formatMessage(error: Error): string {
  return error.message;
}

export function formatEffection(error: Error & Partial<HasEffectionTrace>): string | undefined {
  if(error.effectionTrace) {
    let stack = error.effectionTrace.map((task) => {
      let labels = Object.entries(task.labels).filter(([key]) => key !== 'name').map(([key, value]) => {
        return `${key}=${chalk.bold(value)}`;
      });

      return [
        chalk.grey('  -'),
        chalk.yellow(task.labels.name || 'task'),
        ...labels,
        chalk.grey(task.type),
        chalk.grey(`[${task.id}]`),
      ].join(' ');
    });
    return chalk.whiteBright.bold("Effection:\n") + stack.join('\n');
  }
}

export function formatStack(error: Error): string | undefined {
  if(error.stack) {
    let stack = parseStackTrace(error.stack).map((item) => {
      return [
        chalk.grey('  -'),
        item.methodName && chalk.cyan(item.methodName),
        item.file && chalk.grey(`${item.file}:${item.lineNumber}:${item.column}`),
      ].filter(Boolean).join(' ');
    });
    return chalk.whiteBright.bold("Stacktrace:\n") + stack.join('\n');
  }
}

export function formatError(error: Error): string {
  if(isMainError(error)) {
    return [
      error.message && formatMessage(error),
    ].filter(Boolean).join('\n\n');
  } else {
    return [
      formatName(error),
      formatMessage(error),
      formatEffection(error),
      formatStack(error),
    ].filter(Boolean).join('\n\n');
  }
}
