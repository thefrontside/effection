import { assertEquals, assertStringIncludes } from "@std/assert";

import { withInstallation } from "./x-package-markdown-route.ts";

Deno.test("withInstallation adds the npm command to a readme without one", () => {
  let readme = "# Task Buffer\n\nLimits concurrent work.\n";

  assertEquals(
    withInstallation(readme, "@effectionx/task-buffer"),
    `# Task Buffer

Limits concurrent work.

## Installation

\`\`\`sh
npm install @effectionx/task-buffer
\`\`\`
`,
  );
});

Deno.test("withInstallation leaves a readme that already says how", () => {
  let readme = `# BDD

## Installation

\`\`\`sh
npm install @effectionx/bdd
\`\`\`

## Usage
`;

  assertEquals(withInstallation(readme, "@effectionx/bdd"), readme);
});

Deno.test("withInstallation counts a command that installs more than the package", () => {
  // `npm install @effectionx/fetch effection` installs its peer too
  let readme =
    "# Fetch\n\n```bash\nnpm install @effectionx/fetch effection\n```\n";

  assertEquals(withInstallation(readme, "@effectionx/fetch"), readme);
});

Deno.test("withInstallation does not mistake a readme that merely mentions npm", () => {
  // `process` documents running `npm install` as a child process
  let readme =
    '# Process\n\n```ts\nlet process = yield* exec("npm install");\n```\n';

  let result = withInstallation(readme, "@effectionx/process");

  assertStringIncludes(result, "npm install @effectionx/process");
});
