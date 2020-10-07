export function deprecated<F extends Function>(message: string, fn: F): F {
  let impl: F = function(this: unknown, ...args: unknown[]) {
    try {
      throw new Error('trace');
    } catch (trace) {
      let [ line ] = trace.stack.split("\n").slice(3,4)
      console.warn(message, "\n" + line);
    }
    impl = fn;
    return fn.call(this, ...args);
  } as unknown as F;

  return function(this: unknown, ...args: unknown[]) {
    return impl.call(this, ...args);
  } as unknown as F;
}
