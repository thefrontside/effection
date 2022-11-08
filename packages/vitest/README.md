# @effection/vitest

## config

`@effection/vitest` needs to be inlined to avoid node resolution problems and vitest version discrepencies:

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
