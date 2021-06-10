/* eslint-disable @typescript-eslint/no-explicit-any */

import type { OperationResolution, Resource } from "./operation";
import type { FutureLike } from "./future";

export function isPromise(value: any): value is PromiseLike<unknown> {
  return value && typeof(value.then) === 'function';
}

export function isGenerator(value: any): value is Iterator<unknown> {
  return value && typeof(value.next) === 'function';
}

export function isResolution<T>(value: any): value is OperationResolution<T> {
  return value && typeof(value.perform) === 'function';
}

export function isFuture<T>(value: any): value is FutureLike<T> {
  return value && typeof(value.consume) === 'function';
}

export function isResource<TOut>(value: any): value is Resource<TOut> {
  return typeof(value) === 'object' && typeof(value.init) === 'function';
}
