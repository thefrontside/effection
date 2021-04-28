[![npm](https://img.shields.io/npm/v/effection.svg)](https://www.npmjs.com/package/effection)
[![bundle size (minified + gzip)](https://img.shields.io/bundlephobia/minzip/effection)](https://bundlephobia.com/result?p=effection)
[![CircleCI](https://circleci.com/gh/thefrontside/effection.svg?style=shield)](https://circleci.com/gh/thefrontside/effection)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Created by Frontside](https://img.shields.io/badge/created%20by-frontside-26abe8.svg)](https://frontside.com)
[![Chat on Discord](https://img.shields.io/discord/700803887132704931?Label=Discord)](https://discord.gg/Ug5nWH8)

# Effection

A framework for building concurrent systems in JavaScript and TypeScript.

JavaScript has gone through multiple evolutionary steps in how to deal with
concurrency. From callbacks and events, to promises and finally to async/await.
However, while dealing with concurrency certainly has become easier, many challenges
remain, and it can be difficult to write concurrent code which is both correct
and composable. Unless great care is taken, it can be very easy to leak resources.
Most JavaScript code written to do does not handle cancellation very well, and failure
conditions can easily lead to dangling promises and other unexpected behaviour.

Effection leverages the idea of [structured concurrency][], to ensure that you
don't leak any resources, and that cancellation is properly handled. Effection
helps you build concurrent code which feels rock solid and behaves well under
all failure conditions. Effection allows you to compose concurrent code so that
you can reason about its behaviour.

## What is Effection?

Effection consists of a small core and an expanding set of libraries built on top
of this core which provide various concurrency primitives.

The following packages are considered production ready and re-exported by the `effection`
package:

- `@effection/main`: A main entry point for Effection applications for node and browser
- `@effection/subscription`: Subscription and stream processing for reactive style coding
- `@effection/channel`: Broadcast channels for communication via a message bus
- `@effection/events`: Integrate with evented code both in node and in the browser

Additionally the following packages are cosidered production ready:

- `@effection/process`: Process spawning and management
- `@effection/fetch`: Wrapper around `fetch` to fetch remote resources
- `@effection/mocha`: Mocha integration to simplify testing of Effection-based code

The following packages are considered beta level:

- `@effection/atom`: A state store
- `@effection/react`: Integration with React
- `@effection/websocket-client`: A client for communication across websockets
- `@effection/websocket-server`: A server for communication across websockets

## Why use Effection?

Using Effection provides many benefits over using plain Promises and async/await code:

- **Cleanup:** Effection code cleans up after itself, and that means never having
  to remember to manually close a resource or detach a listener.
- **Cancellation:** Any Effection task can be cancelled, which will completely
  stop that task, as well as stopping any other tasks this operation itself has
  started.
- **Synchronicity:** Unlike Promises and async/await, Effection is fundamentally
  synchronous in nature, this means you have full control over the event loop
  and operations requiring synchronous setup remain race condition free.
- **Composition:** Since all Effection code is well behaved, it composes easily, and there
  are no nasty surprises when trying to fit different pieces together.

## Replacing async/await

At its most elementary level, Effection uses JavaScript generators to drive
your concurrent code. Generators are similar to async/await and have a similar
syntax.

With `async`/`await`:

``` javascript
async function printDay() {
  let response = await fetch("http://worldclockapi.com/api/json/est/now");
  let time = await resonse.json();

  console.log(`It is ${time.dayOfTheWeek}, my friends!`);
}
```

With Effection:

``` javascript
function *printDay() {
  let response = yield fetch("http://worldclockapi.com/api/json/est/now");
  let time = yield response.json();

  console.log(`It is ${time.dayOfTheWeek}, my friends!`);
}
```

As you can see, we have replaced the `async` function with a generator function
using the `*` annotation on the function. We have replaced `await` with
`yield`.

## Getting started

Let's write a simple program using Effection!

```
npm init my-effection-example
cd ./my-effection-example
npm install effection
```

Let's add an `index.mjs` file like this:

``` javascript
import { main, sleep } from 'effection';

main(function*() {
  console.log('hello from effection!');
  yield sleep(1000);
  console.log('hello again!');
});
```

Let's go through what's going on here:

- `main` is the main entry point when you're writing Effection programs.
- The argument to `main` is an [Operation][].
- One example of an operation is a generator function.
- Promises are also operations
- Inside the generator function we can `yield` to other operations.
- `sleep` is an operation provided by effection. When yielded to, it suspeds
  the operation for the given number of milliseconds.
- When the operation passed to `main` completes, the program exits.

Let's use our newfound knowledge to write a program to fetch the current weekday.

We will need to install the `@effection/fetch` package:

```
yarn add @effection/fetch
```

Now we can modify our program:

``` javascript
import { main, sleep } from 'effection';
import { fetch } from '@effection/fetch';

function *printDay() {
  let response = yield fetch("http://worldclockapi.com/api/json/est/now");
  let time = yield response.json();

  console.log(`It is ${time.dayOfTheWeek}, my friends!`);
}

main(printDay);
```

Instead of having a `printDay` function, let's make this more composable by
making a `fetchWeekDay` function which returns the current weekday:

``` javascript
import { main, sleep } from 'effection';
import { fetch } from '@effection/fetch';

function *fetchWeekDay() {
  let response = yield fetch("http://worldclockapi.com/api/json/est/now");
  let time = yield response.json();
  return time.dayOfTheWeek;
}

main(function*() {
  let weekDay = yield fetchWeekDay();
  console.log(`It is ${weekDay}, my friends!`);
});
```

If you've used `async`/`await before, this should feel fairly familiar! However,
Effection has a lot of tricks up its sleeve.

[structured concurrency]: https://vorpus.org/blog/notes-on-structured-concurrency-or-go-statement-considered-harmful/
[operation]: http://example.com
