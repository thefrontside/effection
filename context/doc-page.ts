import { createContext } from "effection";
import type { DocPage } from "../hooks/use-deno-doc.tsx";

export const DocPageContext = createContext<DocPage>("doc-page");
