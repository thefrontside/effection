import { sleep } from '@effection/core';
import { main } from '../../src/main';

main(function*() {
  yield sleep(10);
  throw new Error('moo');
})
