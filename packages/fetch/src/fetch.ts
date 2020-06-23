import { Operation, resource } from 'effection';
import { fetch as nativeFetch } from 'cross-fetch';
import { AbortController } from 'abort-controller';

export function* fetch(info: RequestInfo, init: RequestInit = {}): Operation<Response> {
  let controller = new AbortController();
  init.signal = controller.signal;
  let response: Response | undefined;
  try {
    response = yield nativeFetch(info, init);
    return yield resource(response as Response, function*() {
      try {
        yield;
      } finally {
        controller.abort();
      }
    });
  } finally {
    if (!response) {
      controller.abort();
    }
  }
}
