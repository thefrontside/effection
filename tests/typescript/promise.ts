import { fork } from 'effection';

async function someAsyncFunction() {
  await fork(function*() {
    yield
  });

  await Promise.all([
    fork(function*() { yield }),
    fork(function*() { yield }),
  ]);

  let someFork = fork(function*() {
    yield
    return 123;
  });

  someFork.then((value: number) => {}, (error) => {});
  someFork.catch((error: Error) => "string").then((some: string) => {});
  someFork.finally(() => "string").then((some: number) => {});
}
