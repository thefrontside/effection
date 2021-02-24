import { Operation, sleep } from '@effection/core';
import { main, MainError } from '../../src/main';

main(function*(): Operation<void> {
  yield sleep(10);
  throw new MainError({ exitCode: 23, message: 'It all went horribly wrong' });
})
