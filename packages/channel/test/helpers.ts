import { run, Context, Controls, Operation } from 'effection';

export let World: Context & Controls;

beforeEach(() => {
  World = run(undefined) as Context & Controls;
});

afterEach(() => {
  World.halt();
})
