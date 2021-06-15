# @effection/websocket-server

A basic websocket server which binds to a local port and enables communication
over websockets. The server is opinionated in that it assumes that the
messages are serialized as JSON.

## Usage

``` typescript
import { createWebSocketServer, WebSocketServer } from '@effection/websocket-server';
import { main } from '@effection/main';

type Message = { value: string };

main(function*() {
  let server: WebSocketServer<Message> = yield createWebSocketServer(47000);

  yield spawn(server.forEach(function*(connection) {
    yield connection.forEach(({ value }) => {
      connection.send({ value: value.toUpperCase() });
    });
  }));
});
```
