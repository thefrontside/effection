import { Server } from 'ws';

import { spawn, ensure, Resource, Operation } from '@effection/core'
import { createQueue, Subscription } from '@effection/subscription';
import { on, once } from '@effection/events';
import * as http from 'http'

export interface WebSocketConnection<TIncoming = unknown, TOutgoing = TIncoming> extends Subscription<TIncoming> {
  send(message: TOutgoing): Operation<void>;
}

export type WebSocketServer<TIncoming = unknown, TOutgoing = TIncoming> = Subscription<WebSocketConnection<TIncoming, TOutgoing>>;

export function createWebSocketServer<TIncoming = unknown, TOutgoing = TIncoming>(port: number): Resource<WebSocketServer<TIncoming, TOutgoing>> {
  return {
    *init(scope) {
      let server = http.createServer();
      let wss = new Server({ server: server });

      let queue = createQueue<WebSocketConnection<TIncoming, TOutgoing>>();

      yield spawn(on<WebSocket>(wss, 'connection').forEach((raw) => {
        scope.spawn(function*() {
          let messageQueue = createQueue<TIncoming>();

          queue.send({
            ...messageQueue.subscription,
            *send(message: TOutgoing) {
              raw.send(JSON.stringify(message));
            }
          });

          yield on<{ data: string }>(raw, 'message').forEach((message) => {
            messageQueue.send(JSON.parse(message.data));
          });
        });
      }));

      server.listen(port);

      yield ensure(() => {
        wss.close();
        server.close();
      });
      yield once(server, 'listening');

      return queue.subscription
    }
  }
}
