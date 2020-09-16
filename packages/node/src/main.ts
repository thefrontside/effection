import { main as effectionMain, Context, Operation } from 'effection';

interface MainErrorOptions {
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

export function main<T>(operation: Operation<T>): Context<T> {
  return effectionMain(({ context: mainContext, spawn }) => {
    spawn(function* main() {
      let interrupt = () => { mainContext.halt(); process.exit(); };
      let debug = () => console.debug(mainContext.toString());
      try {
        process.on('SIGINT', interrupt);
        process.on('SIGTERM', interrupt);
        process.on('SIGUSR1', debug);
        return yield operation;
      } catch(e) {
        if(e.name === 'EffectionMainError') {
          if(e.options.message) {
            console.error(e.options.message);
          }
          if(e.options.verbose) {
            console.error(e.stack);
          }
          process.exit(e.options.exitCode || -1);
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
