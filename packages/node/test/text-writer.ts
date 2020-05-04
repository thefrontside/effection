import { Operation } from 'effection';
import { main } from '../src/main';

import { createServer } from 'net';

main(function*(): Operation<void> {
  console.log('started');
  let server = createServer();
  try {
    server.listen();
    yield;
  } finally {
    server.close();
    console.log('stopped');
  }
})
