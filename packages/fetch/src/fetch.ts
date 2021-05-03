import { Task, Operation, Resource } from '@effection/core';
import { fetch as nativeFetch } from 'cross-fetch';
import { AbortController } from 'abort-controller';

export interface Fetch extends Resource<Response> {
  arrayBuffer(): Operation<ArrayBuffer>,
  blob(): Operation<Blob>,
  formData(): Operation<FormData>,
  json(): Operation<unknown>,
  text(): Operation<string>,
}

export function fetch(info: RequestInfo, requestInit: RequestInit = {}): Fetch {
  let init = function*(scope: Task) {
    let controller = new AbortController();

    scope.spawn(function*() {
      try {
        yield;
      } finally {
        controller.abort();
      }
    });

    requestInit.signal = controller.signal;

    let response = yield nativeFetch(info, requestInit);
    return response;
  };

  return {
    init,
    arrayBuffer: function*() {
      let response = yield { init };
      return yield response.arrayBuffer();
    },
    blob: function*() {
      let response = yield { init };
      return yield response.blob();
    },
    formData: function*() {
      let response = yield { init };
      return yield response.formData();
    },
    json: function*() {
      let response = yield { init };
      return yield response.json();
    },
    text: function*() {
      let response = yield { init };
      return yield response.text();
    },
  };
}
