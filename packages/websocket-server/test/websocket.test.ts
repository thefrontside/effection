import { describe, it, beforeEach } from '@effection/mocha';
import * as expect from 'expect'
import { spawn } from '@effection/core';

import { createWebSocketClient } from '@effection/websocket-client';
import { createWebSocketServer, WebSocketServer } from '../src/index';

type Message = { value: string };

describe("createWebSocketServer()", () => {
  beforeEach(function*() {
    let server: WebSocketServer<Message> = yield createWebSocketServer(47000);

    yield spawn(server.forEach(function*(connection) {
      yield connection.forEach(({ value }) => function*() {
        yield connection.send({ value: value.toUpperCase() });
      });
    }));
  });

  it('can send and receive messages', function*() {
    let client = yield createWebSocketClient<Message>('ws://localhost:47000');

    yield client.send({ value: 'hello' });
    yield client.send({ value: 'world' });

    expect(yield client.expect()).toEqual({ value: 'HELLO' });
    expect(yield client.expect()).toEqual({ value: 'WORLD' });
  });
});
