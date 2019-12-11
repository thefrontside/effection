import { Context, Sequence, enter, fork } from 'effection';

function* operation(): Sequence {}

let execution: Context;

execution = enter(fork(operation));

execution = enter(operation());

execution = enter(Promise.resolve("hello world"));

execution = enter(function*() {});

execution = enter(undefined);

execution = enter(({ resume, fail, ensure, context }) => {
  context.id;
  resume(10);
  context.halt();
  ensure((c: Context) => console.log('done'));
  fail(new Error('boom!'));
});

// $ExpectError
fork(5);
