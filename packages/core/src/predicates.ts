/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { OperationObject, Resource } from "./operation";
import type { FutureLike } from "./future";
import { Symbol } from "./symbol";

export function isPromise(value: any): value is PromiseLike<unknown> {
  return value && typeof(value.then) === 'function';
}

export function isGenerator(value: any): value is Iterator<unknown> {
  return value && typeof(value.next) === 'function';
}

export function isFuture<T>(value: any): value is FutureLike<T> {
  return value && typeof(value.consume) === 'function';
}

export function isResource<TOut>(value: any): value is Resource<TOut> {
  return typeof(value) === 'object' && typeof(value.init) === 'function';
}

export function isObjectOperation<TOut>(x: unknown): x is OperationObject<TOut> {
  return typeof x === 'object' && x != null && Symbol.operation in x;
}
