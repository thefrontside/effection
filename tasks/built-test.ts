import { build, emptyDir } from "jsr:@deno/dnt@0.41.3";

const outDir = "./build/test";

await emptyDir(outDir);

const entryPoints = [
  "./lib/mod.ts"
];
for await (const entry of Deno.readDir('test')) {
  if (entry.isFile) {
    entryPoints.push(`./test/${entry.name}`);
  }
}

await build({
  entryPoints,
  outDir,
  shims: {
    deno: true,
  },
  typeCheck: false,
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

await Deno.copyFile("README.md", `${outDir}/README.md`);
