import { createContext, Operation } from 'effection';

export const EnvContext = createContext<Deno.Env>("sys.env")

export function* useEnv(): Operation<Deno.Env> {
  return yield* EnvContext;
}