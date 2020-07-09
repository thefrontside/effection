import { main as effectionMain, Context, Operation } from 'effection';

interface MainErrorOptions {
  exitCode?: number;
  silent?: boolean;
  message?: string;
}

export class MainError extends Error {
  name = "EffectionMainError"

  public exitCode: number;
  public silent: boolean;

  constructor(options: MainErrorOptions = {}) {
    super(options.message || "error");
    this.exitCode = options.exitCode || -1;
    this.silent = options.silent || false;
  }
}

export function main<T>(operation: Operation<T>): Context<T> {
  return effectionMain(({ context: mainContext, spawn }) => {
    spawn(function* main() {
      let interrupt = () => { mainContext.halt(); };
      let debug = () => console.debug(mainContext.toString());
      try {
        process.on('SIGINT', interrupt);
        process.on('SIGTERM', interrupt);
        process.on('SIGUSR1', debug);
        return yield operation;
      } catch(e) {
        if(e.name === 'EffectionMainError') {
          if(!e.silent) {
            console.error(e);
          }
          process.exit(e.exitCode);
        } else {
          console.error(e);
          process.exit(-1);
        }
      } finally {
        process.off('SIGINT', interrupt);
        process.off('SIGTERM', interrupt);
        process.off('SIGUSR1', debug);
      }
    });
  });
}
