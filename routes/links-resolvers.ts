import { DocPage } from "../hooks/use-deno-doc.tsx";

function createAPIReferenceLinkResolver(version: string) {
  return function* (doc: DocPage) {
    return `/api/${version}/${doc.name}`;
  };
}

export const v3Links = createAPIReferenceLinkResolver("v3");
export const v4Links = createAPIReferenceLinkResolver("v4");