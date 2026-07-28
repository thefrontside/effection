import { main } from "effection4";

import { generatePagefind } from "./e4.ts";

// Build the Pagefind search bundle into `./pagefind` before the site is
// staticalized. The bundle is served and advertised in the sitemap by
// `routes/pagefind-route.ts`, so Staticalize captures it through its normal
// crawl — there is no post-build asset index or sitemap rewriting to do here.
//
// A dedicated `./pagefind-site/` directory is used for the internal staticalize
// pass so it never collides with the outer `--output=built` crawl.
await main(function* () {
  yield* generatePagefind({
    host: new URL("http://localhost:8000"),
    publicDir: "./pagefind-site/",
    pagefindDir: "pagefind",
  });
});
