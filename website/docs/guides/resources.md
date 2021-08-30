---
id: resources
title: Resources
---

As we discussed in the chapter on [tasks][], an [Operation][] can be one of
several things, one of which is a [Resource][]. In this chapter we will explain
what a resource is and why you might want to use one.

## The resource criteria

Resources can seem a little complicated, but the reason for their existence is
rather simple. Sometimes there are operations which meet the following criteria:

1. They are long running
1. We want to be able to interact with them while they are running

## Why resources?

As an example, let's consider that our program opens a Socket, and we want to be
able to send messages to this socket while it is open. This is fairly simple
to write using regular operations like this:

``` javascript
import { main } from 'effection';
import { Socket } from 'net';

main(function*() {
  let socket = new Socket();
  socket.connect(1337, '127.0.0.1');

  yield once(socket, 'connect');

  socket.write('hello');

  socket.close();
});
```

This works, but there are a lot of details we need to remember to use the socket
safely. It would be nice if we could create a friendly abstraction that we could
reuse in all of our code that uses socket.

We know we want to close this socket once we're done, so our first attempt might
look something like this:

``` javascript
import { once } from 'effection';

export function *createSocket(port, host) {
  let socket = new Socket();
  socket.connect(port, host);

  yield once(socket, 'connect');

  try {
    yield
    return socket;
  } finally {
    socket.close();
  }
}
```

But when we actually try to use our `createSocket` operation, we run into a problem:

``` javascript
import { main } from 'effection';
import { createSocket } from './create-socket';

main(function*() {
  let socket = yield createSocket(1337, '127.0.0.1'); // this blocks forever
  socket.write('hello'); // we never get here
});
```

## Using resources

Remember our criteria from before:

1. Socket is a long running process
1. We want to interact with the socket while it is running by sending messages to it

This is a good use-case for using a Resource. Let's look at how we can rewrite
`createSocket` using resources. Effection considers any object which has an
`init` function a Resource. The `init` function initializes the Resource, and
an implementation of `createSocket` could look like this:

``` javascript
import { once, spawn } from 'effection';

export function createSocket(port, host) {
  return {
    *init() {
      let socket = new Socket();
      socket.connect(port, host);

      yield spawn(function* closeSocket() {
        try {
          yield
        } finally {
          socket.close();
        }
      });

      yield once(socket, 'connect');

      return socket;
    }
  }
}
```

Before we unpack what's going on, let's just note that how we use `createSocket` has
not changed at all, only it now works as we expect!

``` javascript
import { main } from 'effection';
import { createSocket } from './create-socket';

main(function*() {
  let socket = yield createSocket(1337, '127.0.0.1'); // waits for the socket to connect
  socket.write('hello'); // this works
  // once `main` finishes, the socket is closed
});
```

## How resources work

The `init` function is used to *initialize* the resource. Once the `init`
function is done, we can proceed past the `yield` point where we called
`createSocket` in `main`. You can see why we call `once` from `init`, so we
wait for the socket to open before proceeding.

But what about the call to `spawn`? We have previously established that a
spawned Task cannot outlive its parent, and so the Task that we spawned really
*should* be halted when the `init` function is finished. But the rules within
`init` are slightly different, and this is what gives resources their power. If
we use `spawn` in `init` then the spawned Task is actually spawned under the
Task that created the resource, which in this case is the `main` task. The Task
still cannot outlive its parent, which is `main`, but its able to outlive the
`init` function.

You can think of this as creating a task hierarchy which looks something like this:

```
+-- main
  |
  +-- init
    |
    +-- once(socket, 'connect')
  |
  +-- closeSocket
```

As you can see, `closeSocket` and `init` are *siblings* rather than `closeSocket`
being a child of `init`.

## Nested resources

Other resources created within `init` behave the same way and are created as
siblings. We can use this to make a socket which serializes anything written
to it as JSON:

``` javascript
import { main, once, spawn } from 'effection';
import { createSocket } from './create-socket';

function createJSONSocket(port, host) {
  return {
    *init() {
      let socket = yield createSocket(port, host); // outlives the `init` function

      return {
        write: (value) => socket.write(JSON.stringify(value));
      }
    }
  }
}

main(function*() {
  let socket = yield createJSONSocket(1337, '127.0.0.1'); // waits for the socket to connect
  socket.write({ hello: 'world' }); // this works
  // once `main` finishes, the socket is closed
});
```

Here we're able to reuse our `createSocket` operation. Resources allow us
to create powerful, reusable abstractions which are also able to clean up
after themselves.

If we used a regular operation here and not a Resource, the socket would be
closed before we could ever send a message to it.

``` javascript
// THIS DOESN'T WORK
import { once, spawn } from 'effection';
import { createSocket } from './create-socket';

export function *createJSONSocket(port, host) {
  let socket = yield createSocket(port, host);

  return {
    write: (value) => socket.write(JSON.stringify(value));
  }
  // socket gets closed here!
}
```

[tasks]: /docs/guides/tasks
[operation]: https://frontside.com/effection/api
[resource]: https://frontside.com/effection/api
