import { createContext } from "effection";
import type { Repository } from "../resources/repository.ts";

export const ContribRepositoryContext = createContext<Repository>("contrib-repository");
export const LibraryRepositoryContext = createContext<Repository>("library-repository");