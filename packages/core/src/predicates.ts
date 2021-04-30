/* eslint-disable @typescript-eslint/no-explicit-any */

import { OperationResolution, Resource } from "./operation";

export function isPromise(value: any): value is PromiseLike<unknown> {
  return value && typeof(value.then) === 'function';
}

export function isGenerator(value: any): value is Iterator<unknown> {
  return value && typeof(value.next) === 'function';
}

export function isResolution<T>(value: any): value is OperationResolution<T> {
  return value && typeof(value.perform) === 'function';
}

export function isResource<TOut>(value: any): value is Resource<TOut> {
  return typeof(value) === 'object' && typeof(value.init) === 'function';
}
