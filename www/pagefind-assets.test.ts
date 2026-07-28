import { assertStringIncludes } from "@std/assert";
import { join } from "@std/path";

import { publishPagefindAssets } from "./pagefind-assets.ts";

Deno.test("publishes Pagefind assets through the sitemap", async () => {
  let siteDir = await Deno.makeTempDir();
  let pagefindDir = join(siteDir, "pagefind");

  try {
    await Deno.mkdir(join(pagefindDir, "fragment"), { recursive: true });
    await Deno.writeTextFile(join(pagefindDir, "pagefind.js"), "");
    await Deno.writeTextFile(
      join(pagefindDir, "fragment", "en_test.pf_fragment"),
      "",
    );
    await Deno.writeTextFile(
      join(siteDir, "sitemap.xml"),
      `<?xml version="1.0"?>
<urlset>
  <url><loc>https://effection.netlify.app/</loc></url>
</urlset>`,
    );

    await publishPagefindAssets(siteDir);

    let index = await Deno.readTextFile(join(pagefindDir, "index.html"));
    assertStringIncludes(index, 'href="pagefind.js"');
    assertStringIncludes(
      index,
      'href="fragment/en_test.pf_fragment"',
    );

    let sitemap = await Deno.readTextFile(join(siteDir, "sitemap.xml"));
    assertStringIncludes(
      sitemap,
      "<loc>https://effection.netlify.app/pagefind/</loc>",
    );
  } finally {
    await Deno.remove(siteDir, { recursive: true });
  }
});
