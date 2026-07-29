import { assertEquals } from "@std/assert";
import { run } from "effection";
import { createJsDocSanitizer, escapeMdxSyntax } from "./use-markdown.tsx";

const sanitizer = createJsDocSanitizer();

function sanitizedEquals(a: string, b: string) {
  Deno.test(`${a} => ${b}`, async function () {
    let result = await run(function* () {
      return yield* sanitizer(a);
    });
    assertEquals(result, b);
  });
}

sanitizedEquals("{@link Context}", "[Context](Context)");
sanitizedEquals("@{link Scope}", "[Scope](Scope)");
sanitizedEquals("{@link spawn()}", "[spawn](spawn)");
sanitizedEquals("{@link Scope.run}", "[Scope.run](Scope.run)");
sanitizedEquals("{@link Scope#run}", "[Scope#run](Scope#run)");
sanitizedEquals(
  "{@link  * establish error boundaries https://frontside.com/effection/docs/errors | error boundaries}",
  "",
);
sanitizedEquals(
  "{@link Operation}&lt;{@link T}&gt;",
  "[Operation](Operation)&lt;[T](T)&gt;",
);

Deno.test("escapeMdxSyntax: escapes `<` opening a type expression", () => {
  // These previously leaked a raw `<Name>` into MDX, which parsed it as a JSX
  // component and threw `ReferenceError: Name is not defined`.
  assertEquals(
    escapeMdxSyntax("Operation<Chain<T>>"),
    "Operation&lt;Chain&lt;T>>",
  );
  assertEquals(escapeMdxSyntax("From<A | B>"), "From&lt;A | B>");
  assertEquals(
    escapeMdxSyntax("Middleware<[], Promise<void>>"),
    "Middleware&lt;[], Promise&lt;void>>",
  );
  assertEquals(escapeMdxSyntax("Api<Scope>"), "Api&lt;Scope>");
  // after {@link} sanitizing turns `{@link B}` into `[B](B)`
  assertEquals(
    escapeMdxSyntax("[Operation](Operation)<[B](B)>"),
    "[Operation](Operation)&lt;[B](B)>",
  );
});

Deno.test("escapeMdxSyntax: neutralizes stray `{...}` expressions", () => {
  // A bare `{Scope}` / `{Api}` (e.g. from a malformed `{@link}`) is a JSX
  // expression to MDX and throws `ReferenceError: Scope is not defined`.
  assertEquals(
    escapeMdxSyntax("surround a particular {Api}"),
    "surround a particular &#123;Api&#125;",
  );
  assertEquals(escapeMdxSyntax("{Scope}"), "&#123;Scope&#125;");
});

Deno.test("escapeMdxSyntax: leaves real HTML tags intact", () => {
  assertEquals(escapeMdxSyntax("<div>hello</div>"), "<div>hello</div>");
  assertEquals(escapeMdxSyntax(" <img src=x>"), " <img src=x>");
  assertEquals(escapeMdxSyntax("<br>"), "<br>");
  assertEquals(
    escapeMdxSyntax("<details><summary>x</summary></details>"),
    "<details><summary>x</summary></details>",
  );
});

Deno.test("escapeMdxSyntax: never touches angles or braces inside code", () => {
  assertEquals(
    escapeMdxSyntax("use `Array<string>` inline"),
    "use `Array<string>` inline",
  );
  assertEquals(
    escapeMdxSyntax("an empty `{}` object"),
    "an empty `{}` object",
  );
  assertEquals(
    escapeMdxSyntax("```ts\nlet x: Operation<Chain<T>> = { a: 1 }\n```"),
    "```ts\nlet x: Operation<Chain<T>> = { a: 1 }\n```",
  );
});
