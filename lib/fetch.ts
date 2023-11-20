import { useAbortSignal } from "./abort-signal.ts";
import { action } from './instructions.ts';
import { call } from './call.ts';

export function createFetchOperation(fetchFn: typeof fetch) {
  return function* fetchOperation(
    input: RequestInfo | URL,
    init?: Omit<RequestInit, "signal">,
  ) {
    return yield* action<Response>(function* (resolve, reject) {
      const signal = yield* useAbortSignal();

      try {
        let result = yield* call(
          fetchFn(input, {
            ...(init ?? {}),
            signal,
          }),
        );
        resolve(result);
      } catch (e) {
        reject(e);
      }

    });
  };
}
