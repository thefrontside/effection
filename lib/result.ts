/**
 * @ignore
 * @since effection-v3.0.0
 */
export type Result<T> = {
  readonly ok: true;
  value: T;
} | {
  readonly ok: false;
  error: Error;
};

/**
 * @ignore
 * @since effection-v3.0.0
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
 * @ignore
 */
export const Err = <T>(error: Error): Result<T> => ({ ok: false, error });

/**
 * @ignore
 * @since effection-v3.0.0
 */
export function unbox<T>(result: Result<T>): T {
  if (result.ok) {
    return result.value;
  } else {
    throw result.error;
  }
}
