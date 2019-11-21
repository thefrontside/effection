import { fork } from 'effection';

async function someAsyncFunction() {
  await fork(function*() {
    yield
  });

  await Promise.all([
    fork(function*() { yield }),
    fork(function*() { yield }),
  ]);
}
