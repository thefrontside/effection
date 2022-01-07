---
id: typescript
title: TypeScript
---
Effection is written in TypeScript and comes bundled with its own type
definitions. Effection doesn't require any special setup to use in a
TypeScript project, but there are some TypeScript specific
idiosyncrasies to keep in mind. This section describes these
idiosyncrasies and what you can do to make development experience of
using Effection in your TypeScript project as painless as possible.

## Operations

There are [many different kinds of operations][operations] in
Effection, but wherever possible, you should just refer to the
`Operation` type which encompasses them all. After all, the point of
an operation is to produce a value. How it produces that value is
really an implementation detail that consuming code should not be
concerned with. Note in particular that the return type of a generator
function whose result is of type `T` should be `Operation<T>`.

**Good**
```ts
import type { Operation } from 'effection';

export function* generator(): Operation<boolean> {
 return true;
}

export function future(): Operation<boolean> {
  return Future.resolve(true);
}

export async function promise(): Operation<string> {
  return "hello";
}

export function resource(): Operation<number> {
  return {
    name: "true",
    *init() { return 42; }
  }
}
```

However, often your IDE will suggest or autocomplete a type for your
operation that is more "raw" or low level, and while that may satisfy the
minum requirement for typechecking, It's best to correct them to the simple
`Operation<T>` type which will work in all cases, and will be forwards
compatible should you decide to change the implementation of your operation
in the future.

**Bad**
``` typescript
import type { OperationIterator, Resource, Future } from 'effection';

export function* iterator(): OperationIterator<boolean> {
  return true;
}

export function* generator(): Generator<any, boolean> {
  return true;
}

export function future(): Future<boolean> {
  return Future.resolve(true);
}

export function resource(): Resource<number> {
  return {
    name: "Life the Universe and Everything",
    *init() { return 42; }
  }
}
```

## Generators

Most Effection operations are written using JavaScript [generators][].
However, because of [limitations in the way TypeScript understands
them][1], it is not currently possible for the type system to express
the relationship between the left and right hand side of a yield
expression.


``` typescript
function* () {
  // response is of type `any`
  let response = yield fetch('some.json');

  // the generator return type is `any`
  return yield response.json();
}
```

There are two ways to cope with this: manual type annotations, or wrapper
functions.

### Manual Annotation

You can explicitly mark the type of the left hand side with its expected type.
This will let you work with intermediate values according to their type, so that
if you try to call a method that does not exist, you will get a type error.

``` typescript
function*() {
  let response: Response = yield fetch('some.json');

  // type checking will fail unless `response` has
  // a `.json()`. The inferred type of the operation
  // is JSON
  return (yield response.json()) as JSON
}
```

Of course, the compiler will happily accept whatever manual type you choose,
and so you should take care to make certain that it is correct. The following
will result in an error at runtime.

``` typescript
function*() {
  let response: Response = yield Promise.resolve("wat");

  // TypeError: "wat".json is not a function
  return yield response.json();
}
```

### Wrapper Functions

Another alternative is to consume each operation by delegating to a generator
whose only job is to produce the return value. You can then delegate to that
generator using the [`yield*`][yield*] syntax. For example, we can define an
`unwrap()` function like so:

``` typescript
interface Unwrap<T> {
  [Symbol.iterator](): Iterator<Operation<T>, T>>
}

function* unwrap<T>(operation: Operation<T>): Unwrap<T> {
  let result = yield operation;
  return result as T;
}
```

Now we can use this `unwrap()` function to consume the value of the wrapped
operation as a return value which TypeScript _does_ understand. In the following
example, the static type of the `response` variable as well as the return type
of the generator function are correctly inferred.

``` typescript
function* () {
  let response = yield* unwrap(fetch('some.json'));
  return response.json();
}
```

### Summary

Which strategy you choose is up to you as each comes with its own pros
and cons. Manual Annotation is easy and works most of the time, but
does suffer from the possibility of successfully type-checking code
that actually fails at runtime.  On the other hand, Wrapper Functions
give you 100% type correctness, but require the ceremony of wrapping
every single operation as well as requiring the use of the very
esoteric [`yield*`][yield*] syntax.

Of course, it's not ideal that these kind of trade-offs are required,
but we can surely hope that the TypeScript team will find a way to
make them a thing of the past. You can help bring this about sooner by taking
to github and voicing your support for resolving [the primary issue][1], or
upvoting one of the [proposed solutions][2]. It doesn't have to be an essay,
just a simple, true statement like the following to let them know you're out
there:

> I use JavaScript generators a lot to write more powerful code than would be possible otherwise. It would be amazing if TypeScript were able to typecheck programs like mine in a 100% hassle-free way.

You can make a difference!
[operations]: ./tasks#operations
[generators]: ./tasks#yield
[yield*]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/yield*
[1]: https://github.com/microsoft/TypeScript/issues/32523
[2]: https://github.com/microsoft/TypeScript/issues/43632
