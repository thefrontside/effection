---
Start Date: 2020-05-26
RFC PR: https://github.com/thefrontside/effection/pull/128
GitHub Issue: https://github.com/thefrontside/effection/pull/128
---

## Summary

Provide an expressive syntax for both producing and consuming streams
of data within effection operations.

## Basic example

The following  demonstrates a hypothetical in which we are running an
upload operation. The `upload()` is an iterable operation that yields
a stream of progress events that indicate how much is currently
uploaded and how much remains. We can consume this iterable with the
following code that passes off the individual progress events to the
`updateProgressBar` operation.


```js
import { forEach } from 'effection';
import { upload } from '@myapp/file-upload';

function * uploadFile(file) {
  yield forEach(upload(file, 'https://s3.amazon.com'), function*(progressEvent) {
    yield updateProgressBar(progressEvent)
  });
}
```

On the producer side, we can define the upload operation as an
operation that returns a Subscription:

```js
import { once } from '@effection/events';
import { Subscribeable } from 'effection';

function upload(file, url) {
  return Subscribeable<ProgressEvent, XMLHttpRequest>(function* (publish) {
    let xhr = new XMLHttpRequest();
    xhr.open('PUT', url);

    xhr.upload.progress = publish;

    yield once(xhr, 'loadend');

    return xhr;
  })
}
```

## Motivation

As we've been working with more and more complex effection
applications, a very common pattern is to write some sort of loop and
then perform some operation again and again on that loop. There's a
lot of boilerplate around this, and a lot of different patterns that
all represent the same fundamental algorithm.

1. execute an operation to subscribe to some stream
2. execute a series of operations for each element in the stream until
   the stream is exhausted (if it is ever exhausted)
3. optionally return some value when it is recognized mid-stream.


If there is some shared way of abstracting this pattern with a single
API, then not only will it reduce the amount of noise for consuming
and producing these types of iterations, but more importantly, it will
mean we can develop a larger set of shared abstractions which can
operate over all effection iterables: things like `map`, `filter`,
`reduce`, etc...

## Detailed design

### Defining Subscribeables

To make the implementation as acceptable to JavaScript norms, this
specification hues very closely to the [iteration][1] and [async
iteration][2] protocols. AS such, the proposal also follows the
established "Symbol delegate" pattern where any object can specify how
it will behave in a given context by using a well-known,
non-enumerable method to create a subscription. Similar to
`Symbol.iterator`,`Symbol.asyncIterator`, and `Symbol.observable`,
tThe `Symbol.subscription` method on any object should be a function
that returns an _operation_ that returns a `Subscription` object. A
subscription object with a is any object that has a `next()` operation
which, when evaluated returns a subscription result. The subscription
result will have a `done` property which, if true indicates that this
subscription has been exhausted and will no longer return any new
results.


### TypesScript Interfaces

The strict definition of the protocol is presented here as TypeScript
interfaces since they're unambigous.

```ts
const SymbolSubscription: symbol;

interface Subscribeable<T, TReturn = T, TNext = undefined> {
  [SymbolSubscription](): Operation<Subscription<T, TReturn, TNext>>;
}

interface Subscription<T, TReturn = T, TNext = undefined> {
  next(): Operation<IteratorResult<T, TReturn>>;
  unsubscribe(): Operation<void>;
}
```

### Consuming Raw Subscribeables

The lowest level API is manual iteration. For example, if we were to
use the raw interface to consume the `upload()` subscribeable in the
original example, it would look something like this:

```js
import { SymbolSubscription } from 'effection';
import { upload } from '@myapp/file-upload';
function * uploadFile(file) {
  let ul = upload(file, upload(file, 'https://s3.amazon.com'));
  let subscription = yield ul[SymbolSubscription]();

  try {
    while (true) {
      let { done, value } = yield subscription.next();
      if (!done) {
        yield updateProgressBar(value);
      } else {
        return value;
      }
    }
  } finally {
    yield subscription.unsubscribe();
  }
}
```

Note that when using the raw interface, it is necessary to manually
call the unsubscribe operation. This decouples the raw subscription
API from the resource API, and makes it possible to assume that the
subscription may not be originating from within an effection context.

> We _could_ mandate that the `[SymbolSubscription]()` operation
> generate a resource instead, which is something worth considering,
> but it would increase the cognitive overhead of implementing a raw
> subscribeable. Instead I've left this implementation in user-space,
> since we will have helpers both for consuming and producing
> subscriptions that will make raw-subscription iteration very, very
> rare.

### Consuming Subscribeables

In practice, it's expected that you would virtually never consume a
subscription using the raw API. Instead, you can use the builtin
`subscribe` and `forEach` functions.

#### `subscribe`

```ts
declare function subscribe<T>(subscribeable: Subscribeable<T>): Operation<Subscription<T>>;
```

This is one step above consuming the raw subscribeable interface
directly. This will invoke the symbol delegate method for you, and
furthermore, it will convert the resulting subscription into a
resource which will automatically unsubscribe when the resource passes
out of scope.


