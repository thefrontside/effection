import { join } from "jsr:@std/path@1.0.6";

import { Keyword, Punctuation } from "../tokens.tsx";
import { Package, RenderableDocNode } from "../../resources/package.ts";

export function* PackageExports(pkg: Package) {
  const docs = yield* pkg.docs();

  return (
    <>
      {Object.keys(pkg.docs).map((exportName) => (
        <PackageExport
          packageName={pkg.packageName}
          exportName={exportName}
          docs={docs[exportName]}
        />
      ))}
    </>
  );
}

interface PackageExportOptions {
  packageName: string;
  exportName: string;
  docs: Array<RenderableDocNode>;
}

function PackageExport(
  { packageName, exportName, docs }: PackageExportOptions,
) {
  const exports = docs
    .filter((doc) => doc.declarationKind === "export");

  const names = exports.map((doc) => doc.name);

  const unique = exports
    .flatMap(
      (doc, index) => {
        if (names.indexOf(doc.name) === index) {
          return [doc];
        } else {
          return [];
        }
      },
    )
    .flatMap((doc) => [
      <a
        class="no-underline text-slate-300 hover:underline underline-offset-4"
        href={`#${doc.id}`}
      >
        {["enum", "typeAlias", "namespace", "interface"].includes(doc.kind)
          ? <Keyword>{"type "}</Keyword>
          : ""}
        {doc.name}
      </a>,
      ", ",
    ]).slice(0, -1);

  return (
    <pre class="language-ts">
      <code class="language-ts code-highlight">
        <Keyword>import</Keyword>
        <Punctuation>{" { "}</Punctuation>
        <ul class="my-0 list-none pl-4">{chunk(unique).map(chunk => <li class="my-1 pl-0">{chunk}</li>)}</ul>
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
