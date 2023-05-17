---
id: tasks
title: Tasks and Operations
---

In the introduction, we saw how we can replace `async/await` with Effection.
Let's break down a bit further what is going on!

When you have an [async function][], and you call this function, you get back a
[Promise][]. When you call a [Generator function][] you get back a [Generator][]. This
is slightly different in that a Generator needs to be iterated in order to actually
do anything, while a Promise will make progress on its own.

If you run the following, it will print `Hello World!` to the console:

```javascript
async function sayHello() {
  console.log("Hello World!");
};

sayHello();
```

But this will not print anything:

```javascript
function *sayHello() {
  console.log("Hello World!");
};

sayHello();
```

### Tasks

We need something to "drive" the iteration of the Generator, and in Effection this is
a [`Task`][task]. Tasks have other responsibilities as well, as we'll see when we talk about
[`spawn`][spawn].

We can use the [`run`][run] function from Effection which takes a generator function
and returns a [`Task`][task].

```javascript
import { run } from 'effection';

run(function*() {
  console.log("Hello World!");
});
```

You should see this print `Hello World!` to the console, as you'd expect.

The return value we get from `run` is a `Task`. A `Task` can act like a `Promise`, so
we can use it with `await`, to integrate Effection into existing `async/await` code,
and we can also use `catch` to catch any errors the occurred in the task. There are
also some other things that tasks can do, for example they can spawn other tasks.

```javascript
import { run } from 'effection';

let task = run(function*() {
  throw new Error('oh no!');
});

task.catch((error) => {
  console.error(error);
});

console.log('running task', task.id) // tasks have a unique ID
```

We have already met the function `main`, which is very similar to `run`. `main`
takes care of a few things for you, like cleaning up when the process shuts
down, and printing errors to the console in case anything goes wrong. If you're
writing a program with Effection from scratch, you should normally use `main`
as the entry point for your program. `run` is a bit more low-level and can be
useful when you're integrating Effection into an existing codebase.

Using `main` our example looks like this:

```javascript
import { main } from 'effection';

main(function*() {
  throw new Error('oh no!');
});
```

You should see this print an error with nice formatting.

### Operations

As we saw, we can pass a generator function as an argument to `run` and `main`, but these
functions are actually a bit more general than that. In Effection we call the type of the
argument an `Operation`. An `Operation` can be any of:

- A [Generator function][] – as we've seen
- A [Generator][]
- An [async function][]
- A [Promise][]
- Another [`Task`][task]
- A [`Future`][future] – a sort of synchronous Promise, we will cover this in a later guide
- A [`Resource`][resource] – an advanced concept that enables interaction with long-running processes

Additionally you can also call `run` and `main` without any argument, this will
suspend indefinitely.

### Yield

We have seen that we can use `yield` inside of a generator function to call other generator
functions. In fact, we can use `yield` to call any other operation!

For example we can use `yield` to wait for a Promise to resolve:

```javascript
import { main } from 'effection';

main(function*() {
  let text = yield Promise.resolve("Hello World!");
  console.log(text);
});
```

We can also use `yield` with another generator function:

```javascript
import { main, sleep } from 'effection';

main(function*() {
  let text = yield function*() {
    yield sleep(1000);
    return "Hello World!";
  }
  console.log(text);
});
```

Or with a generator:

```javascript
import { main, sleep } from 'effection';

function* makeSlow(value) {
  yield sleep(1000);
  return value;
}

main(function*() {
  let text = yield makeSlow('Hello World!');
  console.log(text);
});
```

Finally, if we use `yield` without an argument, it will suspend indefinitely:

```javascript
import { main } from 'effection';

main(function*() {
  yield;
  console.log('We will never get here!');
});
```

[generator function]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*
[generator]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator
[async function]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function
[promise]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
[task]: https://frontside.com/effection/api
[run]: https://frontside.com/effection/api
[spawn]: /docs/guides/spawn
[future]: /docs/guides/futures
[resource]: /docs/guides/resources
