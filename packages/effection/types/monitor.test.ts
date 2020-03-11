import { Operation, Sequence, monitor } from 'effection';

function* sequence(): Sequence {}

let operation: Operation;

operation = monitor(sequence);

operation = monitor(sequence());

operation = monitor(Promise.resolve("hello world"));

operation = monitor(function*() {});

operation = monitor(undefined);

operation = monitor(({ resume }) => {
  resume(10);
});

// $ExpectError
monitor(5);
