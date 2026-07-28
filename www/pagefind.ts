import { call, main, type Operation } from "npm:effection@4.0.0-alpha.4";
import { join, relative } from "@std/path";

import { generatePagefind } from "./e4.ts";

await main(function* () {
  yield* generatePagefind({
    host: new URL("http://localhost:8000"),
    publicDir: "./built/",
    pagefindDir: "./built/pagefind",
  });

  yield* publishPagefindAssets("./built");
});

function* publishPagefindAssets(siteDir: string): Operation<void> {
  let pagefindDir = join(siteDir, "pagefind");
  let paths = (yield* collectFiles(pagefindDir))
    .map((path) => relative(pagefindDir, path))
    .filter((path) => path !== "index.html")
    .sort();

  yield* call(() =>
    Deno.writeTextFile(
      join(pagefindDir, "index.html"),
      renderAssetIndex(paths),
    )
  );

  let sitemapPath = join(siteDir, "sitemap.xml");
  let sitemap = yield* call(() => Deno.readTextFile(sitemapPath));
  let firstLocation = sitemap.match(/<loc>([^<]+)<\/loc>/)?.[1];

  if (!firstLocation) {
    throw new Error(`Unable to find a location in ${sitemapPath}`);
  }

  let location = new URL("/pagefind/", firstLocation).href;

  if (!sitemap.includes(`<loc>${location}</loc>`)) {
    let closingTag = "</urlset>";

    if (!sitemap.includes(closingTag)) {
      throw new Error(`Unable to find ${closingTag} in ${sitemapPath}`);
    }

    sitemap = sitemap.replace(
      closingTag,
      `  <url><loc>${location}</loc></url>\n${closingTag}`,
    );
    yield* call(() => Deno.writeTextFile(sitemapPath, sitemap));
  }
}

function* collectFiles(dir: string): Operation<string[]> {
  let files: string[] = [];
  let entries = yield* call(() => Array.fromAsync(Deno.readDir(dir)));

  for (let entry of entries) {
    let path = join(dir, entry.name);

    if (entry.isDirectory) {
      files.push(...yield* collectFiles(path));
    } else if (entry.isFile) {
      files.push(path);
    }
  }

  return files;
}

function renderAssetIndex(paths: string[]): string {
  let links = paths.map((path) => {
    let href = path.split("/").map(encodeURIComponent).join("/");
    return `    <li><a href="${href}">${escapeHtml(path)}</a></li>`;
  }).join("\n");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="robots" content="noindex">
    <title>Pagefind assets</title>
  </head>
  <body data-pagefind-ignore>
    <h1>Pagefind assets</h1>
    <ul>
${links}
    </ul>
  </body>
</html>
`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
