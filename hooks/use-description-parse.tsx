import { call, type Operation } from "effection";
import { unified } from "unified";
import type { VFile } from "npm:vfile@6.0.3";
import rehypeInferDescriptionMeta from "npm:rehype-infer-description-meta@2.0.0";
import rehypeInferTitleMeta from "npm:rehype-infer-title-meta@2.0.0";
import rehypeStringify from "npm:rehype-stringify@10.0.1";
import remarkParse from "npm:remark-parse@11.0.0";
import remarkRehype from "npm:remark-rehype@11.1.1";
import { trimAfterHR } from "../lib/trim-after-hr.ts";

export function* useDescription(markdown: string): Operation<string> {
  const file = yield* useMarkdownFile(markdown);
  return file.data?.meta?.description ?? "";
}

export function* useTitle(markdown: string): Operation<string> {
  const file = yield* useMarkdownFile(markdown);
  return file.data?.meta?.title ?? "";
}

export function* useMarkdownFile(markdown: string): Operation<VFile> {
  return yield* call(() =>
    unified()
      .use(remarkParse)
      .use(remarkRehype)
      .use(rehypeStringify)
      .use(trimAfterHR)
      .use(rehypeInferTitleMeta)
      .use(rehypeInferDescriptionMeta, {
        inferDescriptionHast: true,
        truncateSize: 200,
      })
      .process(markdown),
  );
}
