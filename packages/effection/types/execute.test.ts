import { Context, Sequence, run, fork } from 'effection';

function* operation(): Sequence {}

let execution: Context;

execution = run(fork(operation));

execution = run(operation());

execution = run(Promise.resolve("hello world"));

execution = run(function*() {});

execution = run(undefined);

execution = run(({ resume, fail, ensure, context }) => {
  context.id;
  resume(10);
  resume();
  context.halt();
  ensure((context?: Context) => console.log('done'));
  fail(new Error('boom!'));
});

// $ExpectError
fork(5);
