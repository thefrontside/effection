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
  composes easily, and there  are no nasty surprises when trying to
  fit different pieces together.

JavaScript has gone through multiple evolutionary steps in how to deal
with concurrency: from callbacks and events, to promises, and then
finally to `async/await`. Yet it can still be difficult to write
concurrent code which is both correct and composable, and unless
you're very careful, it is still easy to leak resources. Also, most
JavaScript code and libraries do not handle cancellation very well,
and failure conditions can easily lead to dangling promises and other
unexpected behavior.

Effection leverages the idea of [structured concurrency][structured concurrency]
to ensure that you don't leak any resources, and that cancellation is
properly handled. It helps you build concurrent code that feels rock
solid and behaves well under all failure conditions. In essence,
Effection allows you to compose concurrent code so that you can reason
about its behavior.


## Replacing async/await

If you know how to use `async/await`, then you're already familiar with most of
what you need to know to use Effection. The only difference is that instead
of [async functions][async functions], you use
[generators][generators] and replace:

1. `await` with `yield`
1. `async function()` with `function*()`


For example, with `async`/`await`:

``` javascript
import { fetch } from 'isomorphic-fetch';

export async function fetchWeekDay() {
  let response = await fetch("http://worldclockapi.com/api/json/est/now");
  let time = await response.json();
  return time.dayOfTheWeek;
}
```

With Effection:

``` javascript
import { fetch } from '@effection/fetch';

export function *fetchWeekDay() {
  let response = yield fetch("http://worldclockapi.com/api/json/est/now");
  let time = yield response.json();
  return time.dayOfTheWeek;
}
```

## Getting started.

To start using Effection, use the `main` function as an entry
point. In this example, we'll use the previously defined
`getWeekDay`.

``` javascript
import { main } from 'effection';
import { getWeekDay } from './get-week-day';

main(function*() {
  let dayOfTheWeek = yield fetchWeekDay();
  console.log(`It is ${dayOfTheWeek}, my friends!`);
});
```

Let's go through what's going on here:

* The argument to `main` is what's called an `Operation`.
* One example of an operation is a generator function.
* Promises are also operations.
* Inside the generator function we can `yield` to other operations.
* In this case, we yield to the `fetchWeekDay()` operation, which
  itself yields to the `fetch()` operation and the `response.json()`
  operation.
* When the operation passed to `main` completes, the program exits.

Even with such a simple program, Effection is still providing critical
power-ups to you behind the scenes that you don't get with callbacks,
promises, or `async/await`. For example, if you run the above in
NodeJS and hit `CTRL-C` while the request to `http://worldclockapi.com` is
still in progress, it will properly cancel the in-flight request
as a well-behaved HTTP client should. All without you ever having to
think about it. This is because every Effection operation contains
the information on how to dispose of itself, and so the actual act of
cancellation can be automated.

This has powerful consequences when it comes to composing new
operations out of existing ones. For example, we can add a time out of
1000 milliseconds to our `fetchWeekDay` operation (or any operation
for that matter) by wrapping it with the `withTimeout` operation from
the standard `effection` module.

``` javascript
import { main, withTimeout } from 'effection';
import { getWeekDay } from './get-week-day';

main(function*() {
  let dayOfTheWeek = yield withTimeout(fetchWeekDay(), 1000);
  console.log(`It is ${dayOfTheWeek}, my friends!`);
});
```

If more than 1000 milliseconds passes before the `fetchWeekDay()`
operation completes, then an error will be raised.

What's important to note however, is that when we actually defined our
`fetchWeekDay()` operation, we never once had to worry about timeouts,
or request cancellation. And in order to achieve both we didn't have
to gum up our API by passing around cancellation tokens or [abort
controllers][abort controller]. We just got it all for free.

## Discover more

This is just the tip of the iceberg when it comes to the seemingly complex
things that can Effection make simple. To find out more, jump
into the conversation [in our discord server][discord]. We're really
excited about the things that Effection has enabled us to accomplish,
and we'd love to hear your thoughts on it, and how you might see
it working for you.

[structured concurrency]: https://vorpus.org/blog/notes-on-structured-concurrency-or-go-statement-considered-harmful/
[generators]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator
[async functions]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function
[abort controller]: https://developer.mozilla.org/en-US/docs/Web/API/AbortController
[discord]: https://discord.gg/Ug5nWH8
