import WebSocket from 'isomorphic-ws';

import { spawn, ensure, Resource } from '@effection/core';
import { createQueue, Subscription, Sink } from '@effection/subscription';
import { on, once } from '@effection/events';

export interface WebSocketClient<TIncoming = unknown, TOutgoing = TIncoming> extends Subscription<TIncoming>, Sink<TOutgoing> {
}

export function createWebSocketClient<TIncoming = unknown, TOutgoing = TIncoming>(url: string): Resource<WebSocketClient<TIncoming, TOutgoing>> {
  return {
    *init() {
      let socket = new WebSocket(url);

      yield once(socket, 'open');

      let queue = createQueue<TIncoming>();

      yield spawn(function*() {
        yield spawn(on<{ data: string }>(socket, 'message').forEach(function*(message) {
          yield queue.send(JSON.parse(message.data));
        }));
        yield ensure(() => { socket.close() });

        let { wasClean, code, reason } = yield once(socket, 'close');

        if(wasClean) {
          yield queue.close();
        } else {
          throw new Error(`websocket server closed connection unexpectedly: [${code}] ${reason}`);
        }
      });

      return {
        ...queue.subscription,
        *send(message: TOutgoing) {
          socket.send(JSON.stringify(message));
        },
        *close() {
          socket.close();
        }
      };
    }
  };
}