```js
import { subscribe } from 'effection';
import { upload } from '@myapp/file-upload';

function * uploadFile(file) {
  let ul = upload(file, upload(file, 'https://s3.amazon.com'));
  let subscription = yield subscribe(ul);

  while (true) {
    let { done, value } = yield subscription.next();
    if (!done) {
      yield updateProgressBar(value);
    } else {
      return value;
    }
  }
```

Note the conspicuous absence of any explicit teardown code. This would
be due to the auto creation of the subscription resource.


### Producing Subscriptions

Much in the same way that it's unexpected that user-land code will
consume subscriptions in their raw form, it's also not expected that
user-land code will produce subscriptions in their raw form. Instead,
you can use the `createSubscription` function which returns an operation
that constructs an instance of the `Subscription` interface.

```js
import { once } from '@effection/events';
import { createSubscription } from 'effection';

function upload(file, url) {
  return {
    [SymbolSubscription]: () => createSubscription(function*(publish) {
      let xhr = new XMLHttpRequest();

      xhr.upload.onprogress = publish;

      try {
        yield once(xhr, 'loadend');

        return xhr;
      } finally {
        xhr.abort();
      }
    })
  }
}
```

The `publish` parameter to the operation constructor is a normal
function that produces the next result on the subscription. It is
_not_ an operation, and should _not_ be called within an effection
operation. It's more like an entry point _into_ effection. It _must_
publish values in the next tick of the event loop, so that if it is
called within an effection context, that context is yielded when the
published value is consumed..

In TypeScript, the type of this publication function. It will publish the
subscription into the next

```ts
declare function createSubscription<T,TReturn,TNext>(subscriber: Subscriber<T,TReturn,TNext>): Operation<Subscription<T,TReturn,TNext>;

interface Subscriber<T, TReturn, TNext> {
  (publish: ((value: T) => void), getNext: Operation<TNext>): Operation<TReturn>;
}

```

> For most subscriptions, data flow is one way, and the consumer of
> the subscription does not need to push data back to the subscription
> source. In this context the `getNext` parameter isn't needed, and
> the subscriber function need not use it.
>
> See the section on Subscription Co-routines for the meaning of the
> `getNext` parameter to the

We could see how to implement the `on` event handler using this API:

```js
export function on(target, eventName) {
  return createSubscription(function*(publish) {
    try {
      addListener(target, eventName, publish);
      yield;
    } finally {
      removeListener(publish);
    }
  })
}
```

If you are using the `createSubscription` operation to create your
subscription, then there is no need to make a resource since one will
be create for you.

### Higher Order Subscribeables

Once we have the core iteration protocol defined, then we can use it
to lift different types of functions into the subscription context. To
do this, we provide the `Subscribeable` namespace which lets us derive
new subscribeables from upstream ones in a highly composeable
fashion. example:

```js

// compute the total bytes sent during an upload:
let totalBytes = yield Subscribeable.from(upload(file, bucket))
  .map(progress => progress.loaded)
  .reduce((total, bytes) => total + bytes, 0);
```

For the following examples, we'll assume that they are happening in
the context of a `Subscribeable<T, TReturn, TNext>`;

#### `.map(fn)`

Converts a subscribeable into another subscribeable, with each item in
the substribeable transformed by the function `fn`. This does not
change the return type of the subscribeable, nor its `TNext`

```ts
map<X>(derive: (item: T) => X): Subscribeable<X,TReturn,TNext>;
```

#### `.contramap(fn)`

