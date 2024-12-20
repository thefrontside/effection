import jsonDeno from "../deno.json" with { type: "json" };

await Deno.writeTextFile(
  new URL("../deno.json", import.meta.url),
  JSON.stringify({
    ...jsonDeno,
    version: Deno.env.get("VERSION"),
  }),
);
