import { sleep } from 'effection';
import { main } from '../../src/main';

main(function*() {
  yield sleep(10);
  throw new Error('moo');
})
