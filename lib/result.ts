import type { Result } from "./types.ts";

/**
 * @ignore
 */
export const Ok = <T>(value: T): Result<T> => ({ ok: true, value });

/**
 * @ignore
 */
export const Err = <T>(error: Error): Result<T> => ({ ok: false, error });
