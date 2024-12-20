import { build, emptyDir } from "jsr:@deno/dnt@0.41.3";

const outDir = "./build/npm";

await emptyDir(outDir);

let [version] = Deno.args;
if (!version) {
  throw new Error("a version argument is required to build the npm package");
}

await build({
  entryPoints: ["./mod.ts"],
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
    license: "ISC",
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
