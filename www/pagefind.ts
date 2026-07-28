import { generate } from "./e4.ts";
import { publishPagefindAssets } from "./pagefind-assets.ts";

await generate({
  host: new URL("http://localhost:8000"),
  publicDir: "./built/",
  pagefindDir: "./built/pagefind",
})();

await publishPagefindAssets("./built");
