import type { Operation } from "../mod.ts";

export class CustomError extends Error {
  public _tag: string;

  constructor(_tag: string) {
    super(_tag);
    this._tag = _tag;
  }
}

const KNOWN_ERRORS = ["LockTimeout", "ConflictDetected", "TransactionNotFound"];

export function* retryBackoffExample(
  op: () => Operation<void>,
  { maxRetries = 5 } = {},
) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      yield* op();
    } catch (e) {
      if (e._tag && KNOWN_ERRORS.includes(e._tag)) {
        if (attempt + 1 === maxRetries) {
          throw e;
        }
        continue;
      }
      throw e;
    }
  }
}
