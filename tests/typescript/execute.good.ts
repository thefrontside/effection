import { Execution, Sequence, fork } from 'effection';

function* operation(): Sequence {}

let execution: Execution;

execution = fork(operation);

execution = fork(operation());

execution = fork(Promise.resolve("hello world"));

execution = fork(function*() {});

execution = fork(undefined);

execution = fork((execution: Execution<void>) => execution.resume());
