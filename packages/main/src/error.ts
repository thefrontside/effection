export interface MainErrorOptions {
  exitCode?: number;
  verbose?: boolean;
  message?: string;
}

export class MainError extends Error {
  name = "EffectionMainError"

  constructor(public options: MainErrorOptions = {}) {
    super(options.message || "error");
  }
}
