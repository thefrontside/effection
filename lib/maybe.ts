export type Maybe<T> = {
  readonly exists: false;
} | {
  readonly exists: true;
  readonly value: T;
};

export function Just(): Maybe<void>;
export function Just<T>(value: T): Maybe<T>;
export function Just<T>(value?: T): Maybe<T | undefined> {
  if (typeof value === "undefined") {
    return { exists: true } as Maybe<T>;
  } else {
    return { exists: true, value };
  }
}

export function Nothing<T = void>(): Maybe<T> {
  return { exists: false };
}
