import { run as effectionRun, Task, Operation } from 'effection';

export let World: Task<unknown>;

beforeEach(() => {
  World = effectionRun();
});

afterEach(async () => {
  if(World.state === "errored") {
    await World.then(null, (error) => console.error(error));
  }
  await World.halt();
})

export function run<T>(operation?: Operation<T>): Task<T> {
  return World?.spawn(operation);
}
