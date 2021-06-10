import { main } from '../../src/main';

import { createServer } from 'net';

main(function*() {
  console.log(`started [${process.pid}]`);
  let server = createServer();
  try {
    server.listen();
    yield;
  } finally {
    server.close();
    console.log(`stopped [${process.pid}]`);
  }
})
