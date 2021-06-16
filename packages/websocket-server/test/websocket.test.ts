import { describe, it, beforeEach } from '@effection/mocha';
import expect from 'expect'
import { createServer } from 'http'
import { AddressInfo } from 'net'
import { spawn, ensure } from '@effection/core';
import { once } from '@effection/events';

import { createWebSocketClient } from '@effection/websocket-client';
import { createWebSocketServer, createWebSocketSubscription, WebSocketServer } from '../src/index';

type Message = { value: string };

describe("createWebSocketServer()", () => {
  it('can send and receive messages', function*() {
    let server: WebSocketServer<Message> = yield createWebSocketServer();

    yield spawn(server.forEach(function*(connection) {
      yield connection.forEach(({ value }) => function*() {
        yield connection.send({ value: value.toUpperCase() });
      });
    }));

    let client = yield createWebSocketClient<Message>(`ws://localhost:${server.port}`);

    yield client.send({ value: 'hello' });
    yield client.send({ value: 'world' });

    expect(yield client.expect()).toEqual({ value: 'HELLO' });
    expect(yield client.expect()).toEqual({ value: 'WORLD' });
  });

  it('can provide own http server', function*() {
    let http = createServer();

    let server: WebSocketServer<Message> = yield createWebSocketSubscription({ http });

    http.listen();
    yield ensure(() => { http.close(); });
    yield once(http, 'listening');

    let port = (http.address() as AddressInfo).port;

    yield spawn(server.forEach(function*(connection) {
      yield connection.forEach(({ value }) => function*() {
        yield connection.send({ value: value.toUpperCase() });
      });
    }));

    let client = yield createWebSocketClient<Message>(`ws://localhost:${port}`);

    yield client.send({ value: 'hello' });
    yield client.send({ value: 'world' });

    expect(yield client.expect()).toEqual({ value: 'HELLO' });
    expect(yield client.expect()).toEqual({ value: 'WORLD' });
  });
});
