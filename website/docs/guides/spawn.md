---
id: spawn
title: Spawn
---

Suppose we are using the `fetchWeekDay` function from the introduction to fetch the current weekday in multiple timezones:

``` javascript
import { main } from 'effection';
import { fetchWeekDay } from './fetch-week-day';

main(function*() {
  let dayUS = yield fetchWeekDay('est');
  let daySweden = yield fetchWeekDay('cet');
  console.log(`It is ${dayUS}, in the US and ${daySweden} in Sweden!`);
});
```

This works, but it slightly inefficient. How can we run both `fetch` operations concurrently?

### Using `async/await`

If we were using `async/await` we might do something like this:

``` javascript
async function() {
  let dayUS = fetchWeekDay('est');
  let daySweden = fetchWeekDay('cet');
  console.log(`It is ${await dayUS}, in the US and ${await daySweden} in Sweden!`);
}
```

Or use a combinator such as `Promise.all`:

``` javascript
async function() {
  let [dayUS, daySweden] = await Promise.all([fetchWeekDay('est'), fetchWeekDay('cet')]);
  console.log(`It is ${await dayUS}, in the US and ${await daySweden} in Sweden!`);
}
```

### Cancellation

This works fine as long as both fetches complete successfully, but what happens
when one of them fails? Since there is no connection between the two tasks, a
failure in one of them has no effect on the other. We will happily keep trying
to fetch the US date, even when fetching the Swedish date has already failed!

For `fetch`, the consequences of this are not so severe, the worst that happens is
that we have a request which is running longer than necessary, but you can imagine
that the more complex the operations we're trying to combine, the more opportunity
for problems there are.

We are calling these situations "dangling promises", and most significantly complex
JavaScript applications suffer from this problem. `async/await` fundamentally does
not handle cancellation very well when running multiple operations concurrently.

### Effection

How does Effection deal with this situation? If we translate this directly into
Effection code, it does not behave like we expect:

``` javascript
import { main } from 'effection';
import { fetchWeekDay } from './fetch-week-day';

main(function*() {
  let dayUS = fetchWeekDay('est');
  let daySweden = fetchWeekDay('cet');
  console.log(`It is ${yield dayUS}, in the US and ${yield daySweden} in Sweden!`);
});
```

This is still serial, and does not run both `fetch` operations concurrently! To
understand why, remember that calling a generator function does not do
anything, only by passing the generator to `yield` or `run` do we actually run
the generator.

We could use `run` here to run our operations, and then wait for them, but this is not
the idiomatic way:

``` javascript
// THIS IS NOT THE CORRECT WAY!
import { main, run } from 'effection';
import { fetchWeekDay } from './fetch-week-day';

main(function*() {
  let dayUS = run(fetchWeekDay('est'));
  let daySweden = run(fetchWeekDay('cet'));
  console.log(`It is ${yield dayUS}, in the US and ${yield daySweden} in Sweden!`);
});
```

But this has the same problem as our `async/await` example!

### Introducing `spawn`

The `spawn` operation is Effection's solution to this problem!

``` javascript
import { main, spawn } from 'effection';
import { fetchWeekDay } from './fetch-week-day';

main(function*() {
  let dayUS = yield spawn(fetchWeekDay('est'));
  let daySweden = yield spawn(fetchWeekDay('cet'));
  console.log(`It is ${yield dayUS}, in the US and ${yield daySweden} in Sweden!`);
});
```

Like `run` and `main`, `spawn` takes an `Operation` and returns a `Task`. The
difference is that this `Task` becomes a child of the current `Task`. This
means it is impossible for this task to outlive its parent. And it also means
that an error in the task will cause the parent to fail.

You can think of this as creating a hierarchy like this:

```
+-- main
  |
  + -- fetchWeekDay('est')
  |
  + -- fetchWeekDay('cet')
```

When `fetchWeekDay('cet')` fails, it will also cause `main` to fail, and when `main` fails
it will make sure that none of its children outlive it, and it will `halt` all of its remaining
children. We end up with a situation like this:

```
+-- main [FAILED]
  |
  + -- fetchWeekDay('est') [HALTED]
  |
  + -- fetchWeekDay('cet') [FAILED]
```

Since `fetchWeekDay` was implemented using the `@effection/fetch` package, and
that package knows how to clean up after itself, the `fetchWeekDay('est')`
request will be cancelled for you.

Idiomatic Effection code creates tasks that are tied to the lifetime of their
parent, and it becomes impossible to create a task whose lifetime is undefined.
This idea is called structured concurrency, and it has profound effects on the
composability of concurrent code.
