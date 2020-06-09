import { Operation } from 'effection';
import { fetch as nativeFetch } from 'cross-fetch';
import { AbortController } from 'abort-controller';

export function* fetch(resource: RequestInfo, init: RequestInit = {}): Operation<Response> {
  let controller = new AbortController();
  init.signal = controller.signal;
  try {
    return yield nativeFetch(resource, init);
  } finally {
    controller.abort();
  }
}
