import { describe, it } from "../testing.ts";
import { expect } from "expect";
import { createJsDocSanitizer, escapeMdxSyntax } from "./use-markdown.tsx";

describe("createJsDocSanitizer", () => {
  let sanitizer = createJsDocSanitizer();
  let cases: [string, string][] = [
    ["{@link Context}", "[Context](Context)"],
    ["@{link Scope}", "[Scope](Scope)"],
    ["{@link spawn()}", "[spawn](spawn)"],
    ["{@link Scope.run}", "[Scope.run](Scope.run)"],
    ["{@link Scope#run}", "[Scope#run](Scope#run)"],
    [
      "{@link  * establish error boundaries https://frontside.com/effection/docs/errors | error boundaries}",
      "",
    ],
    [
      "{@link Operation}&lt;{@link T}&gt;",
      "[Operation](Operation)&lt;[T](T)&gt;",
    ],
  ];

  for (let [input, expected] of cases) {
    it(`rewrites ${input}`, function* () {
      expect(yield* sanitizer(input)).toEqual(expected);
    });
  }
});

describe("escapeMdxSyntax", () => {
  it("escapes `<` opening a type expression", function* () {
    // These previously leaked a raw `<Name>` into MDX, which parsed it as a JSX
    // component and threw `ReferenceError: Name is not defined`.
    expect(escapeMdxSyntax("Operation<Chain<T>>")).toEqual(
      "Operation&lt;Chain&lt;T>>",
    );
    expect(escapeMdxSyntax("From<A | B>")).toEqual("From&lt;A | B>");
    expect(escapeMdxSyntax("Middleware<[], Promise<void>>")).toEqual(
      "Middleware&lt;[], Promise&lt;void>>",
    );
    expect(escapeMdxSyntax("Api<Scope>")).toEqual("Api&lt;Scope>");
    // after {@link} sanitizing turns `{@link B}` into `[B](B)`
    expect(escapeMdxSyntax("[Operation](Operation)<[B](B)>")).toEqual(
      "[Operation](Operation)&lt;[B](B)>",
    );
  });

  it("neutralizes stray `{...}` expressions", function* () {
    // A bare `{Scope}` / `{Api}` (e.g. from a malformed `{@link}`) is a JSX
    // expression to MDX and throws `ReferenceError: Scope is not defined`.
    expect(escapeMdxSyntax("surround a particular {Api}")).toEqual(
      "surround a particular &#123;Api&#125;",
    );
    expect(escapeMdxSyntax("{Scope}")).toEqual("&#123;Scope&#125;");
  });

  it("leaves real HTML tags intact", function* () {
    expect(escapeMdxSyntax("<div>hello</div>")).toEqual("<div>hello</div>");
    expect(escapeMdxSyntax(" <img src=x>")).toEqual(" <img src=x>");
    expect(escapeMdxSyntax("<br>")).toEqual("<br>");
    expect(escapeMdxSyntax("<details><summary>x</summary></details>")).toEqual(
      "<details><summary>x</summary></details>",
    );
  });

  it("never touches angles or braces inside code", function* () {
    expect(escapeMdxSyntax("use `Array<string>` inline")).toEqual(
      "use `Array<string>` inline",
    );
    expect(escapeMdxSyntax("an empty `{}` object")).toEqual(
      "an empty `{}` object",
    );
    expect(
      escapeMdxSyntax("```ts\nlet x: Operation<Chain<T>> = { a: 1 }\n```"),
    ).toEqual("```ts\nlet x: Operation<Chain<T>> = { a: 1 }\n```");
  });
});