Derives a new subscribeable whose `next()` method is pre-transformed
by `fn`. This doesn't make any sense to use this unless you are
treating a subscription [like a co-routine][#subscription-co-routines]
since it does not effect either `T` or `TReturn`.

```ts
contramap<TNextNew>(fn: (value: TNextNew) => TNext): Subscribeable<T,TReturn,TNextNew>;
```

#### `.reduce(accumulator, initial)`

Converts a subscribeable into an operation that produces a single
accumulated value from all of the items of the subscription.

> ⚠ Heads Up! The accumulation function does not see the return
> value (`TReturn`), only individual items (`T`).

```ts
reduce<R>(visit: (result: R, item: T) => R, initial: R): Operation<R>;
```

#### `.filter(predicate)`

Returns a new `Subscribeable` whose subscriptions skip all the
elements that do not match predicate:

```ts
filter(predicate: (item: T) => boolean): Subscribeable<T,TReturn,TNext>;
```

#### `.concat(subscribeable)`

Returns a new `Subscribeable` whose subscriptions generate first the
original subscribeable followed by the content of `subscribeable`:

```ts
concat(subscribeable: Subscribeable<T,TReturn>): Subscribeable<T,TReturn,TNext>;
```

#### `.take(count)`

Returns a new `Subscribeable` truncated to `count` ittems.

```ts
take(count: number): Subscribeable<T,TReturn | void,TNext>
```

#### `.first()`

Converts a `Subscribeable` into an `Operation` that produces the first
item of the subscription:

```ts
first(): Operation<T|undefined>
```

#### `.forEach(visit)`

Converts a `Subscribeable` into an `Operation` that visits each item in
the subscription, and returns the subscription's return value. The
result of each iteration will be sent to the underlying subscription's
`next()` operation.

```ts
forEach(visit: (item: T, index: number) => Operation<TNext>): Operation<TReturn>;
```

> ⚠ Heads Up! Subscribeable#forEach will also be available as a
> stand-alone function that can be imported directly

### Subscription Co-routines

For advanced use cases, consumers of a subscription may need to
communicate _back_ to the source of the subscription. For example,
lets say that we're making an incremental language parser that
publishes tokens from input, and then builds up an AST as a
result. Perhaps we could model the parser as a
`Subscribeable<Token,Program,AST>` in other words, the parser is a
subscription that streams `Tokens` and returns a fully formed
`Program`, but at each point it is up to the subscriber to pass the
incrementally built `AST` back to the publisher. In this event, you
can use the `getNext` parameter that is passed into the
`createSubscription` operation:

```js
function * parse(input) {
  return createSubscription(function*(publish, getNext) {
    let ast = null;
    try {
      input.on('token', publish)
      while (true) {
        let { done, value: ast } = yield getNext;
        if (done) {
          return new Program(ast);
        }
      } finally {
        input.off('token', publish);
      }
    }
  });
}

```

## Drawbacks

I'd say the number one reason not to do this is that it increases the
surface API of effection and adds to the number of concepts that we,
and new users have to hold in our heads.

We don't want to get too crazy with the monoidal, functorial madness
because one of the _strengths_ of effection is that it allows you to
express flow control using simple, imperative contstructs like
`while`, `for-of` loops, and `try/catch/finally` blocks. This could
potentially blur the line about which programming style one should
use.

One of the great things about effection is that it so little API on
top of pre-existing JavaScript. I worry that if we introduce something
big it could muddy the water of what is a fundamentaly simple idea.

Finally, an interface as foundational as this could be difficult to
back out of. Is this right paradigm that we want to guide our users
to?

## Alternatives

There are two primary altertatives: do nothing, or do a partial
implementation, both of which are viable options. If we do nothing,
things remain simple. We use the built in constructs we get from
JavaScript. There is less to learn, and less to teach, but of course
then we have to live with the situation we have now which is many
one-off classes like mailboxes, channels, event streams, atom
streams, etc.... that also have their own partially wrought iteration
apis.

We could also implement the only a portion of these things here. In
fact, I've outline what I think are the natural layerings of API in
the next section. For example, we could decide to _never_ support
co-routine subscriptions.

## Adoption strategy

I propose we implement subscriptions in parallel with the development
of this RFC. Specifically, that we start with the most basic
components of it, try them out in real, production code, and then once
satisfied, move on to the next level.

### Level 1

Before anything else, we need the basic mechanism to create and
iterate over subscriptions. That means the implementation of the
`createSubscription()` operation on the production side, and then the
`subscribe()` operation on the consumption side. For level 1 support,
we will not support co-routine subscriptions (in effect, `TNext` will
always be `undefined`)

With these two operations in place, this will allow us to externally
iterate everywhere (albeit manually) and we can plug this in
everywhere we're using any form of iteration.

### Level 2

When we're satisfied that manual iteration is sound, we can add the
static `forEach` helper to make using subscriptions even more
ergonomic. Behind the scenes, we'll implement
`Subscribeable.from()` to make this work, but we will not expose it as
a public API yet. In other words:

```
export const forEach = (subscribeable, visitor) => Subscribeable.from(subscribeable).forEach(visitor);
```

### Level 3

With basic iteration and `Subscribeable.from()` in place (but not
exposed) we can begin to unveil it on an as-needed basis. My guess is
that we'd want `map()` first, then perhaps `filter`.

Level 3 implementation will continue as long our as short as needed.

### Level 4

Ipmelements co-routine subscriptions as needed.


## How we teach this

In the abstract, if we can stick as close to the native JavaScript
iteration protocols, then we can lean on all the different heavy
lifting out there. We need to hammer home again and again that
`Subscribeable` is congruous with `Iterable` and `Observable`.

More concretely, we'll want to build up a really great catalog of
examples that show the various aspects of iteration and how you might
use them. It would be good to take a peak at highly rated iterator
tutorials, observable tutorials. In spirit, subscriptions are most
closely aligned with async iterators and so we could potentially draw
on the reservoir of examples in that space.


## Unresolved questions

- [ ] Should this go in effection core? I have it there now, but it's
  a pretty big addition.
- [ ] I _think_ that we can transparently convert any `AsyncIterator`
  to a subscription. Is this worth exploring in the same way that we
  can transparently convert promises to operations?
- [ ] Should reduce happen over the return value? It makes the typing
  more complex if the accumulator has to accept `T | TReturn`. But
  then it feels weird that the last value is not allowed to be a part
  of the reduction...
- [ ] In addition to a `next()` method, if we're using co-routine
  subscriptions, then we probably need a throw method on subscription
  as well. At that point
- [ ] One thing that is great about using basic programming statements
  like `if`, `while`, `for` and friends is that you inherit the return
  scope, so you can return directly. Is there a way to replicate this
  with our `forEach()` operation?
- [ ] should manual unusbscribe be a part of the API? I'm not sure


[1]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols
[2]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of
