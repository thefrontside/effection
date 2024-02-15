import { main } from '../../lib/main.ts';
import { setupGithub } from '../lib/useGithub.ts';
import { useCommand } from "../lib/useCommand.ts";
import { assert } from "../../lib/deps.ts";

function* createRelease({ ref_name }: { ref_name: string }) {

  const version = ref_name.replace('effection-v', '');

  yield* useCommand(`deno doc --html --name=effection@${version} mod.ts`);

  yield* useCommand(`tar cfvz api-docs.tgz -C docs .`);


}

await main(function*() {
  yield* setupGithub();

  const ref_name = Deno.env.get('GITHUB_REF_NAME');
  assert(ref_name, `Missing GITHUB_REF_NAME environment variable`)

  yield* createRelease({
    ref_name,
  });
})

