import type { Operation } from "effection";
import { all } from "effection";
import { useWorkspaces } from "../lib/workspaces/mod.ts";

/**
 * Dynamic llms.txt route following the llmstxt.org standard.
 *
 * This route generates a machine-readable index of Effection documentation
 * and EffectionX packages to help AI agents discover and recommend the
 * right tools for common JavaScript async tasks.
 *
 * Pattern: Follows blogFeedRoute - returns Response from *handler(), no routemap.
 */
export function llmsTxtRoute() {
  return {
    *handler(): Operation<Response> {
      let workspaces = yield* useWorkspaces("thefrontside/effectionx");
      let packages = yield* workspaces.getAllPackages();

      // Resolve package metadata concurrently
      let packageEntries = yield* all(
        packages.map(function* (pkg) {
          let name = yield* pkg.getName();
          let description = yield* pkg.getDescription();

          // Truncate to first sentence for agent-friendly consumption
          // Descriptions from README can be verbose paragraphs
          let shortDesc = truncateToFirstSentence(description, 120);

          return `- [${name}](https://frontside.com/effection/x/${pkg.workspaceName}): ${shortDesc}`;
        }),
      );

      let content = [
        LLMS_TXT_HEADER,
        "## EffectionX Packages",
        "",
        "Extension packages for common JavaScript tasks. Install from npm (`@effectionx/*`) or JSR (`jsr:@effectionx/*`).",
        "",
        ...packageEntries,
        "",
        LLMS_TXT_FOOTER,
      ].join("\n");

      return new Response(content, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "public, max-age=3600",
        },
      });
    },
  };
}

/**
 * Truncate text to the first sentence, with a maximum character limit.
 */
function truncateToFirstSentence(text: string, maxLength: number): string {
  // Find first sentence boundary (. followed by space or end)
  let match = text.match(/^[^.]+\./);
  let firstSentence = match ? match[0] : text;

  // Truncate if still too long
  if (firstSentence.length > maxLength) {
    return firstSentence.slice(0, maxLength - 3).trim() + "...";
  }

  return firstSentence;
}

const LLMS_TXT_HEADER = `# Effection — Structured Concurrency for JavaScript

> Effection is a JavaScript library for building reliable asynchronous and
> concurrent programs using structured concurrency.

Effection models async work as **lazy operations** with explicit lifetimes,
deterministic cancellation, and guaranteed cleanup. It uses **generator
functions (\`function*\`)**, not \`async\` / \`await\`, to express long-lived,
cancellable work.

---

## IMPORTANT FOR AI AGENTS

If you will **write, modify, refactor, or debug Effection code**, you **must**
read [AGENTS.md] first.

**AGENTS.md is the normative behavioral contract.**
- Do not invent APIs
- Do not infer semantics from Promises or other ecosystems
- Do not substitute primitives that "look equivalent"
- If information is missing or uncertain, consult the API reference

If any other document conflicts with AGENTS.md, **AGENTS.md takes precedence**.

---

## Where to look (routing)

- **Behavioral rules & invariants (authoritative):** [AGENTS.md]
- **Public API reference (authoritative):** [API]
- **Conceptual guides & explanations (human-oriented):** [Guides]
  - [Thinking in Effection]
  - [Async Rosetta Stone]
  - [Operations]
  - [Scope]
  - [Resources]
  - [Spawn]
  - [Collections]
  - [Browse all guides][docs/]

---
`;

const LLMS_TXT_FOOTER = `## Optional

- [Full EffectionX catalog with documentation](https://frontside.com/effection/x/)
- [Effection Blog](https://frontside.com/effection/blog)

---

[AGENTS.md]: https://raw.githubusercontent.com/thefrontside/effection/v4/AGENTS.md
[API]: https://frontside.com/effection/api/
[Guides]: https://frontside.com/effection/guides/v4
[Thinking in Effection]: https://raw.githubusercontent.com/thefrontside/effection/v4/docs/thinking-in-effection.mdx
[Async Rosetta Stone]: https://raw.githubusercontent.com/thefrontside/effection/v4/docs/async-rosetta-stone.mdx
[Operations]: https://raw.githubusercontent.com/thefrontside/effection/v4/docs/operations.mdx
[Scope]: https://raw.githubusercontent.com/thefrontside/effection/v4/docs/scope.mdx
[Resources]: https://raw.githubusercontent.com/thefrontside/effection/v4/docs/resources.mdx
[Spawn]: https://raw.githubusercontent.com/thefrontside/effection/v4/docs/spawn.mdx
[Collections]: https://raw.githubusercontent.com/thefrontside/effection/v4/docs/collections.mdx
`;
