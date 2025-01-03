import { run } from "effection";
import { assertEquals } from "jsr:@std/assert";
import { extractJsDoc } from "./use-deno-doc.ts";

const resolver = function* (symbol: string, connector?: string, method?: string) {
  const name = [symbol, connector, method].filter(Boolean).join("");
  return `[${name}](${name})`;
};

Deno.test("replaces {@link Scope} inline tags such as [Score](Score)", async () => {
  const { markdown } = await run(function* () {
    return yield* extractJsDoc({
      doc: `* {@link Context}
* {@link Scope}
* {@link Scope.run}
* {@link Scope#run}`,
    }, resolver);
  });
  
  assertEquals(
    markdown,
    `* [Context](Context)
* [Scope](Scope)
* [Scope.run](Scope.run)
* [Scope#run](Scope#run)`,
  );
});

Deno.test("adds ignore flag when specified", () => {
  
})
