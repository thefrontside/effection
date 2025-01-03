import { run } from "effection";
import { assertEquals } from "jsr:@std/assert";
import { createJsDocSanitizer } from "./use-markdown.tsx";

const sanitizer = createJsDocSanitizer();

Deno.test("replaces {@link Scope} inline tags such as [Score](Score)", async () => {
  const markdown = await run(function* () {
    return yield* sanitizer(`* {@link Context}
* @{link Scope}
* {@link spawn()}
* {@link Scope.run}
* {@link Scope#run}`);
  });

  assertEquals(
    markdown,
    `* [Context](Context)
* [Scope](Scope)
* [spawn](spawn)
* [Scope.run](Scope.run)
* [Scope#run](Scope#run)`,
  );
});
