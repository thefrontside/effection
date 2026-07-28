---
title: "Announcing Effection 4.1"
description: "Six months of soft-launched work rolled into one release: a faster runtime, closer parity with JavaScript's async APIs, and — via a new experimental entry point — Contextual APIs, our take on algebraic effects."
author: "Charles Lowell"
image: announcing-effection-4-1.svg
---

It's been six months since we released Effection 4.0 in December of 2025. Since
that time, we've been tuning, stabilizing, and improving it with new features
that range from incremental to face-meltingly powerful. It's been in the works
all year, but we're happy to finally announce the release of Effection 4.1,
which includes an impressive raft of performance upgrades, better parity with
JavaScript async APIs, and last but not least: a new experimental entry point
whose first member is the peerlessly powerful "Contextual APIs".

Here's the tour:

- ⚡️ **A faster, leaner runtime** — a rewritten priority queue, hot-path
  allocations eliminated, benchmarks watching every commit.
- 🤝 **Closer parity with async JavaScript** — `allSettled()` and `using()` land
  alongside their `Promise`/keyword counterparts.
- 🧬 **The new `experimental` entry point** — home to **Contextual APIs**, our
  take on algebraic effects.

## ⚡️ A faster, leaner runtime

With our trusty robotic sidekicks in tow, we've spent hours delving into the
performance profile of Effection to find out where the highest-impact
optimizations could be found. As a result, we've made Effection's already
simple runtime even faster.

**priority queue**: the hottest path in the system, through which every effect
in every operation flows, is now `O(1)` for both `push()` _and_ `pop()`. Not
only that, but the amount of memory it uses has been drastically cut, which
means less time allocating and less time garbage collecting under load. See
#1171 for details.

**allocation trimming**: There were a bunch of places where the same object was
being re-created over and over again. Each bit of savings was small, but the
sum total of reducing them all to singletons was significant. See #1175, #1176,
#1173 for details.

**performance in CI**: Now that we have these performance gains, we can safely
keep them as we add new features to Effection because we have a series of
benchmarks that gate any new code that gets introduced. From now on, if it
isn't fast, and it isn't efficient, then it isn't part of Effection. See #1169,
#1173.

**a leaner npm package**: The runtime bundle your app actually loads was already
optimal at **5.8 KB min+gzip**, the published tarball has been trimmed down from
**80 KB → 40 KB** on the wire and from **521 KB → 213 KB** unpacked. See #1206.

