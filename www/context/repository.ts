import { createContext } from "effection";
import type { Repository } from "../resources/repository.ts";

export const XRepositoryContext = createContext<Repository>(
  "x-repository",
);
export const LibraryRepositoryContext = createContext<Repository>(
  "library-repository",
);
