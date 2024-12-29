import { call, each, main } from "effection";
import { x } from "../../tinyexec/mod.ts";
import { readPackages } from "../hooks/read-packages.ts";

await main(function* () {
  let configs = yield* readPackages({
    excludePrivate: true,
    base: new URL(`file://${Deno.cwd()}/`),
  });

  let include: Record<string, unknown>[] = [];

  for (let pkg of configs) {
    let tagname = `${pkg.denoJson.name.split("/")[1]}-v${pkg.denoJson.version}`;

    let git = yield* x(`git`, [`tag`, `--list`, tagname]);

    let output = [];

    for (let line of yield* each(git.lines)) {
      output.push(line);
      yield* each.next();
    }

    // if output of `git tag --list ${{tagname}}` is empty, tag does not exists
    // ergo we publish
    if (output.join("").trim() === "") {
      include.push({
        workspace: pkg.workspace,
        tagname,
        name: pkg.denoJson.name,
        version: pkg.denoJson.version,
      });
    }
  }

  let exists = include.length > 0;

  if (!exists) {
    include.push({ workspace: "nothing" });
  }

  let outputValue = [
    `exists=${exists}`,
    `matrix=${JSON.stringify({ include })}`,
  ].join("\n");

  console.log(outputValue);

  if (Deno.env.has("GITHUB_OUTPUT")) {
    const githubOutput = Deno.env.get("GITHUB_OUTPUT") as string;
    yield* call(() =>
      Deno.writeTextFile(githubOutput, outputValue, {
        append: true,
      })
    );
  }
});
