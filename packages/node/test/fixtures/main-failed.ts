import { Operation, timeout } from 'effection';
import { main } from '../../src/main';

main(function*(): Operation<void> {
  yield timeout(10);
  throw new Error('moo');
})
