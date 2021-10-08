# Await is not enough
## Introducing Effection

Everyone who has built a complex system in JavaScript has hit a critical moment
where the illusion of control has come crashing down. There are dozens, maybe
hundreds of concurrent processes running, and it feels like you've lost control
over them. A promise handler or callback executes even though it is no longer relevant
and messes up the state of the system. An error disappears into the void. A socket
is not closed when it should be.

It is a rare piece of writing that fundamentally shifts your perspective on how things
should be done. Where are after reading it, you have this overwhelming feeling of almost
panic that obviously the author is correct, and obviously this is the way to do it. That
was exactly the feeling we had after reading Nathaniel J. Smith's masterful blog post
[Notes on structured concurrency, or: Go statement considered harmful][structured concurrency].

> Just like `goto` was the obvious primitive for the first practical high-level
> languages, `go` was the obvious primitive for the first practical concurrency
> frameworks: it matches how the underlying schedulers actually work, and it's
> powerful enough to implement any other concurrent flow pattern. But again
> like `goto`, it breaks control flow abstractions, so that merely having it as
> an option in your language makes everything harder to use.
>
> The good news, though, is that these problems can all be solved: Dijkstra
> showed us how! We need to:
>
> - Find a replacement for go statements that has similar power, but follows
>   the "black box rule"
> - Build that new construct into our concurrency framework as a primitive, and
>   don't include any form of go statement.
>
> \- Nathaniel J. Smith

The problem with concurrency in JavaScript is that it is fundamentally
unstructured. Anyone can add a callback, or await a promise at any time, and
once that task is created, it has an unconstrained lifetime. If the async
function, or the callback is no longer relevant, how do you cancel it? If
you're performing multiple callbacks or promises, or awaits, are you sure
you're dealing correctly with errors in all of them?

The solution seems clear: adopt the ideas of structured concurrency, and apply
them to JavaScript.  We have experimented with these ideas for a while at
Frontside, and out of this experimentation we've created a framework which has
changed the way we write and think about JavaScript systems. This process has
been challenging and exciting, and we think that we've built something which is
useful far beyond our own team and our own needs. [Effection][] is a
concurrency framework, which aims to replace `async/await` with a more
structured way of writing concurrent code. We hope that is is a base to build
an entire ecosystem on top of, but we've also found it to be incredibly useful
and fun to use on its own.

The core idea of structured concurrency is that the lifetime of a task is always
constrained. This means that a task must not outlive its parent. In other words,
it is impossible to spawn a task which runs forever. This might seem like an
obvious constraint, but it is important to note that this is very much *not* the
case with the core concurrency primitives available in JavaScript.

Let's look at how this applies to `async/await` code:

```javascript
async function fetchUser(id) {
  let response = await fetch(`/users/${id}`);
  return await response.json();
}
```

There is nothing special about this async function. This is what happens when we
use this function from another function:

```javascript
async function fetchSomeUsers() {
  let userOne = fetchUser(1);
  let userTwo = fetchUser(2);
  return {
    one: await userOne,
    two: await userTwo,
  }
}
```

It looks like the `fetchSomeUsers` function is nice and self contained, but it
is really not. We start fetching two users, but both of those fetches are in no
way tied to the `fetchSomeUsers` function. They run in the background, and no
matter what happens within `fetchSomeUsers`, they just keep running.
Potentially they could run forever. This is what we mean when we say that their
lifetime is unconstrained.

For example, there is nothing stopping us from doing something silly like this:

```javascript
async function fetchUser(id) {
  setTimeout(() => {
    console.log("I'm still running, lol!");
  }, 1000000);
  let response = await fetch(`/users/${id}`);
  return await response.json();
}
```

Even ages after the `fetchUser` function has finished, it will still print
something to the console. We obviously can't close the existing loopholes,
such as `setTimeout`, but as long as you are writing idiomatic Effection code,
something like the above just cannot happen.

Let's look at the initial example again, this time using Effection:

```javascript
import { spawn, fetch } from 'effection';

function* fetchUser(id) {
  let response = yield fetch(`/users/${id}`);
  return yield response.json();
}

function* fetchSomeUsers() {
  let userOne = yield spawn(fetchUser(1));
  let userTwo = yield spawn(fetchUser(2));
  return {
    one: yield userOne,
    two: yield userTwo,
  }
}
```

Effection uses generator functions instead of async functions, and there is
something going on with `spawn`, but other than that it looks pretty much the
same. However, the way that this runs is very different. When we spawn a task
with Effection, its lifetime is tied to the current task, that means that
`fetchUser(1)` and `fetchUser(2)` cannot ever outlive `fetchSomeUsers`.
Moreover, no task that `fetchUser` spawns can outlive `fetchUser` either.
Effection tasks ensure that everything that happens within the task stays
within the task.

This might seem like a trivial thing, but the implications are profound. For
example: Effection ships with a special operation called `withTimeout`, this
adds a time limit to any task, and if it is exceeded, an error is thrown. We
can now do this:

```javascript
import { withTimeout } from 'effection';

function* fetchSomeUsersWithTimeout() {
  return yield withTimeout(2000, fetchSomeUsers());
}
```

Something like this is pretty much impossible to implement with promises. There
is just no way to know what `fetchSomeUsers` does internally, and there is no
way to know whether we really can abort all of it. Trying to write a function
like this is at best totally unsafe, and at worst impossible.

With Effection this all just works. We know that nothing can escape
`fetchSomeUsers` and we know that everything that `fetchSomeUsers` does will be
cancelled if we cancel `fetchSomeUsers` itself.

Structured concurrency allows us to build abstractions which would otherwise
be impossible to build, and this is the power of Effection. We think it is a
fundamentally better way to write JavaScript.

### The Future

We are a small but dedicated team, and we're tackling an ambitious problem with
an ambitious solution. There is boundless work to be done, and boundless ideas
to explore. Do you want to join us in this journey? Come hang out with us [on
discord][discord], where we occasionally stream our work, and are always interested in
discussing where to go next.

[Effection]: http://frontside.com/effection
[structured concurrency]: https://vorpus.org/blog/notes-on-structured-concurrency-or-go-statement-considered-harmful/
[discord]: https://discord.gg/Ug5nWH8
