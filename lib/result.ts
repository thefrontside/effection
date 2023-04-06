import type { Result } from "./types.ts";

export const Ok = <T>(value: T): Result<T> => ({ ok: true, value });
export const Err = <T>(error: Error): Result<T> => ({ ok: false, error });
