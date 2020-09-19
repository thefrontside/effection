import { run, Task } from 'effection';

export let World: Task

beforeEach(() => {
  World = run();
});

afterEach(async () => {
  await World.halt();
})
