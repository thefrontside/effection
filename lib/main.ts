import { createContext } from "./context.ts";
import { type Operation } from "./types.ts";
import { action } from "./instructions.ts";
import { run } from "./run.ts";

/**
 * Halt process execution immediately and initiate shutdown. If a message is
 * provided, it will be logged to the console after shutdown:
 *
 * ```js
 * if (invalidArgs()) {
 *   yield* exit(5, "invalid arguments")
 * }
 * ```
 * @param status - the exit code to use for the process exit
 * @param message - message to print to the console before exiting.
 * @param returns an operation that exits the program
 */
export function* exit(status: number, message?: string): Operation<void> {
  let escape = yield* ExitContext;
  escape({ status, message });
}

/**
 * Top-level entry point to programs written in Effection. That means that your
 * program should only call `main` once, and everything the program does is
 * handled from within `main` including an orderly shutdown. Unlike `run`, `main`
 * automatically prints errors that occurred to the console.
 *
 * Use the {@link exit} operation form within to halt program execution
 * immediately and initiate shutdown.
 *
 * The behavior of `main` is slightly different depending on the environment it
 * is running in.
 *
 * ### Deno, Node
 *
 * When running within Deno or Node, any error which reaches `main` causes the
 * entire process to exit with an exit code of `1`.
 *
 * Additionally, handlers for `SIGINT` are attached to the
 * process, so that sending an exit signal to it causes the main task
 * to become halted. This means that hitting CTRL-C on an Effection program
 * using `main` will cause an orderly shutdown and run all cleanup code.
 *
 * > Warning! do not call `Deno.exit()` on Deno or `process.exit()` on Node
 * > directly, as this will not gracefully shutdown. Instead, use the
 * > {@link exit} operation.
 *
 * ### Browser
 *
 * When running in a browser, The `main` operation gets shut down on the
 * `unload` event.
 *
 * @param body - an operation to run as the body of the program
 * @returns a promise that resolves right after the program exits
 */

export async function main(
  body: (args: string[]) => Operation<void>,
): Promise<void> {
  let hardexit = (_status: number) => {};

  let result = await run(() =>
    action<Exit>(function* (resolve) {
      // action will return shutdown immediately upon resolve, so stash
      // this function in the exit context so it can be called anywhere.
      yield* ExitContext.set(resolve);

      try {
        let interrupt = () => resolve({ status: 130, signal: "SIGINT" });
        yield* withHost({
          *deno() {
            hardexit = (status) => Deno.exit(status);
            try {
              Deno.addSignalListener("SIGINT", interrupt);
              yield* body(Deno.args.slice());
            } finally {
              Deno.removeSignalListener("SIGINT", interrupt);
            }
          },
          *node() {
            //@ts-expect-error type-checked by Deno, run on Node
            hardexit = (status) => global.process.exit(status);
            try {
              //@ts-expect-error type-checked by Deno, run on Node
              process.on("SIGINT", interrupt);
              //@ts-expect-error type-checked by Deno, run on Node
              yield* body(global.process.argv.slice(2));
            } finally {
              //@ts-expect-error this runs on Node
              process.off("SIGINT", interrupt);
            }
          },
          *browser() {
            try {
              self.addEventListener("unload", interrupt);
              yield* body([]);
            } finally {
              self.removeEventListener("unload", interrupt);
            }
          },
        });

        yield* exit(0);
      } catch (error) {
        resolve({ status: 1, error });
      }
    })
  );

  if (result.message) {
    if (result.status === 0) {
      console.log(result.message);
    } else {
      console.error(result.message);
    }
  }

  if (result.error) {
    console.error(result.error);
  }

  hardexit(result.status);
}

const ExitContext = createContext<(exit: Exit) => void>("exit");

interface Exit {
  status: number;
  message?: string;
  signal?: string;
  error?: Error;
}

interface HostOperation<T> {
  deno(): Operation<T>;
  node(): Operation<T>;
  browser(): Operation<T>;
}

function* withHost<T>(op: HostOperation<T>): Operation<T> {
  let global = globalThis as Record<string, unknown>;

  if (typeof global.Deno !== "undefined") {
    return yield* op.deno();
    // this snippet is from the node-detect npm package
  } else if (
    Object.prototype.toString.call(
      //@ts-expect-error dev env is deno, but this is safe to run.
      typeof process !== "undefined" ? process : 0,
    ) === "[object process]"
  ) {
    return yield* op.node();
  } else {
    return yield* op.browser();
  }
}
