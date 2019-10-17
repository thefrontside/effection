import { Sequence } from 'effection';

function* sequence(): Sequence {
  // a sequence can only yield valid operations
  // but 5 is not a valid operation
  // therefore `function*() { yield 5 }` is not
  // a valid operation.
  yield function*() { yield 5; };
}
