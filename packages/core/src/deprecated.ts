/**
 * @hidden
 */
export function deprecated<TThis, TArgs extends unknown[], TReturn>(message: string, fn: (this: TThis, ...args: TArgs) => TReturn): (this: TThis, ...args: TArgs) => TReturn {
  return function(...args) {
    try {
      throw new Error('trace');
    } catch (trace) {
      let [ line ] = trace.stack.split("\n").slice(3,4);
      console.warn(message, "\n" + line); // eslint-disable-line no-console
    }
    return fn.call(this, ...args);
  };
}
