import { type Operation, race, sleep } from "../mod.ts";

export class CustomError extends Error {
  public _tag: string;

  constructor(_tag: string) {
    super(_tag);
    this._tag = _tag;
  }
}

const isKnownError = (e: Error): e is CustomError =>
  !!((e as CustomError)._tag) &&
  ["LockTimeout", "ConflictDetected", "TransactionNotFound"].includes(
    (e as CustomError)._tag,
  );

export function* retryBackoffExample<T>(
  op: () => Operation<T>,
  { attempts = 5, startDelay = 5, maxDelay = 200 } = {},
): Operation<T | undefined> {
  try {
    return yield* op();
  } catch (e) {
    if (!isKnownError(e)) {
      throw e;
    }
  }
  
  let lastError: Error;
  function* retry() {
    let delay = startDelay;
    for (let attempt = 0; attempt < attempts; attempt++) {
      yield* sleep(delay);
      delay = delay * 2;

      try {
        return yield* op();
      } catch (e) {
        if (isKnownError(e)) {
          lastError = e;
          if (attempt + 1 < attempts) {
            continue;
          }
        }
        throw e;
      }
    }
  }

  function* timeout(): Operation<undefined> {
    yield* sleep(maxDelay);

    throw lastError || new Error('Timeout');
  }

  return yield* race([retry(), timeout()]);
}
