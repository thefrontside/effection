export interface MainErrorOptions {
  exitCode?: number;
  message?: string;
}

export class MainError extends Error {
  name = "EffectionMainError"

  public exitCode: number;

  constructor(options: MainErrorOptions = {}) {
    super(options.message || "");
    this.exitCode = options.exitCode || -1;
  }
}

export function isMainError(error: Error): error is MainError {
  return error.name === 'EffectionMainError';
}
