import { call, createContext, Operation } from 'effection';

export const CwdContext = createContext<() => string>("sys.cwd");

export function* cwd(): Operation<string> {
  let fn = yield* CwdContext;
  return fn();
}


export function withDeno<T>(op: () => Operation<T>): Operation<T> {
  return call(function*() {
    yield* CwdContext.set(Deno.cwd);
    yield* op();
  })
}
