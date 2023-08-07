# Changelog

## 3.0.0-alpha.10

- [fix] bug where `main()` was failing without explicit exit
  https://github.com/thefrontside/effection/pull/722
- [feat] Make each task run in its own Frame.
  https://github.com/thefrontside/effection/pull/729

## 3.0.0-alpha.9

- add `main()` method for setting up Effection to work properly in working in
  deno, browser, and node
- add `Context.set()` and `Context.get()` operations to make working with
  Context convenient

## 3.0.0-alpha.8

- convert `Subscription` interface from a bare operation to an "iterator" style
  interface. Succintly: `yield* subscription` -> `yield* subscription.next()`.
  For details https://github.com/thefrontside/effection/issues/693
- add `on()` and `once()` operations for events and subscriptions to values that
  implement the W3C `EventTarget` interface.
- generate separate types for ESM modules
  (https://github.com/thefrontside/effection/pull/702)

## 2.0.6

- delegate `error` and `name` properties to underlying `Error`. fixes
  https://github.com/thefrontside/effection/issues/675)

## 2.0.5

- Expose `formatError` so other packages can format errors the same way as
  `main`

## 2.0.4

- Allow pass object with `Symbol.operation` as an operation

## 2.0.3

- Remove redundant node-fetch from dependencies

## 2.0.2

- Extract `AbortSignal` from `@effection/fetch` to `@effection/core` as a
  resource

## 2.0.1

- workaround borked 2.0 release https://status.npmjs.org/incidents/wy4002vc8ryc

## 2.0.0

- Yielding to something which is not an operation no longer throws an internal
  error, but properly rejects the task.
- Fix a bug when using blockParent where the children are not getting halt on an
  explicit halt.
- Add Stream `toBuffer` and Stream `buffered` so we have both options on either
  accessing the buffer directly or returning the stream.
- Stream `buffer` returns the actual buffer and gives direct access to it
- Split off `Stream` from subscription package into its own `@effection/stream`
  package
- Adjust the propagation of errors for resources to make it possible to catch
  errors from `init`
- Enable support for resources in higher order operations `all`, `race` and
  `withTimeout`.
- Add shortcuts to create resolved/rejected/halted futures via
  Future.resolve(123), etc...
- Add @effection/fetch as a dependency and reexport it
- Share internal run loop among task, task future and task controller. Prevents
  race conditions which cause internal errors.
- Introduce task scope as an alternative to resources for being able to access
  the outer scope of an operation
- Add `toString()` method to task for nicely formatted rendering of task
  structure
- Allow channels to be named so their internal stream gets named
- Add esm builds
- remove accidentally compiled .js files from distributed sources
- 9998088: Spawn operation can accept task options
- d7c0eb1: Do not require implementation of full EventEmitter interface
- 2bce454: Simplify EventEmitter types on Controls.
- 1981b35: Collect trace of effection operations and propagate them along with
  the raised error
- 88dc59a: Remove `verbose` option from MainError
- 88dc59a: Improve error output by including an Effection trace
- 625b521: Sleep operation can suspend indefinitely when called without duration
- a06c679: Add spawn as an operation via resources
- 625b521: Add ensure, timeout and withTimeout combinators
- 92f921e: Turn streams into resources which return a subscription
- 110a2cd: Add ignoreError option to prevent a task from propagating its errors
  to the parent
- 7216a21: Turn throwOnErrorEvent into an operation
- e2545b2: Remove delay on starting iterator/generator
- 2b92370: Prevent race condition in promise controller if promise resolves in
  the same tick as halt signal
- 00562fd: Fix race condition when halting a task while in between yield points
- 110a2cd: When yielded to an asynchronously halting task, wait for the task to
  be fully halted before proceeding
- 110a2cd: The sub task created by iterators is now linked to the parent task
- 02446ad: Add Resource to create an option for spawning tasks in the background
  in an operation
- 2bad074: Run destructors in reverse order and in series
- 3db7270: Make Queue a first class citizen
- 0dca571: Filter with a type predicate can narrow type of stream
- 9cf6053: Increase default value of max subscribers on channel
- 0b24415: Add WritableStream interface and implement it for channels
- 442f220: New API for exec and daemon which does not take scope directly
- 22e5230: Add `join` method on stream to return stream result
- 70c358f: Store root in a global variable
- 3983202: Add `stringBuffer` method to stream which buffers stream to a string
- 2c2749d: Add a `buffer` method on Stream to buffer stream contents for later
  replay
- ab41f6a: Rename `Subscribable` to `Stream`
- ce76f15: Make channel splittable into send and stream ends
- 72f743c: Add `halt` method on `Effection` to halt root task
- 53661b7: Reexport blessed packages from `effection` package
- 3ca4cd4: Change `on` to return subscribable, rather than taking scope
- 3ca4cd4: Add `createSubscribable` and `Subscribable` interface
- 3ca4cd4: Make Channel subscribable and add all subscribable methods
- 3ca4cd4: Change channel interface from `new Channel()` to `createChannel()`

## 1.0.0

- b988025: Release effection 1.0.0

## 0.8.0

- f851981: Rename `main` to `run` and deprecate `main`

## 0.7.0

- 0e8951f: Use unique symbol for effection resources

## 0.6.4

- 68c4dab: include typescript sources with package in order for sourcemaps to
  work.

## 0.6.3

- 60ed704: ## Fix sourcemaps and types entrypoint We saw strange errors while
  installing Effection from BigTest. One of the problems was that sourcemaps
  were not working. This was happening because sourcemaps referenced ts file
  which were not being included in the package.
  https://github.com/thefrontside/effection/pull/119
  ## Distribute node packages without transpiling generators
  We made a decision to ship generators in our distribution bundles because IE11
  compatibility is not important to us. It's surprisingly difficult to get this
  to work. We tried using microbundle but that turned out to be even more
  complicated because their modern and cjs formats have mutually conflicting
  configuration](https://github.com/developit/microbundle/issues/618)
  https://github.com/thefrontside/effection/pull/120 All notable changes to this
  project will be documented in this file.

## 0.6.2

- fix bug where typescript type declarations were not being referenced properly
  as part of the migration to `microbundle`.
  https://github.com/thefrontside/effection.js/pull/107

## 0.6.1

- fix bug where operations that returned `null` was causing effection to crash:
  https://github.com/thefrontside/effection.js/pull/98
- `effection` is now compiled with microbundle instead of pika.
  https://github.com/thefrontside/effection.js/pull/100
- removed custom publish scripts in order to fix releases 🙏

## 0.6.0

- Returning a context from a context passes links it to the parent context
  rather than halting it. https://github.com/thefrontside/effection.js/pull/89
- Resources are a new feature in Effection which allow you to tie a context to
  any JavaScript object. https://github.com/thefrontside/effection.js/pull/89

## 0.5.2

- Make Typescript Operation type generic over the returned value. Enables better
  type checking in Typescript.
  https://github.com/thefrontside/effection.js/pull/81
- Catch errors raised in ensure blocks and print nasty warning
  https://github.com/thefrontside/effection.js/pull/80

## 0.5.1

- For runtimes that do not use native generators, the code to recognize
  generator functions was broken which prevented effection from working in those
  environments. This was addressed with
  https://github.com/thefrontside/effection.js/pull/77

## 0.5.0

- `join` to synchronize on a currently executing context.
- `monitor` operation to propagate failures
- `spawn` control function to create a "detached" process.
- Refactored the `fork` method to be an operation instead of a static function
- Introduced a `main` function to enter a brand new context

## 0.4.0

- add a monotonic `id` field to every fork to help with debugging
  https://github.com/thefrontside/effection.js/pull/32
- (fix) do not swallow some errors that are thrown inside of a yield point
  destructor: https://github.com/thefrontside/effection.js/pull/37
- Make every fork conform to the Promises A+ API. E.g. `fork(operation).then()`
  https://github.com/thefrontside/effection.js/pull/38

## 0.3.3

- type signature for Exceution.halt() which is necessary in the construction of
  non-trivial async processes like servers.
  https://github.com/thefrontside/effection.js/pull/24

## 0.3.2

- (fix) in certain cases, execution forks were being marked as completed when
  they actually were not. https://github.com/thefrontside/effection.js/pull/21
- (fix) sometimes halted children were being kept around unecessarily, and while
  not running will cause memory leaks long-term
  https://github.com/thefrontside/effection.js/pull/22

## 0.3.1

- unroll continuation and state classes in execution. This makes stack traces
  much smaller and easier to debug:
  https://github.com/thefrontside/effection.js/pull/19
- remove some dead files that were not contributing to the API
  https://github.com/thefrontside/effection.js/pull/18

## 0.3.0

- unify the fork() and execute() methods. There is now a single API for
  initiating asynchronous execution, fork() which makes the mental model much
  simpler and the learning curve smaller.
  https://github.com/thefrontside/effection.js/pull/14

- make the fork() function static. Prior to this, `fork()` was a method on the
  `Execution` class which made the API awkward and non-functional.
  https://github.com/thefrontside/effection.js/pull/12

- make generators (not just generator functions) valid operations. Before this
  change, you needed to use a utility function `call()` in order to pass
  arguments to generator based operations. This lets you invoke generator
  functions directly and pass the resulting generator to `yield` and `fork`
  directly thus simplifying code greatly.
  https://github.com/thefrontside/effection.js/pull/13

## 0.2.0

- Typescript typings: Effection now officially supports TypeScript! From here on
  out, the project is committed to shipping precise and up-to-date typing
  information for its entire public API
  https://github.com/thefrontside/effection.js/pull/8

## 0.1.0

- Test Suite, and functioning structured concurrency model
