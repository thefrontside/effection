/**
 * A value representing either a successful outcome or an error.
 *
 * `Result<T>` is used in APIs when you want to preserve both successes and
 * failures instead of short-circuiting on the first error.
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
    return { ok: true } as Result<T>;
  }
  return ({ ok: true, value });
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
export const Err = <T>(cause: unknown): Result<T> => ({
  ok: false,
  error: toError(cause),
});

class ThrowValueError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ThrowValueError";
  }
}

function toError(cause: unknown): Error {
  if (cause instanceof Error) {
    return cause;
  }
  return new ThrowValueError(String(cause), { cause });
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
