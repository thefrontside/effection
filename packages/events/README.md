# @effection/events

Helpers for working with events in Effection. These helpers work both with
Node.js style EventEmitters (`on`/`off`) and with browser style EventTarget
(`addEventListeners`/`removeEventListener`).

## Usage

The `once` operation can be used to wait for an event to occur exactly once.

``` typescript
import { run } from '@effection/node';
import { once } from '@effection/events';

run(function* sayHello() {
  yield once(window, "DOMContentLoaded");
  console.log('Hello World!');
});
```

The `on` operation returns a subscription which can be used to loop over events:

``` typescript
import { run } from '@effection/node';
import { on } from '@effection/events';

run(function* sayHello() {
  let messages = yield on(window, "message");

  while(true) {
    let message = yield messages.next();
    console.log('Got message:', message);
  }
});
```

It is a common pattern, primarily in Node to have an event called `error` which
has an error as its first argument. `@effection/events` includes a helper to
make handling this situation convenient:

``` typescript
import { run } from '@effection/node';
import { once, throwOnErrorEvent } from '@effection/events';

run(function* sayHello() {
  let someSocket = createSocket();

  yield throwOnErrorEvent(someSocket);

  yield once(someSocket, "open");

  let messages = yield once(someSocket, "message");

  while(true) {
    let message = yield messages.next();
    console.log('Got message:', message);
  }
});
```
