---
title: "Why Laziness Matters in Effection"
description: "Async functions start running the moment you call them. Effection operations don't start until you yield them — and that difference changes how you reason about execution and lifetime."
author: "Joshua Amaju"
tags: ["effection", "operations", "laziness"]
image: "why-laziness-matters-in-effection.svg"
---

In JavaScript, async functions are eager by default. Calling an async function
immediately starts executing its body and returns a `Promise` representing that
work.

Take the following example:

```js
async function longOperation() {
  console.log("starting...");
  await new Promise((resolve) => setTimeout(resolve, 3000));
  console.log("done");
}
```

Calling the function starts executing it immediately.

```js
longOperation();

// output:
// starting...
// done
```

This makes it easy to accidentally start expensive asynchronous work that you
never end up using, or leave work running after the code that started it no
longer cares about the result.

In Effection, operations are lazy by default. An Effection operation doesn't
start executing until it is actually evaluated.

Let's take a look at the same example using Effection:

```js
import { sleep } from "effection";

function* longOperation() {
  console.log("starting...");
  yield* sleep(3000);
  console.log("done");
}
```

Calling the function does nothing:

```js
longOperation();

// no output
```

The operation has been created, but none of its code has started executing.

For the operation to begin, we have to `yield*` it to the Effection runtime:

```js
import { run } from "effection";

await run(function* () {
  yield* longOperation();
});

// output:
// starting...
// done
```

This means simply creating an operation does not accidentally start work. You
decide when that work should begin by yielding it.

And once an operation does start, Effection's structured concurrency ensures
that its lifetime is tied to the scope that started it.

So unlike a Promise, which generally represents work that has already started,
an Effection operation describes work that can be started deliberately.

Effection separates operation description from operation execution, which makes
execution and lifetime more deliberate.
