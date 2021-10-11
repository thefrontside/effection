import { Operation, race, sleep } from 'effection';

export function abortAfter<T>(op: Operation<T>, ms: number): Operation<T | undefined> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return race<any>([sleep(ms), op]);
}
