/**
 * A value representing either a successful outcome or an error.
 *
 * `Result<T>` is used in APIs when you want to make explicit flow control
 * decisions about success/failure rather than allowing them to
 * automatically percolate.
 *
 * A successful result has the shape `{ ok: true, value }` and a failed result
 * has the shape `{ ok: false, error }`.
 *
 * @since 4.1
 */
export type Result<T> = {
  readonly ok: true;
  value: T;
} | {
  readonly ok: false;
  error: unknown;
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
 * Construct a failed {@link Result}.
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
  return {
    ok: false,
    error: cause,
  };
}

/**
 * @ignore
 */
export function unbox<T>(result: Result<T>): T {
  if (result.ok) {
    return result.value;
  } else {
    throw result.error;
  }
}

const Unit = Object.freeze({ ok: true });
