import { createStream, Stream } from '@effection/subscription';

export interface Listenable<TArgs extends unknown[]> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  addListener(callback: (...args: TArgs) => void): unknown;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  removeListener(callback: (...args: TArgs) => void): unknown;
}

export function listen<TArgs extends unknown[]>(source: Listenable<TArgs>): Stream<TArgs> {
  return createStream<TArgs, undefined>(function*(publish) {
    let listener = (...args: TArgs) => publish(args as TArgs);
    try {
      source.addListener(listener);
      yield;
      return undefined;
    } finally {
      source.removeListener(listener);
    }
  });
}
