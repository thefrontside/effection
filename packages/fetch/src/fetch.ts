import { AbortSignal, createAbortSignal, withLabels, Operation, Resource } from '@effection/core';
import { fetch as nativeFetch } from 'cross-fetch';

/**
 * A resource that can be used to create an HTTP request. This is the return
 * value of [[fetch]]. It also contains helper methods for performing common
 * requests.
 */
export interface Fetch extends Resource<Response> {
  /**
   * An operation that executes the request and produces an
   * [ArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer)
   * representation of the response body.
   */
  arrayBuffer(): Operation<ArrayBuffer>;

  /**
   * An operation that executes the request and produces a
   * [Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob)
   * representation of the response body.
   */
  blob(): Operation<Blob>;

  /**
   * An operation that executes the request and produces a
   * [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
   * representation of the response body.
   */
  formData(): Operation<FormData>;

  /**
   * An operation that executes the request and produces the response body
   * parsed as JSON.
   */
  json(): Operation<unknown>;

  /**
   * An operation that executes the request and produces the raw text of the
   * response body
   */
  text(): Operation<string>;
}

/**
 * Retrieve network content with a superset of the
 * [W3C fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
 * that can be used as a drop-in, effection-enabled replacement:
 *
 * ```ts
 * let response = yield fetch('https://example.com/movies.json');
 * if (!response.ok) {
 *   throw new Error(`unable to fetch movies: ${response.status}`);
 * }
 * let json = yield response.json();
 * ```
 *
 * The [[Fetch]] resource also has shortcut methods that return data operations
 * allowing you to handle the entire request cycle in a single line. For
 * example, the following will execute a request, read it fully, and parse it
 * as JSON. An exception is raised if the response is not in the 200 range.
 *
 * ```ts
 * let json = yield fetch('https://example.com/movies.json').json();
 *```
 *
 * Like most operations in Effection, [[fetch]] is stateless, and does not
 * actually _do_ anything unless it is yielded to:
 *
 * ```ts
 * // nothing happens here except describing the requests
 * let movies = fetch('https://example.com/movies.json');
 * let getJSON = movies.json();
 * let getText = movies.text();
 *
 * // Actually run operations. This will create three separate HTTP requests
 * let response = yield movies;
 * let json = yield getJSON;
 * let text = yield getText;
 *```
 *
 * In all cases the underlying HTTP request will be canceled gracefully if
 * the current task goes away.
 *
 * @param info same as the first argument to the [W3C API](https://developer.mozilla.org/en-US/docs/Web/API/fetch#parameters)
 * @param requestInit same as the (optional) second argument to the [W3C API](https://developer.mozilla.org/en-US/docs/Web/API/fetch#parameters)
 * @returns a resource binding to a [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response)
 * object
 */
export function fetch(info: RequestInfo, requestInit: RequestInit = {}): Fetch {
  function* init() {
    let signal: AbortSignal = yield createAbortSignal();
    requestInit.signal = signal;
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
