import { describe, beforeEach, it } from '@effection/mocha';
import expect from 'expect';

import { on, once, OperationIterator } from 'effection';
import WebSocket from 'ws';

import { Express, express, CloseEvent } from '../src';

type Message = { message: string };

describe('websocket server', () => {
  let client: WebSocket;

  beforeEach(function*() {
    let app: Express = yield express();

    app.ws<Message>('*', (socket) => function*() {
      yield socket.forEach(({ message }) => socket.send({ message: message.toUpperCase() }));
    });

    yield app.listen(39001);

    client = new WebSocket('ws://127.0.0.1:39001');
  });

  describe('when receiving messages', () => {
    let messages: OperationIterator<Message, void>;

    beforeEach(function*(world) {
      messages = on<MessageEvent>(client, 'message').map((m) => JSON.parse(m.data) as Message).subscribe(world);

      if(client.readyState !== client.OPEN) {
        yield once(client, 'open');
      }

      client.send(JSON.stringify({ message: "Hello World!" }));
      client.send(JSON.stringify({ message: "Goodbye World!" }));
    });

    it('publishes them on the server', function*() {
      expect(yield messages.next()).toEqual({ done: false, value: { message: "HELLO WORLD!" } });
      expect(yield messages.next()).toEqual({ done: false, value: { message: "GOODBYE WORLD!" } });
    });

    describe('when the client closes', () => {
      let close: CloseEvent;
      beforeEach(function*() {
        client.close(4000, 'an application defined status code');
        close = yield once(client, 'close');
      });

      it('finishes the subscription with the close event', function*() {
        expect(close.code).toEqual(4000);
        expect(close.reason).toEqual('an application defined status code')
      });
    });
  });
})
