# @effection/websocket-client

A basic websocket client for sending and receiving messages over a websocket
connection.  Works both in the browser and in node. The client is oppinionated
in that it assumes that the messages are serialized as JSON.

## Usage

``` typescript
import { createWebSocketClient, WebSocketClient } from '@effection/websocket-client';
import { main } from '@effection/node';

type Request = { value: string };
type Response = { value: number };

main(function* () {
  let client: WebSocketClient<Request, Response> = yield createWebSocketClient('ws://localhost:1234');

  yield client.forEach(({ value }) {
    client.send({ value: parseInt(value) });
  });
});
```
