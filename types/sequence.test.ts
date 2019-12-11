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

  // a sequence can only yield valid operations
  // but 5 is not a valid operation
  // therefore `function*() { yield 5 }` is not
  // a valid operation.
  // $ExpectError
  yield function*() { yield 5; };

  // this is not allowed because as an operation, a
  // generator function must have no arguments
  // $ExpectError
  yield function*(one, two) {};
}

function* asynchronous(): Sequence {
  fork(sequence);
  fork(sequence());
}
