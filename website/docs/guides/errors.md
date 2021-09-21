---
id: errors
title: Errors
---

We have previously discussed how correctness and proper handling of failure
cases is why we wrote Effection in the first place. In this chapter we will
take a more in-depth look at how Effection handles failures and how you can
react to failure conditions.

## Tasks as Promises

Every Effection operation runs within a Task, when you call `run` or use the
`spawn` operation, you create a task. For each `yield` point, Effecion creates
a task for you. Every Task evaluates to one of three possible states, the task
can either become `completed`, meaning it finished normally, or it can become
`errored` meaning the task itself or one of its descendants had an error
thrown, or it can become `halted`, meaning that the evalutation of the task was
stopped before it finished.

We have seen that tasks can act like a `Promise` and that this interface can
be used to integrate Effection code into promise based or async/await code:

``` typescript
import { run } from 'effection';

async function runExample() {
  let value = await run(function*() {
    yield sleep(1000);
    return "world!";
  });

  console.log("hello", value);
}
```

Tasks can also act like a [Future][], which can be useful sometimes.

Of course if we throw an error inside of the task, then the task's promise
also becomes rejected:

``` typescript
import { run } from 'effection';

async function runExample() {
  try {
    await run(function*() {
      throw new Error('boom');
    });
  } catch(err) {
    console.log("got error", err.message) // => "got error boom"
  }
}
```

When treating a task as a promise, if the task becomes halted, the promise is
rejected with a special halt error:

``` typescript
import { run } from 'effection';

async function runExample() {
  try {
    let task = run();
    task.halt();
    await task;
  } catch(err) {
    console.log("got error", err.message) // => "got error halted"
  }
}
```

## Error propagation

One of the key principles of structured concurrency is that when a child fails,
the parent should fail as well. In Effection, when we spawn a task, that task
becomes linked to its parent. When the child task becomes `errored`, it will
also cause its parent to become `errored`.

This is similar to the intuition you've built up about how synchronous code
works: if an error is thrown in a function, that error propagates up the stack
and causes the entire stack to fail, until someone catches the error.

One of the innovations of async/await code over plain promises and callbacks,
is that you can use regular error handling with `try/catch`, instead of using special
error handling constructs. This makes asynchronous code look and feel more like
regular synchronous codes. The same is true in Effection, we can use `try/catch`
to deal with errors.

``` typescript
import { main, sleep } from 'effection';

function* tickingBomb() {
  yield sleep(1000);
  throw new Error('boom');
}

main(function*() {
  try {
    yield tickingBomb()
  } catch(err) {
    console.log("it blew up:", err.message);
  }
});
```

However, note that something interesting happens when we instead `spawn` the
`tickingBomb` operation:

``` typescript
import { main } from 'effection';
import { tickingBomb } from './ticking-bomb';

main(function*() {
  yield spawn(tickingBomb());
  try {
    yield; // sleep forever
  } catch(err) {
    console.log("it blew up:", err.message);
  }
});
```

You might be surprised that we do *not* enter the catch handler here! Instead,
our entire main task just fails. This is by design! We are only allowed to
catch errors thrown by whatever we yield to directly, not by any spawned
children or resources running in the background. This makes error handling more
predictable, since our catch block will not receive errors from any background
task, we're better able to specify which errors we actually want to deal with.

## Error boundary

If we do want to catch an error from a spawned task (or from a [Resource][]) then
we need to introduce an intermediate task which allows us to bring the error into
the foreground. We call this pattern an "error boundary":

``` typescript
import { main } from 'effection';
import { tickingBomb } from './ticking-bomb';

main(function*() {
  try {
    yield function*() { // error boundary
      yield spawn(tickingBomb()); // will blow up in the background
      yield; // sleep forever
    }
  } catch(err) {
    console.log("it blew up:", err.message);
  }
});
```

## Stack traces

We have already seen using the `main` entry point to run our code when we build
our entire application using Effection. One advantage of `main` over `run` is that
when our operation fails, we exit the program with a proper failure exit code. Additionally
`main` prints a nicely formatted stack trace for us on failure:

![Error when using main](/images/no-main-error.png)

We can see that in addition to the regular stack trace of our program, we also
receive an "Effection trace". This gives some context on where the error
occurred within the structure of our Effection code. To make this as useful as
possible, you can apply [Labels][] to your operations, which will be shown in
this trace.

## MainError

There are cases where we want the program to exit, but it might be due to user
error, rather than an internal failure. In this case we might not want to print
a stack trace. For example, if we're building a CLI which reads a file, and the
file that the user has specified does not exist, then we might want to show a
message to the user, but there is no need to show a stack trace. Additonally,
we might want to set a specific exit code.

Effection ships with a special error type, `MainError`, which works together
with `main` for these types of situations:

``` typescript
import { main, MainError } from 'effection';
import { promises as fs } from 'fs';

const { readFile } = fs;

main(function*() {
  let fileName = process.argv[2];
  try {
    let content = yield readFile(fileName);
    console.log(content.reverse().toString());
  } catch(err) {
    throw new MainError({ message: `no such file ${fileName}`, exitCode: 200 });
  }
});
```

When using `MainError` the stack trace will not be printed and the exit code
specified in the error will be used. This is what it looks like when we try to
read a file which does not exist:

![Using main error](/images/main-error.png)

[Future]: /docs/guides/futures
[Resource]: /docs/guides/resources
[Labels]: /docs/guides/labels
