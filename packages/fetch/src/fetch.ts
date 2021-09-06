import { ensure, withLabels, Operation, Resource } from '@effection/core';
import { fetch as nativeFetch } from 'cross-fetch';
import { AbortController } from 'abort-controller';

export interface Fetch extends Resource<Response> {
  arrayBuffer(): Operation<ArrayBuffer>;
  blob(): Operation<Blob>;
  formData(): Operation<FormData>;
  json(): Operation<unknown>;
  text(): Operation<string>;
}

export function fetch(info: RequestInfo, requestInit: RequestInit = {}): Fetch {
  function* init() {
    let controller = new AbortController();

    yield ensure(() => { controller.abort() });

    requestInit.signal = controller.signal;

    let response: Response = yield nativeFetch(info, requestInit);
    return response;
  }

  let name = `fetch('${info}')`;
  let labels = { expand: false, method: requestInit.method || 'GET' };

  return {
    name,
    labels,
    init,
    arrayBuffer: () => withLabels(function*() {
      let response = yield { init };
      return yield response.arrayBuffer();
    }, { name: `${name}.arrayBuffer()`, ...labels }),
    blob: () => withLabels(function*() {
      let response = yield { init };
      return yield response.blob();
    }, { name: `${name}.blob()`, ...labels }),
    formData: () => withLabels(function*() {
      let response = yield { init };
      return yield response.formData();
    }, { name: `${name}.formData()`, ...labels }),
    json: () => withLabels(function*() {
      let response = yield { init };
      return yield response.json();
    }, { name: `${name}.json()`, ...labels }),
    text: () => withLabels(function*() {
      let response = yield { init };
      return yield response.text();
    }, { name: `${name}.text()`, ...labels }),
  };
}
