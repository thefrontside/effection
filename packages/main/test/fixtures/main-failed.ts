import { sleep } from '@effection/core';
import { main } from '../../src/node';

main(function*() {
  yield sleep(10);
  throw new Error('moo');
})
