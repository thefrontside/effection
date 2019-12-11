import { enter } from 'effection';

async function someAsyncFunction() {
  await enter(function*() {
    yield
  });

  await Promise.all([
    enter(function*() { yield }),
    enter(function*() { yield }),
  ]);

  let someFork = enter<number>(function*() {
    yield
    return 123;
  });

  someFork.then((value: number) => {}, (error) => {});
  someFork.catch((error: Error) => "string").then((some) => {});
  someFork.finally(() => "string").then((some) => {});
}
