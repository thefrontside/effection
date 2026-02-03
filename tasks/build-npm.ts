import { build, emptyDir } from "jsr:@deno/dnt@0.42.3";
import denoJSON from "../deno.json" with { type: "json" };

const outDir = "./build/npm";

await emptyDir(outDir);

let [version] = Deno.args;
if (!version) {
  throw new Error("a version argument is required to build the npm package");
}

await build({
  entryPoints: Object.entries(denoJSON.exports).map(([key, value]) => ({
    name: key,
    path: value,
  })),
  outDir,
  shims: {
    deno: false,
  },
  test: false,
  typeCheck: false,
  compilerOptions: {
    lib: ["ESNext", "DOM"],
    target: "ES2020",
    sourceMap: true,
  },
  package: {
    // package.json properties
    name: "effection",
    version,
    description: "Structured concurrency and effects for JavaScript",
    license: "MIT",
    author: "engineering@frontside.com",
    repository: {
      type: "git",
      url: "git+https://github.com/thefrontside/effection.git",
    },
    bugs: {
      url: "https://github.com/thefrontside/effection/issues",
    },
    engines: {
      node: ">= 16",
    },
    sideEffects: false,
  },
});

await Deno.copyFile("README.md", `${outDir}/README.md`);
