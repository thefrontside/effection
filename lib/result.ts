/**
 * @ignore
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
