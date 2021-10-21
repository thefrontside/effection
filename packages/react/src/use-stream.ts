import { useState } from 'react';
import { Stream } from 'effection';
import { useOperation } from './use-operation';

export function useStream<T>(stream: Stream<T>): T | undefined;
export function useStream<T>(stream: Stream<T>, initial: T): T;
export function useStream<T>(stream: Stream<T>, initial?: T): T | undefined {
  let [state, setState] = useState<T | undefined>(initial);
  useOperation(stream.forEach(function*(value) { setState(value) }), [stream]);
  return state;
}
