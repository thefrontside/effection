import { join, relative } from "@std/path";

export async function publishPagefindAssets(siteDir: string): Promise<void> {
  let pagefindDir = join(siteDir, "pagefind");
  let paths = (await collectFiles(pagefindDir))
    .map((path) => relative(pagefindDir, path))
    .filter((path) => path !== "index.html")
    .sort();

  await Deno.writeTextFile(
    join(pagefindDir, "index.html"),
    renderAssetIndex(paths),
  );

  let sitemapPath = join(siteDir, "sitemap.xml");
  let sitemap = await Deno.readTextFile(sitemapPath);
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
    await Deno.writeTextFile(sitemapPath, sitemap);
  }
}

async function collectFiles(dir: string): Promise<string[]> {
  let files: string[] = [];

  for await (let entry of Deno.readDir(dir)) {
    let path = join(dir, entry.name);

    if (entry.isDirectory) {
      files.push(...await collectFiles(path));
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
