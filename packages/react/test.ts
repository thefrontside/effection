import { sleep } from '@effection/core';
import { main } from '@effection/main';

main(function*() {
  while(true) {
    yield sleep(1000);
    console.log('ping');
  }
});
