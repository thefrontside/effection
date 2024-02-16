import { main } from "../../lib/main.ts";
import { useCommand } from "../lib/useCommand.ts";
import { assert } from "../../lib/deps.ts";
import { useEnv } from "../lib/useEnv.ts";

function* createRelease(
  { version }: { ref_name: string; version: string },
) {
  yield* useCommand(`deno doc --html --name=effection@${version} mod.ts`);

  yield* useCommand(`tar cfvz api-docs.tgz -C docs .`);


}

await main(function* () {
  const env = yield* useEnv();

  const ref_name = env.get("GITHUB_REF_NAME");
  assert(ref_name, `Missing GITHUB_REF_NAME environment variable`);

  yield* createRelease({
    ref_name,
    version: ref_name.replace("effection-v", ""),
  });
});
