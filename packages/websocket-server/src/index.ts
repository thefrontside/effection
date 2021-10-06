import { Server } from 'ws';

import { spawn, ensure, Resource } from '@effection/core';
import { createQueue, Subscription, Sink } from '@effection/subscription';
import { on, once } from '@effection/events';
import http from 'http';
import { AddressInfo } from 'net';

export interface WebSocketConnection<TIncoming = unknown, TOutgoing = TIncoming> extends Subscription<TIncoming>, Sink<TOutgoing> {
}

export type WebSocketSubscription<TIncoming = unknown, TOutgoing = TIncoming> = Subscription<WebSocketConnection<TIncoming, TOutgoing>>;

export interface WebSocketServer<TIncoming = unknown, TOutgoing = TIncoming> extends WebSocketSubscription<TIncoming, TOutgoing> {
  port: number;
}

type CreateOptions = {
  http: http.Server;
}

type StartOptions = {
  port?: number;
};

export function createWebSocketSubscription<TIncoming = unknown, TOutgoing = TIncoming>(options: CreateOptions): Resource<WebSocketSubscription<TIncoming, TOutgoing>> {
  return {
    *init(scope) {
      let wss = new Server({ server: options.http });

      let queue = createQueue<WebSocketConnection<TIncoming, TOutgoing>>();

      yield spawn(on<WebSocket>(wss, 'connection').forEach(function* (raw) {
        yield scope.spawn(function*() {
          let messageQueue = createQueue<TIncoming>();

          yield queue.send({
            ...messageQueue.subscription,
            *send(message: TOutgoing) {
              raw.send(JSON.stringify(message));
            },
            *close() {
              wss.close();
            }
          });

          yield on<{ data: string }>(raw, 'message').forEach(function*(message) {
            yield messageQueue.send(JSON.parse(message.data));
          });
        });
      }));

      yield ensure(() => { wss.close() });

      return queue.subscription;
    }
  };
}

export function createWebSocketServer<TIncoming = unknown, TOutgoing = TIncoming>(options: StartOptions = {}): Resource<WebSocketServer<TIncoming, TOutgoing>> {
  return {
    *init() {
      let httpServer = http.createServer();
      httpServer.listen(options.port);
      yield ensure(() => { httpServer.close() });

      let server = yield createWebSocketSubscription({ http: httpServer });

      if(!httpServer.listening) {
        yield once(httpServer, 'listening');
      }

      Object.defineProperty(server, 'port', {
        get() {
          return (httpServer.address() as AddressInfo).port;
        }
      });

      return server;
    }
  };
}
