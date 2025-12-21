import { createContext } from "effection";
import type { LocalDocPage } from "../hooks/use-deno-doc.tsx";

export const DocPageContext = createContext<LocalDocPage>("doc-page");
