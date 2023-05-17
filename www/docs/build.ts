import { expect, run } from "effection";
import * as esbuild from "https://deno.land/x/esbuild@v0.18.6/mod.js";

import remarkFrontmatter from "https://esm.sh/remark-frontmatter@4.0.1";
import remarkMdxFrontmatter from "https://esm.sh/remark-mdx-frontmatter@3.0.0";
import remarkGfm from "https://esm.sh/remark-gfm@3.0.1";

import rehypePrismPlus from "https://esm.sh/rehype-prism-plus@1.5.1";
import rehypeAutolinkHeadings from "https://esm.sh/rehype-autolink-headings@6.1.1";
import rehypeAddClasses from "https://esm.sh/rehype-add-classes@1.0.0";
import rehypeSlug from "https://esm.sh/rehype-slug@5.1.0";
import rehypeToc from "https://esm.sh/@jsdevtools/rehype-toc@3.0.2";

import builder from "https://esm.sh/@mdx-js/esbuild@2.3.0";

import structure from "../docs/structure.json" assert { type: "json" };

const mdx = builder({
  jsxImportSource: "html",
  remarkPlugins: [
    remarkFrontmatter,
    remarkMdxFrontmatter,
    remarkGfm,
  ],
  rehypePlugins: [
    rehypeSlug,
    [rehypeAutolinkHeadings, {
      behavior: "append",
      properties: {
        className: "opacity-0 group-hover:opacity-100 after:content-['#']",
      },
    }],
    [rehypeAddClasses, {
      "h1[id],h2[id],h3[id],h4[id],h5[id],h6[id]": "group",
    }],
    [rehypeToc, {
      cssClasses: {
        toc: "fixed top-0 right-0",
      },
    }],
    rehypePrismPlus,
  ],
});

await run(function* buildDocs() {
  let moduleIdx = 0;
  let modules = [] as {
    filename: string;
    url: URL;
    varname: string;
    importPath: string;
  }[];

  for (let files of Object.values(structure)) {
    for (let filename of files) {
      modules.push({
        filename,
        url: new URL(`./${filename}`, import.meta.url),
        varname: `doc${moduleIdx++}`,
        importPath: `./${filename}.js`,
      });
    }
  }

  yield* expect(esbuild.build({
    entryPoints: modules.map(({ url }) => url.pathname),
    outdir: "docs/esm",
    outExtension: { ".js": ".mdx.js" },
    format: "esm",
    plugins: [mdx],
  }));

  esbuild.stop();

  let prelude = `import type { DocModule } from "../docs.ts"`;

  let imports = modules.map(({ importPath, varname }) =>
    `import * as ${varname} from "${importPath}";`
  ).join("\n");
  let entries = modules.map(({ filename, varname }) =>
    `  "${filename}": ${varname} as DocModule,`
  ).join("\n");

  let index = `${prelude}\n\n${imports}\n\nexport default {\n${entries}\n};`;

  yield* expect(
    Deno.writeTextFile(new URL("./esm/index.ts", import.meta.url), index),
  );
});
