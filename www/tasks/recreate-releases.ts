import { main } from "../lib/main.ts";
import { setupGithub, getEffectionReleaseTags } from "../www/lib/use-github.ts";

function* recreateReleases() {
  const tags = yield* getEffectionReleaseTags();

}

await main(function* () {
  yield* setupGithub();
  yield* recreateReleases();
});
