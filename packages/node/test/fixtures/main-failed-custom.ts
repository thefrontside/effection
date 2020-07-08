import { Operation, timeout } from 'effection';
import { main } from '../../src/main';

class MyError extends Error {
  public effectionExitCode = 23;
  public effectionSilent = true;
}

main(function*(): Operation<void> {
  yield timeout(10);
  throw new MyError('moo');
})
