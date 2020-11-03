export function deprecated(message, fn) {
  let impl = function(...args) {
    try {
      throw new Error('trace');
    } catch (trace) {
      let [ line ] = trace.stack.split("\n").slice(3,4);
      console.warn(message, "\n" + line); // eslint-disable-line no-console
    }
    impl = fn;
    return fn.call(this, ...args);
  };

  return function(...args) {
    return impl.call(this, ...args);
  };
}
