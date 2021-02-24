# MiniEffection

This is a reimplementation of
[Effection](https://github.com/thefrontside/effection) with some of the lessons
learned from Effection incorporated and with some new ideas. In many ways it is a
simplification of Effection.

Unlike Effection proper, MiniEffection embraces `Promise` as its core
primitive. Both tasks and controllers are promises and are useable as such.
The leaf-nodes of an effection tree are always promises. This makes it possible to
leverage async/await for the implementation which makes the code much easier to
understand and work with, rather than the explicit state machines in Effection.

This also means that all `yield` points function as suspend points, just like
all `await` points function like suspend points in async/await. This makes it
easier to reason about Effection code. The downside is that we can no-longer
rely on synchronous yield points to prevent the event loop from ticking. To
prevent race conditions, task spawning is not an operation. Instead, operation
generator functions receive the task as a parameter, and spawning is just a
method.

Additionally, there is at the moment, no equivalent to `fork`. Tasks may not
outlive their parents, but they also cannot block their parent unless they are
explicitly made to.

Also, the concept of resources no longer exists. To create a resource like
object, it should explicitly be given a Task, it can then use this task to
spawn new operations.
