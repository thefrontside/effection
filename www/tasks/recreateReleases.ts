import { main } from "effection";
import { withGithub } from "../lib/github/useGithub.ts";
import { getTags } from '../lib/github/getTags.ts';

function* recreateReleases() {
  const tags = yield* getTags({
    owner: 'thefrontside',
    repo: 'effection'
  });
  
  const significant = tags
    .filter(({ name }) =>
      /^effection-v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(name),
    )
    .map(({ name }) => name);

}

await main(function* () {
  yield* withGithub(function*() {
    yield* recreateReleases();
  })
});
