import { run, Context, Controls, Operation } from '@effection/core';

export let World: Context & Controls;

beforeEach(() => {
  World = run(undefined) as Context & Controls;
});

afterEach(() => {
  World.halt();
})
