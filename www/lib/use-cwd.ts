import { createContext, Operation } from 'effection';

export const CwdContext = createContext("Deno.cwd", Deno.cwd());

export function* useCwd(): Operation<string> {
  const cwd = yield* CwdContext;
  return cwd;
}