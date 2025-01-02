import { call, type Operation } from "effection";
import { doc, type DocNode, type DocOptions } from "jsr:@deno/doc@0.162.4";

export function* useDenoDoc(
  specifiers: string[],
  docOptions: DocOptions = {},
): Operation<Record<string, DocNode[]>> {
  return yield* call(() => doc(specifiers, docOptions));
}

export type { DocNode };
