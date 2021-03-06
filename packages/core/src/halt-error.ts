export class HaltError extends Error {
  get __isEffectionHaltError() {
    return true;
  }

  constructor() {
    super("halted");
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isHaltError(value: any): value is HaltError {
  return !!(value && value.__isEffectionHaltError);
}

export function swallowHalt(error: Error) {
  if(!isHaltError(error)) {
    throw error;
  } else {
    return undefined;
  }
}
