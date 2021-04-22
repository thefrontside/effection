import { Task, Operation } from '@effection/core';
import { fetch as nativeFetch } from 'cross-fetch';
import { AbortController } from 'abort-controller';

export function fetch(scope: Task, info: RequestInfo, init: RequestInit = {}): Operation<Response> {
  return function*() {
    let controller = new AbortController();

    scope.spawn(function*() {
      try {
        yield;
      } finally {
        controller.abort();
      }
    });

    init.signal = controller.signal;

    return yield nativeFetch(info, init);
  }
};
