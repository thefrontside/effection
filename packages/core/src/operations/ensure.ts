import { Operation, Resource } from '../operation';

export function ensure<T>(fn: () => Operation<T> | void): Resource<undefined> {
  return {
    name: 'ensure',
    *init(scope) {
      scope.spawn(function*() {
        try {
          yield
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
