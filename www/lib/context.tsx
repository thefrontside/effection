import { createContext } from "effection";

export const DocsContext = createContext<boolean>("docs", false);

export function* useDocs() {
  return yield* DocsContext;
}