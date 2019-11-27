import { Execution, Sequence, fork } from 'effection';

function* operation(): Sequence {}

let execution: Execution;

execution = fork(operation);

execution = fork(operation());

execution = fork(Promise.resolve("hello world"));

execution = fork(function*() {});

execution = fork(undefined);

execution = fork((execution: Execution<number>) => {
  execution.id;
  execution.resume(10);
  execution.halt("optional reason");
  execution.halt();
  execution.throw(new Error('boom!'));
  execution.send({ some: "message" });
  execution.send("message");
  execution.atExit(() => {});
});

// $ExpectError
fork(5);
