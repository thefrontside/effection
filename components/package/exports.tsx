import { join } from "jsr:@std/path@1.0.6";

import { Keyword, Punctuation } from "../type/tokens.tsx";
import { DocPage, DocsPages } from "../../hooks/use-deno-doc.tsx";
import { Operation } from "effection";
import { JSXChild, JSXElement } from "revolution/jsx-runtime";
import { ResolveLinkFunction } from "../../hooks/use-markdown.tsx";

interface PackageExportsParams {
  packageName: string;
  docs: DocsPages;
  linkResolver: ResolveLinkFunction;
}

export function* PackageExports({
  packageName,
  docs,
  linkResolver,
}: PackageExportsParams) {
  const elements: JSXElement[] = [];

  for (const [exportName, docPages] of Object.entries(docs)) {
    elements.push(
      yield* PackageExport({
        linkResolver,
        packageName,
        exportName,
        docPages,
      }),
    );
  }

  return elements;
}

interface PackageExportOptions {
  packageName: string;
  exportName: string;
  docPages: Array<DocPage>;
  linkResolver: ResolveLinkFunction;
}

function* PackageExport({
  packageName,
  exportName,
  docPages,
  linkResolver,
}: PackageExportOptions): Operation<JSXElement> {
  const exports: JSXChild[] = [];

  for (const page of docPages.sort((a, b) => a.name.localeCompare(b.name))) {
    exports.push(
      ...[
        <a
          class="no-underline text-slate-300 hover:underline underline-offset-4"
          href={yield* linkResolver(page.kind, "_", page.name)}
        >
          {["enum", "typeAlias", "namespace", "interface"].includes(
              page.kind,
            )
            ? <Keyword>{"type "}</Keyword>
            : (
              ""
            )}
          {page.name}
        </a>,
        ", ",
      ],
    );
  }

  return (
    <pre class="language-ts">
      <code class="language-ts code-highlight">
        <Keyword>import</Keyword>
        <Punctuation>{" { "}</Punctuation>
        <ul class="my-0 list-none pl-4">
          {chunk(exports.slice(0, -1)).map((chunk) => (
            <li class="my-1 pl-0">{chunk}</li>
          ))}
        </ul>
        <Punctuation>{"} "}</Punctuation>
        <Keyword>{"from "}</Keyword>
        <span class="token string">"{join(packageName, exportName)}"</span>
      </code>
    </pre>
  );
}

function chunk<T>(array: T[], chunkSize = 2): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    const chunk = array.slice(i, i + chunkSize);
    chunks.push(chunk);
  }
  return chunks;
}
