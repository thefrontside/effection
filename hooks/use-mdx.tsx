import { call, type Operation } from "effection";
import { evaluate } from "npm:@mdx-js/mdx@3.1.0";
import type { MDXModule } from "npm:@types/mdx@2.0.13";
import { Fragment, jsx, jsxs } from "revolution/jsx-runtime";
import { PluggableList } from "unified";
import type { Options as RemarkRehypeOptions } from "npm:remark-rehype@11.1.1";

export interface UseMDXOptions {
  remarkPlugins?: PluggableList | null | undefined;
  /**
   * List of rehype plugins (optional).
   */
  rehypePlugins?: PluggableList | null | undefined;
  /**
   * Options to pass through to `remark-rehype` (optional);
   * the option `allowDangerousHtml` will always be set to `true` and the MDX
   * nodes (see `nodeTypes`) are passed through;
   * In particular, you might want to pass configuration for footnotes if your
   * content is not in English.
   */
  remarkRehypeOptions?: Readonly<RemarkRehypeOptions> | null | undefined;
}

export function* useMDX(
  markdown: string,
  options?: UseMDXOptions,
): Operation<MDXModule> {
  return yield* call(async function () {
    try {
      return await evaluate(markdown, {
        jsx,
        jsxs,
        jsxDEV: jsx,
        Fragment,
        ...options,
      });
    } catch (e) {
      console.log(`Failed to convert markdown to MDX: ${markdown}`);
      throw e;
    }
  });
}
