# @effection/vitest

## config

`@effection/vitest` needs to be inlined to negate the following error:

<blockquote>
Error: Vitest was initialized with native Node instead of Vite Node.

One of the following is possible:
- "vitest" is imported outside of your tests (in that case, use "vitest/node" or import.meta.vitest)
- "vitest" is imported inside "globalSetup" (use "setupFiles", because "globalSetup" runs in a different context)
- Your dependency inside "node_modules" imports "vitest" directly (in that case, inline that dependency, using "deps.inline" config)
- Otherwise, it might be a Vitest bug. Please report it to https://github.com/vitest-dev/vitest/issues
</blockquote>

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/*.test.ts'],
    deps: {
      inline: [/@effection\/vitest/],
    },
  },
});
```


[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Created by Frontside](https://img.shields.io/badge/created%20by-frontside-26abe8.svg)](https://frontside.com)
[![Chat on Discord](https://img.shields.io/discord/700803887132704931?Label=Discord)](https://discord.gg/Ug5nWH8)

[Effection][] is the structured concurrency toolkit for JavaScript. You can find
detailed information about testing asynchronous processes in the
[testing guide](https://frontside.com/effection/docs/guides/testing)

[Effection]: https://frontside.com/effection
