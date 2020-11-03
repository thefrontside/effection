import { Operation, timeout } from 'effection';
import { main } from '../../src/main';

main(function*(): Operation<void> {
  yield timeout(10);
  throw new Error('moo');
}, (error) => {
  console.error('GOT ERROR:', error.message);
  process.exit(47);
})
