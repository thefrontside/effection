import { DebugTree } from './debug';

type TaskTreeMessage = {
  type: "tree";
  tree: DebugTree;
}

export type ClientMessage = TaskTreeMessage;
export type ServerMessage = never;

export type DebuggerEnvelope<T extends ClientMessage | ServerMessage> = {
  type: 'effection-debugger';
  payload: T;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isDebuggerEnvelope<T extends ClientMessage | ServerMessage>(message: any): message is DebuggerEnvelope<T> {
  return message && message.type === 'effection-debugger';
}
