import { Operation, Resource } from '../operation';
import { spawn } from './spawn';


export function ensure<T>(fn: () => Operation<T> | void): Resource<undefined> {
  return {
    name: 'ensure',
    *init() {
      yield spawn(function*() {
        try {
          yield;
        } finally {
          let result = fn();
          if(result) {
            yield result;
          }
        }
      }, { labels: { name: 'ensureHandler' } });
      return undefined;
    }
  };
}
