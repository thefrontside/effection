import { build, emptyDir } from "jsr:@deno/dnt@0.41.3";
import { copy } from "jsr:@std/fs@^1";

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
  postBuild: async () => {
    await Deno.mkdir("./build/test/esm/test/main", { recursive: true });
    for await (const file of Deno.readDir("./test/main")) {
      if (file.isFile) {
        const content = await Deno.readTextFile(`./test/main/${file.name}`);
        const newContent = content.replaceAll(
          `from "../../mod.ts"`,
          `from "../../mod.js"`,
        );
        await Deno.writeTextFile(
          `./build/test/esm/test/main/${file.name}`,
          newContent,
        );
      }
    }
  },
});
