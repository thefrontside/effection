/**
 * A value representing either a successful outcome or an error.
 *
 * `Result<T>` is used in APIs when you want to make explicit flow control
 * decisions about success/failure rather than allowing them to
 * automatically percolate.
 *
 * A successful result has the shape `{ ok: true, value }` and a failed result
 * has the shape `{ ok: false, error }`. Failed results created by Effection also
 * expose `cause` as an alias for `error`.
 *
 * @since 4.1
 */
export type Result<T> = {
  readonly ok: true;
  value: T;
} | {
  readonly ok: false;
  /**
   * Read-only alias for `error`. Optional to accept existing hand-written results.
   */
  readonly cause?: Error;
  /** @deprecated Use `cause` instead. */
  error: Error;
};

/**
 * Construct a successful {@link Result}.
 *
 * ### Example
 *
 * ```javascript
 * import { Ok } from 'effection';
 *
 * let result = Ok("hello");
 * // { ok: true, value: "hello" }
 * ```
 *
 * @since 4.1
 */
export function Ok(): Result<void>;
export function Ok<T>(value: T): Result<T>;
export function Ok<T>(value?: T): Result<T | undefined> {
  if (typeof value === "undefined") {
    return Unit as Result<T>;
  }
  return { ok: true, value };
}

/**
 * Construct a failed {@link Result} with `cause` and `error` referring to the
 * same Error. The `cause` alias is non-enumerable to preserve the v4 object shape.
 *
 * ### Example
 *
 * ```javascript
 * import { Err } from 'effection';
 *
 * let result = Err(new Error("oh no"));
 * // { ok: false, error: Error("oh no") }
 * ```
 *
 * @since 4.1
 */
export function Err<T>(cause: unknown): Result<T> {
  let result: Result<T> = {
    ok: false,
    error: cause instanceof Error
      ? cause
      : new ThrownValueError(String(cause), { cause }),
  };
  return Object.defineProperty(result, "cause", {
    configurable: true,
    get() {
      return result.error;
    },
  });
}

class ThrownValueError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ThrownValueError";
  }
}

/**
 * @ignore
 */
export function unbox<T>(result: Result<T>): T {
  if (result.ok) {
    return result.value;
  } else {
    throw result.error instanceof ThrownValueError
      ? result.error.cause
      : result.error;
  }
}

const Unit = Object.freeze({ ok: true });
