import { Context, Sequence, main, fork } from 'effection';

function* operation(): Sequence {}

let execution: Context;

execution = main(fork(operation));

execution = main(operation());

execution = main(Promise.resolve("hello world"));

execution = main(function*() {});

execution = main(undefined);

execution = main(({ resume, fail, ensure, context }) => {
  context.id;
  resume(10);
  context.halt();
  ensure((context?: Context) => console.log('done'));
  fail(new Error('boom!'));
});

// $ExpectError
fork(5);
