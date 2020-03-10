import { main } from 'effection';

async function someAsyncFunction() {
  await main(function*() {
    yield
  });

  await Promise.all([
    main(function*() { yield }),
    main(function*() { yield }),
  ]);

  let someFork = main(function*() {
    yield
    return 123;
  });

  someFork.then((value: number) => {}, (error) => {});
  someFork.catch((error: Error) => "string").then((some) => {});
  someFork.finally(() => "string").then((some) => {});

  // promise has type of the generator function
  // $ExpectError
  let broken: string = await main(function*() {
    yield
    return 123;
  });
}
