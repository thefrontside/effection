import {
  call,
  ensure,
  type Operation,
  resource,
  type Stream,
  stream,
} from "effection";
import { type KillSignal, type Options, type Output, x as $x } from "tinyexec";

/**
 * Wraps a [tinyexec](https://github.com/tinylibs/tinyexec) process.
 * To create one use the {@link x} function.
 */
export interface TinyProcess extends Operation<Output> {
  /**
   * A stream of lines coming from both stdin and stdout. The stream
   * will terminate when stdout and stderr are closed which usually
   * corresponds to the process ending.
   */
  lines: Stream<string, void>;

  /**
   * Send `signal` to this process
   * @paramu signal - the OS signal to send to the process
   */
  kill(signal?: KillSignal): Operation<void>;
}

/**
 * Run OS process with `cmd`
 *
 * This will create a {@link TinyProcess} resource. If it is still running
 * when it passes out of scope, it will be killed.
 */
export function x(
  cmd: string,
  args: string[] = [],
  options?: Partial<Options>,
): Operation<TinyProcess> {
  return resource(function* (provide) {
    let tinyexec = $x(cmd, args, { ...options });

    let promise: Promise<Output> = tinyexec as unknown as Promise<Output>;

    let output = call(() => promise);

    let tinyproc: TinyProcess = {
      *[Symbol.iterator]() {
        return yield* output;
      },
      lines: stream(tinyexec),
      *kill(signal) {
        tinyexec.kill(signal);
        yield* output;
      },
    };

    yield* ensure(function* () {
      yield* tinyproc.kill();
    });

    yield* provide(tinyproc);
  });
}
