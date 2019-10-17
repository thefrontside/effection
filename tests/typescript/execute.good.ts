import { Execution, Sequence, execute } from 'effection';

function* operation(): Sequence {}

let execution: Execution;

execution = execute(operation);

execution = execute(Promise.resolve("hello world"));

execution = execute(function*() {});

execution = execute(undefined);

execution = execute((execution: Execution<void>) => execution.resume());
