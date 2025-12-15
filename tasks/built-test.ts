import { build, emptyDir } from "jsr:@deno/dnt@0.41.3";

const outDir = "./build/test";

await emptyDir(outDir);

const entryPoints = [
  "./lib/mod.ts",
];

await build({
  entryPoints,
  outDir,
  shims: {
    deno: true,
  },
  test: true,
  testPattern: "test/**/*.test.ts",
  typeCheck: false,
  scriptModule: false,
  esModule: true,
  compilerOptions: {
    lib: ["ESNext", "DOM"],
    target: "ES2020",
    sourceMap: true,
  },
  importMap: "deno.json",
  package: {
    // package.json properties
    name: "effection-tests",
    version: "0.0.0",
    sideEffects: false,
  },
});
