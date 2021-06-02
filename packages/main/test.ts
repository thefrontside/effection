import { main } from './src/node';
import { sleep, spawn, withLabels } from '@effection/core';

class CustomError extends Error {
  name = "CustomError";
}

main(function* main() {
  yield withLabels(function*() {
    yield spawn(function*() {
      yield sleep(10);
      throw new CustomError('moo');
    }, { labels: { name: "request", path: '/foobar' } });
    yield
  }, { name: 'server' })
});
