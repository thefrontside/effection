import { Context, Operation, main } from 'effection';

type World = Context & { spawn<T>(operation: Operation<T>): Promise<T> };

let currentWorld: World;

beforeEach(() => {
  currentWorld = main(undefined) as World;
});

afterEach(() => {
  currentWorld.halt();
});

export function spawn<T>(operation: Operation<T>): Promise<T> {
  return currentWorld.spawn(operation);
}