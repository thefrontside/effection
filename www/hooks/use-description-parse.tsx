import { call, type Operation } from "effection";
import { unified } from "unified";
import type { VFile } from "vfile";
import rehypeInferDescriptionMeta from "rehype-infer-description-meta";
import rehypeInferTitleMeta from "rehype-infer-title-meta";
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { trimAfterHR } from "../lib/trim-after-hr.ts";

export function* useDescription(markdown: string): Operation<string> {
  let file = yield* useMarkdownFile(markdown);
  return file.data?.meta?.description ?? "";
}

export function* useTitle(markdown: string): Operation<string> {
  let file = yield* useMarkdownFile(markdown);
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
      .process(markdown)
  );
}
