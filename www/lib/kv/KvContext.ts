import { createContext } from "effection";

export const KvContext = createContext<Deno.Kv>("Deno.Kv");
