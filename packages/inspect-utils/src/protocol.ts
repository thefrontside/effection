import { InspectMessage } from './inspect';

export type ClientMessage = InspectMessage;
export type ServerMessage = never;

export type InspectEnvelope<T extends ClientMessage | ServerMessage> = {
  type: 'effection-inspect';
  payload: T;
}

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isInspectEnvelope<T extends ClientMessage | ServerMessage>(message: any): message is InspectEnvelope<T> {
  return message?.type === 'effection-inspect';
}
