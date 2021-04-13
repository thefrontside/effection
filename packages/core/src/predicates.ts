/* eslint-disable @typescript-eslint/no-explicit-any */

import { OperationResolution } from "./operation";

export function isPromise(value: any): value is PromiseLike<unknown> {
  return value && typeof(value.then) === 'function';
}

export function isGenerator(value: any): value is Iterator<unknown> {
  return value && typeof(value.next) === 'function';
}

export function isResolution<T>(value: any): value is OperationResolution<T> {
  return value && typeof(value.perform) === 'function';
}
