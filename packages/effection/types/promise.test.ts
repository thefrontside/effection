import { run } from 'effection';

async function someAsyncFunction() {
  await run(function*() {
    yield
  });

  await Promise.all([
    run(function*() { yield }),
    run(function*() { yield }),
  ]);

  let someFork = run(function*() {
    yield
    return 123;
  });

  someFork.then((value: number) => {}, (error) => {});
  someFork.catch((error: Error) => "string").then((some) => {});
  someFork.finally(() => "string").then((some) => {});

  // promise has type of the generator function
  // $ExpectError
  let broken: string = await run(function*() {
    yield
    return 123;
  });
}
