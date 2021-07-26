---
id: testing
title: Testing
---

You can test Effection code with any test framework. Since Effection integrates
seemlessly with `async/await` code, any test framework which supports
asynchronous tests works well with Effection.

Effection itself is tested with [mocha][], and we have created a small
integration to make the process of writing tests with mocha easier.

## Getting started

Add the `@effection/mocha` package:

```
npm install --save-dev @effection/mocha
```

In your test files you can now import `describe`, `it` and friends from
`@effection/mocha` instead:

``` javascript
import { it, beforeEach } from '@effection/mocha';
import { spawn } from 'effection';

describe('some effection code', () => {
  beforeEach(function*() {
    yield spawn(function*() {
      // ...
    });
  });

  it('does something', function*() {
    yield performSomeOperation();
  });
});
```

As you can see, we can use a generator function with `it` and `beforeEach`,
which makes it very easy to call Effection code.

## World

The generator functions passed to `it` and `beforeEach` and other hooks, are a
bit special in that tasks spawned within the function and [resources][]
created, actually live for the duration of the whole test.  This allows you to
spawn an operation in a `beforeEach` and have it still be running in the `it`
block.

These functions receive two arguments: the first being the task for the whole test,
and the second being the task for just the function. By convention we refer to the
task that covers the whole test as "world".

``` javascript
describe('some effection code', () => {
  beforeEach(function*(world, task) {
    world.run(); // still running in the `it` block
    task.run(); // only runs until the end of `beforeEach`
    yield spawn(); // spawned in `world`, still running in the `it` block
    yield task.spawn();
  });

  it('does something', function*() {
    yield performSomeOperation();
  });
});
```

[mocha]: https://mochajs.org
[resource]: /docs/guides/resources
