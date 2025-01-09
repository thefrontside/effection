import { run } from "effection";
import { assertEquals } from "jsr:@std/assert";
import { createJsDocSanitizer } from "./use-markdown.tsx";

const sanitizer = createJsDocSanitizer();

function sanitizedEquals(a: string, b: string) {
  Deno.test(`${a} => ${b}`, async function() {
    const result = await run(function* () {
      return yield* sanitizer(a);
    });
    assertEquals(result, b);  
  });
}

sanitizedEquals("{@link Context}", "[Context](Context)")
sanitizedEquals("@{link Scope}", "[Scope](Scope)")
sanitizedEquals("{@link spawn()}", "[spawn](spawn)")
sanitizedEquals("{@link Scope.run}", "[Scope.run](Scope.run)")
sanitizedEquals("{@link Scope#run}", "[Scope#run](Scope#run)")
sanitizedEquals("{@link  * establish error boundaries https://frontside.com/effection/docs/errors | error boundaries}", "")
sanitizedEquals("{@link Operation}&lt;{@link T}&gt;", "[Operation](Operation)&lt;[T](T)&gt;")