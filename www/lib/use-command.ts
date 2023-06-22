import { type Operation, resource } from "effection";

export function useCommand(
  cmd: string,
  options?: Deno.CommandOptions,
): Operation<Deno.ChildProcess> {
  return resource(function* (provide) {
    let command = new Deno.Command(cmd, options);
    let process = command.spawn();
    try {
      yield* provide(process);
    } finally {
      try {
        process.kill("SIGINT");
      } catch (error) {
        // if the process already quit, then this error is expected.
        // unfortunately there is no way (I know of) to check this
        // before calling process.kill()

        if (
          !!error &&
          !error.message.includes("Child process has already terminated")
        ) {
          // deno-lint-ignore no-unsafe-finally
          throw error;
        }
      }
    }
  });
}
