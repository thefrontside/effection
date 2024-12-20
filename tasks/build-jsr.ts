import jsonDeno from "../deno.json" with { type: "json" };

await Deno.writeTextFile(
  new URL("../deno.json", import.meta.url),
  JSON.stringify({
    ...jsonDeno,
    name: "@effection/effection",
    version: Deno.env.get("VERSION"),
    exports: "./mod.ts",
    license: "ISC",
    publish: {
      include: ["lib", "mod.ts", "README.md"],
    },
  }),
);
