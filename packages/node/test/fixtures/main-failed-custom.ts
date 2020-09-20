import { run, sleep } from 'effection';
import { main, MainError } from '../../src/main';

run(function*() {
  yield function*() {
    console.log("before sleep");
    yield sleep(200);
    console.log("after sleep");
    throw new Error("moo");
    // throw new MainError({ exitCode: 23, message: 'It all went horribly wrong' });
    console.log("after throw");
  }
}).then(null, (err) => console.error(err));
