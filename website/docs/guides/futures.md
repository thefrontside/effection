---
id: futures
title: Futures
---

We mentioned in the [introduction][] that Effection is fundamentally
synchronous. What we mean by this is that any `Task` *could* complete
synchronously. Most of the time, tasks do take a while to complete, but
sometimes they do not, and can in fact complete instantaneously.

This is different from Promises and `async/await`. The Promise specification
requires that promises *always* complete asynchronously. And while they might
complete *very quickly*, they always have to release the event loop to do so.

There are good reasons for this behvaiour in promises, mostly related to error
handling, but requiring the event loop to be released also has downsides.

Let's look at an example of where releasing the event loop might be an issue.
Imagine you are writing an application for the browser and you want to handle
`click` events. We would like to intercept the click event and prevent the
default behaviour. We could write our code like this:

``` javascript
import { main, once } from 'effection';

main(function*() {
  let event = yield once(document.body, 'click');
  event.preventDefault();
  console.log('you clicked!');
});
```

If our `yield` point released the event loop after the click occurred, then the
default action has already happened by the time we call `preventDefault`. This
is no good, we need `once` to resolve *synchronously*.

A simplified promise based implementation of `once` could look like this:

``` javascript
export function once(source, eventName) {
  return (task) => {
    return new Promise((resolve) => {
      source.addEventListener(eventName, resolve);
      task.finally(() => {
        source.removeEventListener(eventName, resolve);
      });
    });
  }
};
```

Since the returned `Promise` always resolves asynchronously, we end up releasing
the event loop before we're able to call `preventDefault`. This will not work.

Implementing `once` using a `Generator` is possible by writing the generator
implementation manually, but it is very awkward, and getting it right is very
difficult.

To solve this problem, we can use a [Future][].

A Future is similar to a Promise, and it can also act like a Promise when
needed. But a Future can also be consumed using `consume`, which resolves
completely synchronously.

Here is how we can implement `once` using a Future:

``` javascript
import { createFuture } from 'effection';

export function once(source, eventName) {
  return (task) => {
    let { future, resolve } = createFuture();
    let listener = (value) => resolve({ state: 'completed', value });
    source.addEventListener(eventName, listener);
    task.consume(() => {
      source.removeEventListener(eventName, listener);
    });
    return future;
  }
};
```

Note that a `Task` is also a Future, and so we can consume it using `consume`.

## Error handling

One key differences between futures and promises is that futures are not well
behaved when it comes to error handling. You should make sure never to throw an
error in `consume`.

Futures are low-level and exist to implement some operations which would
otherwise be difficult to implement with Effection, they are not meant to be
general-purpose in the same way that promises are. Many operations can be
implemented using promises just fine, and if you can do so you should prefer
Promises over Futures, since they are easier to reason about, and easier to
compose.

[introduction]: /docs/guides/introduction
[future]: /api
