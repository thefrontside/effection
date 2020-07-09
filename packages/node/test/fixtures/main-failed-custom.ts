import { Operation, timeout } from 'effection';
import { main, MainError } from '../../src/main';

main(function*(): Operation<void> {
  yield timeout(10);
  throw new MainError({ exitCode: 23, silent: true });
})
