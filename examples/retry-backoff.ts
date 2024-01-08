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
    // This is the initial operation, 
    // if it succeeds then the operation will be complete
    return yield* op();
  } catch (e) {
    // if we encounter error that we're not expecting then throw
    // and do not proceed any further
    if (!isKnownError(e)) {
      throw e;
    }
  }
  
  // we're here because we encountered a known issue,
  // we want to run the retry logic attempting up to 5 attempts
  // pause between each attempt and double the delay with each attempt
  // trigger a timeout if we reach maxDelay
  // we do this by setting up a race between retry logic and
  // the timeout. If retry logic succeeds, timeout will be halted
  // automatically. If timeout reaches the throw, it'll interrupt the
  // retry logic automatically. 

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
