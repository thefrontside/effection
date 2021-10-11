import { describe, it, beforeEach } from '@effection/mocha';
import expect from 'expect'
import http from 'http'
import type { AddressInfo } from 'net'
import { on, once, spawn, ensure } from 'effection';

import WebSocket from 'ws';
import { Server as WebSocketServer } from 'ws';

import { createWebSocketClient, WebSocketClient } from '../src/index';

type Message = { value: string };

describe("createWebSocketClient()", () => {
  let server: http.Server;

  beforeEach(function*() {
    server = http.createServer();
    let wss = new WebSocketServer({ server: server });

    yield spawn(on<WebSocket>(wss, 'connection').forEach((connection) => (
      on<{ data: string }>(connection, 'message').forEach((message) => {
        let { value }: Message = JSON.parse(message.data);
        connection.send(JSON.stringify({ value: value.toUpperCase() }));
      })
    )));

    server.listen();

    yield ensure(() => { server.close() });
    yield once(server, 'listening');
  });

  it('can send and receive messages', function*() {
    let { port } = server.address() as AddressInfo;
    let client: WebSocketClient<Message> = yield createWebSocketClient<Message>(`ws://localhost:${port}`);

    yield client.send({ value: 'hello' });
    yield client.send({ value: 'world' });

    expect(yield client.expect()).toEqual({ value: 'HELLO' });
    expect(yield client.expect()).toEqual({ value: 'WORLD' });
  });
});
