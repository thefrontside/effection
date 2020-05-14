import { main, Context, Controls, Operation } from 'effection';

export let World: Context & Controls;

beforeEach(() => {
  World = main(undefined) as Context & Controls;
});

afterEach(() => {
  World.halt();
})