As a result of these changes, the speed of Effection code has increased anywhere
from 25% to 500% depending on your use-case. See the full arc on the
[CodSpeed dashboard for `v4`](https://codspeed.io/thefrontside/effection/branches/v4),
or the
[current benchmark run](https://codspeed.io/thefrontside/effection/runs/6a4e6c114dafb6245e2f918e)
at HEAD.

## 🤝 Closer parity with async JavaScript

Effection is Structured Concurrency and Effects for JavaScript. Its goal is not
to be a completely separate ecosystem, but to augment the full JavaScript
experience with the addition of async work that is safe by default. To that
end, our mantra is: "If it's part of the JavaScript standard library, then it's
also part of Effection." That's why we've added seamless interoperation between
Effection 4.1 and
[Explicitly managed resources](https://github.com/tc39/proposal-explicit-resource-management).

The proposal is at stage 3 in JavaScript and has been adopted by most browsers
and runtimes, so it made sense to add first-class support in Effection.

### `using()` — meet JavaScript's disposables where they are

Working with explicitly managed resources is almost _easier_ in Effection than
it is in vanilla JavaScript. That's because instead of a bunch of syntactic
variants, as well as the normal sync/async divide, in Effection there is just a
single simple function to learn: `using()`. It allows us to work with any type
of resource: synchronous or asynchronous. For example, if you have a Connection
object that needs to be closed upon scope exit, you might write it in
JavaScript like:

```js
function main() {
  await using connection = new Connection();
  connection.send("hello");
} // connection[Symbol.asyncDispose]() runs here
```

The equivalent in Effection with `using()` is nearly identical:

```js
import { using } from "effection";

function* main() {
  let conn = yield* using(new Connection());
  conn.send("hello");
} // conn[Symbol.asyncDispose]() is awaited when the enclosing scope exits
```

It's nice because it works the same whether you're doing an async operation
over the network, or just something synchronous locally. Here's an example
using a synchronous lock mechanism:

```js
import { mutex } from "mutex";

function main() {
  using _lock = mutex.lock();
  /* ... */
  // _lock[Symbol.dispose]() is called here
}
```

Again, the equivalent in effection with `using()` is almost identical. The only
difference is that it does not even need to declare a fake `_lock` variable.

```js
import { mutex } from "mutex";

function* main() {
  yield* using(mutex.lock());
  /* ... */
  // mutex.lock()[Symbol.dispose]() is called here
}
```

### `createScope()` returns an explicty manageable resource

If you are integrating with Effection from the outside in, great news! You can
now treat Effection scopes as explicitly managed resources:

```js
async function main() {
  await using scope = createScope();

  scope.run(function* () {
    try {
      console.log("hello world");
      yield* suspend();
    } finally {
      console.log("goodbye world");
    }
  });

  //=> prints "goodbye world"
}
```

### `Task` is an explicitly manageable resource

For even finer grained control, `Task` itself is an explicitly managed resource.
This means you can pass a scope around, but align tasks you create with it along
an async function:

```js
async function handleRequest({ request, signal, scope }) {
  await using task = scope.run(function* () {
    /* handle request */
  });

  await new Promise((resolve) => signal.addEventListener("abort", resolve));
}
```

As always, see the
[Async Rosetta Stone](https://frontside.com/effection/guides/v4/async-rosetta-stone/)
for details.

## 📦 A leaner npm package

Weighing in at just under 5.8 KB, the Effection runtime has been always been
miniscule in relation to how much power it delivers, but at the same time, we've
shipped a lot of bloat with the NPM package that is either unecessary debugging
artifacts, or straightup un-usable files like Changelogs. With 4.1 We've begun
the process of cleaning that up, and the results are satisfying.

- **download size:**: 80 KB → 40 KB (-49%)
- **unpacked size:**: 521 KB → 213 KB (-59%)

This means you'll consume half the bandwidth to download Effection, and less
than half the disk space to develop with it. It goes without saying however,
that the ultra light bundle size of the runtime remains unchanged.

See [#1206](https://github.com/thefrontside/effection/pull/1206) for details.

## 🧬 The `experimental` entry point — and Contextual APIs

Effection has evolved over the last eight years from a tool used exclusively
behind the firewall into a popular library with hundreds of users and dependent
projects. At the beginning we were able to "move fast and break things" because
every single user was an early adopter and only a single chat message away.
Nowadays, the impact of getting an api wrong and needing to change it afterwards
could mean a massive pain to current users. But we want to keep that ability to
evolve the api, while at the same time maintaing a commitment to current users
that the public api will change only where needed, and then only between major
versions. In other words: "move fast, don't break things."

To that end, we're introducing a new "experimental" module to effection where
you can tap into APIs that are mature enough for us to be confident in their
power, but not quite mature enough that we're 100% willing to commit to an API
surface that is set in stone.

To use an experimental feature (we'll use the fictional `future` feature),
import it from `effection/experimental`

```js
import { future } from "effection/experimental";

console.log({ future });
```

You can use the bleeding edge features as they become available, but only if
opt-in with open eyes.

### Contextual APIs — algebraic effects, the Effection way

Our very first experimental feature is a juggenaut of win that let's you
breezily do everything from mocking in tests, to runtime instrumentation, or
even dependency injection. A cousin to "algebraic effects" from the functional
programming world which we're calling it "Contextual APIs". In plain terms, it
allows you to declare the intent to use an api, but have the current scope and
its ancestors coordinate to decide what actually happens when you invoke it.

To create a contextual api, use the `createApi()` function. We'll use a logging
api as an example:

```js
// logging.js
import { createApi } from "effection/experimental";

export const logging = createApi("logging", {
  *info(msg): Operation<void> {
    console.log(msg);
  },
  *warn(msg): Operation<void> {
    console.warn(msg);
  },
})

// the `operations` attribute of an api contains operations that
// invoke the members of an api.
export const { info, warn } = logging.operations;
```

We can now use the `info` and `warn` operations to log messages to the console.

```js
import { main } from "effection";
import { info } from "./logging.js";

await main(function* () {
  yield* info("this is info");
  yield* warn("this is a warning");
});
// prints:
//   this is info
//   this is a warning
```

But what makes contextual apis special is that you can add middleware around any
of them to change their behavior. Let's say we want to add prefixes to each type
of message. We can do that by using `Api.around()` to "wrap" the api with
middleware.

```js
import { main } from "effection";
import { logging, info } from "./logging.js";

await main(function*() {
  yield* logging.around({
    info([msg], next) {
      return next(`INFO: ${msg}`);
    },
    warn([msg], next) {
      return next(`WARN: ${msg}`);
    },
  });
  
  yield* info("this is info");
  yield* warn("this is a warning");
});
// prints:
//   INFO: this is info
//   WARN: this is a warning
```

Notice how we did not need to change the api itself, only the context in which
it operating? And Therein lies the superpower. Because api middleware is stored
on the scope, it makes it easy to precisely define the boundaries over which a
change in behavior is in effect.

Let's completely silence `info` messages and only show warnings is a child:

```js
import { main } from "effection";
import { logging, info } from "./logging.js";

await main(function*() {
  yield* logging.around({
    *info([msg], next) {
      return yield* next(`INFO: ${msg}`);
    },
    *warn([msg], next) {
      return yield* next(`WARN: ${msg}`);
    },
  });
  
  let child = yield* spawn(function*() {
    yield* logging.around({
      // do not invoke the `next()` function
      // effectively silencing `info()`
      *info() {},
    });
    
    yield* info("child info");
    yield* warn("child warning");
  });
  
  yield* info("this is info");
  yield* warn("this is a warning");
  yield* child;
});

// prints:
//   INFO: this is info
//   WARN: this is a warning
//   WARN: child warning
```

There are two things to notice: first, the `info()` was _only_ silenced in the
child scope, not in the main scope. This is because the api middleware was only
present in the child's scope. The secord thing to recognize is that the child
`warn()` _does_ receive the prefix. That is because it contains not only its own
middleware, but also the middleware of all its ancestors.

There is a even more to them that, but hopefully this gives you an inkling of
the power they posess and why we're so excited about having them in Effection.
See #1211, #1101, #1183 for details.
