---
id: events
title: Events
---

Asynchronous code often needs to interact with evented code. Using `async/await` this can be
quite challenging. Evented code often needs to be synchronous, because the timing of when to
subscribe and unsubscribe is very critical, otherwise race conditions can occur where events
get missed. Effection has powerful tools for working with Events.

## Single events

The simplest operation for working with events that Effection provides is the
`once` operation.  This operation blocks and waits for the event to occur. For
example, consider that we wanted to wait for the `open` even on a `WebSocket`,
we could do something like this:

``` javascript
import { main, once } from 'effection';

main(function*() {
  let socket = new WebSocket('ws://localhost:1234');

  yield once(socket, 'open');

  console.log('socket is open!');
});
```

The `once` operation works with both Node's `EventEmitter` events which use
`on/off` and the DOM `EventTarget` events which use
`addEventListener/removeEventListener`.

The `once` operation returns the argument passed to the event handler. For
example we could use this to grab the [`code`][wscode] that the socket closed
with:

``` javascript
import { main, once } from 'effection';

main(function*() {
  let socket = new WebSocket('ws://localhost:1234');

  yield once(socket, 'open');

  console.log('socket is open!');

  let closeEvent = yield once(socket, 'close');
  console.log('socket closed with code', closeEvent.code);
});
```

## Events with multiple arguments

In very rare cases, some event emitters pass multiple arguments to their event
handlers. For example the [ChildProcess][] in NodeJS emits both a status
code _and_ a signal to the 'exit' event. It would not be possible to read the
signal from the `exit` event using just the `once()` operation.

For cases like these, the `onceEmit` function exists, which works the same as
`once`, except it returns an array of all arguments passed to the event
handler.

## Recurring events

If you've been following the chapter on streams and subscriptions, you may
already have a feeling that it is not a good idea to repeatedly call
`once(socket, 'message')` to grab the messages sent to a WebSocket. The risk
here is that we miss messages if we're not very careful.

Instead we can use `on`. `on` is a very convenient function which takes an
event emitter or event target and the name of an event, and returns a Stream of
values.

``` javascript
import { main, once } from 'effection';

main(function*() {
  let socket = new WebSocket('ws://localhost:1234');

  yield on(socket, 'message').forEach(function*(message) {
    console.log('message:', message.data);
  });
});
```

This way we can convert events into [Effection streams](./collections), and we can also
use all of the Stream operations to transform these streams:

``` javascript
import { main, once } from 'effection';

main(function*() {
  let socket = new WebSocket('ws://localhost:1234');

  let messages = on(socket, 'message').map((event) => JSON.parse(event.data));

  yield messages.match({ type: 'start' }).expect();

  console.log('got start message!');
});
```

[wscode]: https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
[childprocess]: https://nodejs.org/api/child_process.html#child_process_class_childprocess
