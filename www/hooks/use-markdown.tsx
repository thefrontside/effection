import { call, type Operation } from "effection";
import type { JSXElement } from "revolution/jsx-runtime";
import { useMDX } from "./use-mdx.tsx";

export function* useMarkdown(markdown: string): Operation<JSXElement> {
  return yield* call(function* (): Operation<JSXElement> {
    const mod = yield* useMDX(markdown);
    return mod.default();
  });
}
