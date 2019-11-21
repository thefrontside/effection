import { Sequence, fork } from 'effection';

function* sequence(): Sequence {
  //bare generator function is ok
  let value: number = yield function*() { return 5; }

  // you can always yield undefined;
  yield;

  // other Operation also ok.
  yield sequence

  // can yield to forks
  yield fork(function*() { yield });
}

function* asynchronous(): Sequence {
  fork(sequence);
  fork(sequence());
}
