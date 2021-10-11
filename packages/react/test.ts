import { sleep, main } from 'effection';

main(function*() {
  while(true) {
    yield sleep(1000);
    console.log('ping');
  }
});
