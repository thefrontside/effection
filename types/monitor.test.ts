import { Execution, Sequence, monitor } from 'effection';

function* operation(): Sequence {}

let execution: Execution;

execution = monitor(operation);

execution = monitor(operation());

execution = monitor(Promise.resolve("hello world"));

execution = monitor(function*() {});

execution = monitor(undefined);

execution = monitor((execution: Execution<number>) => {
  execution.id;
  execution.resume(10);
  execution.halt("optional reason");
  execution.halt();
  execution.throw(new Error('boom!'));
});

// $ExpectError
monitor(5);
