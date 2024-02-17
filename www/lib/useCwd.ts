import { createContext, Operation } from 'effection';

export const CwdContext = createContext<() => string>("sys.cwd");

export function* useCwd(): Operation<string> {
  let fn = yield* CwdContext;
  return fn();
}