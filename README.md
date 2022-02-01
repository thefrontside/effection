[![npm](https://img.shields.io/npm/v/effection.svg)](https://www.npmjs.com/package/effection)
[![bundle size (minified + gzip)](https://img.shields.io/bundlephobia/minzip/effection)](https://bundlephobia.com/result?p=effection)
[![CircleCI](https://circleci.com/gh/thefrontside/effection.svg?style=shield)](https://circleci.com/gh/thefrontside/effection)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Created by Frontside](https://img.shields.io/badge/created%20by-frontside-26abe8.svg)](https://frontside.com)
[![Chat on Discord](https://img.shields.io/discord/700803887132704931?Label=Discord)](https://discord.gg/Ug5nWH8)

# Effection

A framework for Node and the browser that makes building concurrent
systems easy to get right.

## Why use Effection?

Using Effection provides many benefits over using plain Promises and
`async/await` code:

- **Cleanup:** Effection code cleans up after itself, and that means never having
  to remember to manually close a resource or detach a listener.
- **Cancellation:** Any Effection task can be cancelled, which will completely
  stop that task, as well as stopping any other tasks this operation itself has
  started.
- **Synchronicity:** Unlike Promises and `async/await`, Effection is fundamentally
  synchronous in nature, this means you have full control over the event loop
  and operations requiring synchronous setup remain race condition free.
- **Composition:** Since all Effection code is well behaved, it
  composes easily, and there are no nasty surprises when trying to
  fit different pieces together.

Effection leverages the idea of [structured concurrency][structured concurrency]
to ensure that you don't leak any resources, and that cancellation is
properly handled. It helps you build concurrent code that feels rock
solid and behaves well under all failure conditions. In essence,
Effection allows you to compose concurrent code so that you can reason
about its behavior.

[Learn how to use Effection in your own project](https://frontside.com/effection)

## Contributing

Currently, Effection development happens using `yarn`. While `npm` may
work, it is not tested so your mileage may vary.

To build, run the `prepack` command from the root directory.

```text
$ yarn prepack
```

You can also run the `prepack` command within each sub directory to
only build that package.

Don't forget describe changes that you made.
For that you need to create `*.md` file in `.changes` directory with
list of changed packages, each package should be versioned by semver, and
on the last line briefly describe your changes. Like this:

```md
---
"package-name1": "patch"
"package-name2": "minor"
---

Added new awesome feature
```

The more information about this format you can find in [`covector` docs](https://github.com/jbolda/covector/tree/main/packages/covector#applying-changes)

### Testing

To run tests:

```text
$ yarn test
```

Most test suites use the [`@effection/mocha`](packages/mocha) to
leverage Effection to test itself.

[structured concurrency]: https://vorpus.org/blog/notes-on-structured-concurrency-or-go-statement-considered-harmful/
[discord]: https://discord.gg/Ug5nWH8
