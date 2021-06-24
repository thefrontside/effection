import { InspectTree } from './inspect';

type TaskTreeMessage = {
  type: "tree";
  tree: InspectTree;
}

export type ClientMessage = TaskTreeMessage;
export type ServerMessage = never;

export type InspectEnvelope<T extends ClientMessage | ServerMessage> = {
  type: 'effection-inspect';
  payload: T;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isInspectEnvelope<T extends ClientMessage | ServerMessage>(message: any): message is InspectEnvelope<T> {
  return message && message.type === 'effection-inspect';
}
