import { debug, ClientMessage, ServerMessage, DebugTree } from '@effection/debug-utils';
import { appDir } from '@effection/debug-ui';
import { Effection, Resource, Task, ensure, spawn } from '@effection/core';
import { once } from '@effection/events';
import { Slice } from '@effection/atom';

import { createServer } from 'http';
import { Server as StaticServer } from 'node-static';
import { AddressInfo } from 'net';

import { createWebSocketSubscription, WebSocketServer, WebSocketConnection } from '@effection/websocket-server';

export type Options = {
  port?: number;
  task?: Task;
}

export interface DebugServer {
  port: number;
}

export function createDebugServer(options: Options = {}): Resource<DebugServer> {
  return {
    *init() {
      let file = new StaticServer(appDir());

      let http = createServer((request, response) => {
        request.addListener('end', () => { file.serve(request, response); }).resume();
      });

      let connections: WebSocketServer<ServerMessage, ClientMessage> = yield createWebSocketSubscription({ http });

      yield spawn(function*() {
        while(true) {
          let connection: WebSocketConnection<ServerMessage, ClientMessage> = yield connections.expect();

          yield spawn(function*() {
            let slice: Slice<DebugTree> = yield debug(options.task || Effection.root);

            yield slice.forEach(function*(tree) {
              yield connection.send({ type: 'tree', tree });
            });
          });
        }
      });

      http.listen(options.port);
      yield ensure(() => { http.close(); });
      yield once(http, 'listening');

      let port = (http.address() as AddressInfo).port;

      return { port };
    }
  }
}
