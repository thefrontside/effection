import type { Channel, Operation } from "./types.ts";
import { createContext } from "./context.ts";
import { createChannel } from "./channel.ts";
import { getframe } from "./instructions.ts";

export const LogContext = createContext<Channel<LogMessage, void>>(
  "log",
  createChannel<LogMessage, void>(),
);

export function* info(message: string): Operation<void> {
  let { input } = yield* LogContext;

  let { id } = yield* getframe();

  yield* input.send({ message, level: "info", taskId: String(id) });
}

export function log(message: string): Operation<void> {
  return info(message);
}

export interface LogMessage {
  taskId: string;
  level: string;
  message: string;
}
