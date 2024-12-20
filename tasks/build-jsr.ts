import jsonDeno from "../deno.json" with { type: "json" };

let [version] = Deno.args;
if (!version) {
  throw new Error("a version argument is required to build the npm package");
}

await Deno.writeTextFile(
  new URL("../deno.json", import.meta.url),
  JSON.stringify({
    ...jsonDeno,
    version,
  }),
);
