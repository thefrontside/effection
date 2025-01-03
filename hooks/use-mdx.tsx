import { call, type Operation } from "effection";
import { evaluate } from "npm:@mdx-js/mdx@3.1.0";
import type { MDXModule } from "npm:@types/mdx@2.0.13";
import rehypePrismPlus from "npm:rehype-prism-plus@2.0.0";
import remarkGfm from "npm:remark-gfm@4.0.0";
import { Fragment, jsx, jsxs } from "revolution/jsx-runtime";
import { removeDescriptionHR } from "../lib/remove-description-hr.ts";

export function* useMDX(markdown: string): Operation<MDXModule> {
  return yield* call(async function() {
    try {
      return await evaluate(markdown, {
        jsx,
        jsxs,
        jsxDEV: jsx,
        Fragment,
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          [removeDescriptionHR],
          [
            // @ts-expect-error Type 'Settings' has no properties in common with type 'Settings'.deno-ts(2322)
            rehypePrismPlus,
            {
              showLineNumbers: true,
            },
          ],
        ],
      });
    } catch (e) {
      console.log(`Failed to convert markdown to MDX: ${markdown}`);
      throw e;
    }
  });
}
