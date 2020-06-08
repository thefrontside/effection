import { Operation } from 'effection';
import {
  fetch as nativeFetch,
  AbortController,
  RequestInfo,
  RequestInit,
  Response
} from './native-fetch';

export { AbortController, RequestInfo, RequestInit, Response };

export function* fetch(resource: RequestInfo, init: RequestInit = {}): Operation<Response> {
  let controller = new AbortController();
  init.signal = controller.signal;
  try {
    return yield nativeFetch(resource, init);
  } finally {
    controller.abort();
  }
}
