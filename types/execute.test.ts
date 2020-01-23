import { Context, Sequence, spawn, fork } from 'effection';

function* operation(): Sequence {}

let execution: Context;

execution = spawn(fork(operation));

execution = spawn(operation());

execution = spawn(Promise.resolve("hello world"));

execution = spawn(function*() {});

execution = spawn(undefined);

execution = spawn(({ resume, fail, ensure, context }) => {
  context.id;
  resume(10);
  context.halt();
  ensure((context?: Context) => console.log('done'));
  fail(new Error('boom!'));
});

// $ExpectError
fork(5);
