import { build, emptyDir } from "jsr:@deno/dnt";
import { DenoJson } from "../hooks/use-package.tsx";

const outDir = "./build/npm";

await emptyDir(outDir);

let [workspace] = Deno.args;
if (!workspace) {
  throw new Error("a version argument is required to build the npm package");
}

let mod = await import(`../../${workspace}/deno.json`, {
  with: { type: "json" },
});

let deno = DenoJson.parse(mod.default);

let entryPoints = typeof deno.exports === "string"
  ? [deno.exports]
  : Object.entries(deno.exports).map(([name, path]) => ({
    kind: "export" as const,
    name,
    path,
  }));

Deno.chdir(workspace);

await build({
  entryPoints,
  outDir,
  shims: {
    deno: false,
  },
  test: false,
  typeCheck: false,
  package: {
    // package.json properties
    name: deno.name,
    version: deno.version!,
    license: deno.license,
    author: "engineering@frontside.com",
    repository: {
      type: "git",
      url: "git+https://github.com/thefrontside/effection-contrib.git",
    },
    bugs: {
      url: "https://github.com/thefrontside/effection-contrib/issues",
    },
    engines: {
      node: ">= 16",
    },
    sideEffects: false,
  },
});

await Deno.copyFile(`README.md`, `${outDir}/README.md`);
