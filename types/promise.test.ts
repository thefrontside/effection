import { spawn } from 'effection';

async function someAsyncFunction() {
  await spawn(function*() {
    yield
  });

  await Promise.all([
    spawn(function*() { yield }),
    spawn(function*() { yield }),
  ]);

  let someFork = spawn(function*() {
    yield
    return 123;
  });

  someFork.then((value: number) => {}, (error) => {});
  someFork.catch((error: Error) => "string").then((some) => {});
  someFork.finally(() => "string").then((some) => {});
}
