import { main, sleep } from 'effection';
import { runSupervisor } from '../src/index';

function *tick(name: string, value: number) {
  for(; value >= 0; value--) {
    console.log(name, value);
    yield sleep(1000);
  }

  throw new Error('boom');
}

main(runSupervisor([
  { name: 'foo', run: tick, args: ['foo', 5] },
  { name: 'bar', run: tick, args: ['bar', 3] },
], { logErrors: true }));
