await Deno.writeTextFile(
  "jsr.json",
  JSON.stringify({
    name: "@effection/effection",
    version: Deno.env.get('VERSION'),
    exports: "./mod.ts",
    include: ["lib", "mod.ts", "README.md"],
  }),
);
