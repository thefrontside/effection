import { run, Context, Controls, Operation } from 'effection';

export let World: Context & Controls;

beforeEach(() => {
  World = run(undefined) as Context & Controls;
});

afterEach(() => {
  if(World.state === "errored") {
    console.error(World.result);
  }
  World.halt();
})

export async function spawn<T>(operation: Operation<T>): Promise<T> {
  return World?.spawn(operation);
}
