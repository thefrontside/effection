[![npm](https://img.shields.io/npm/v/effection.svg)](https://www.npmjs.com/package/effection)
[![bundle size (minified + gzip)](https://img.shields.io/bundlephobia/minzip/effection)](https://bundlephobia.com/result?p=effection)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Created by Frontside](https://img.shields.io/badge/created%20by-frontside-26abe8.svg)](https://frontside.com)
[![Chat on Discord](https://img.shields.io/discord/700803887132704931?Label=Discord)](https://discord.gg/Ug5nWH8)

# Effection

Structured concurrency and effects for JavaScript.

## Why use Effection?

Effection leverages the idea of [structured concurrency][structured concurrency]
to ensure that you don't leak any resources, effects, and that cancellation is
always properly handled. It helps you build concurrent code that feels rock
solid _at scale_, and it does all of this while feeling like normal JavaScript.

[Learn how to use Effection in your own project](https://frontside.com/effection)

## Platforms

Effection runs on all major JavaScript platforms including NodeJs, Browser, and
Deno. It is published on both [npm][npm-effection] and [deno.land][deno-land-effection].

## Development

[Deno][] is the primary tool used for development, testing, and packaging.

### Testing

To run tests:

```text
$ deno task test
```

### Building NPM Packages

If you want to build a development version of the NPM package so that you can
link it locally, you can use the `build:npm` script and passing it a version
number. for example:

``` text
$ deno task build:npm 3.0.0-mydev-snapshot.0
Task build:npm deno run -A tasks/build-npm.ts "3.0.0-mydev-snapshot.0"
[dnt] Transforming...
[dnt] Running npm install...

up to date, audited 1 package in 162ms

found 0 vulnerabilities
[dnt] Building project...
[dnt] Emitting ESM package...
[dnt] Emitting script package...
[dnt] Complete!
```

Now, the built npm package can be found in the `build/npm` directory.

[structured concurrency]: https://vorpus.org/blog/notes-on-structured-concurrency-or-go-statement-considered-harmful/
[discord]: https://discord.gg/Ug5nWH8
[Deno]: https://deno.land
[npm-effection]: https://www.npmjs.com/package/effection
[deno-land-effection]: https://deno.land/x/effection
