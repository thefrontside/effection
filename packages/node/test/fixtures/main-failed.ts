import { Operation, sleep } from '@effection/core';
import { main } from '../../src/main';

main(function*(): Operation<void> {
  yield sleep(10);
  throw new Error('moo');
})
