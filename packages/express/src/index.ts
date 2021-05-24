import { Operation, Resource, ensure } from '@effection/core';
import { Subscription, createStream } from '@effection/subscription';

import actualExpress from 'express';
import WebSocket from 'ws';
import ews from 'express-ws';
import { Server } from 'http';

import { throwOnErrorEvent, once, on } from '@effection/events';

type OperationRequestHandler = (req: actualExpress.Request, res: actualExpress.Response) => Operation<void>;
type WsOperationRequestHandler<TReceive, TSend> = (socket: Socket<TReceive, TSend>, req: actualExpress.Request) => Operation<void>;

export type Response = actualExpress.Response;
export type Request = actualExpress.Request;

export interface CloseEvent {
  readonly code: number;
  readonly reason: string;
}

export type Socket<TReceive = unknown, TSend = TReceive> = Subscription<TReceive, CloseEvent> & {
  send(data: TSend): Operation<void>;
  subscription: Subscription<TReceive, CloseEvent>;
  raw: WebSocket;
}

export interface Express {
  use(handler: OperationRequestHandler): void;
  get(path: string, handler: OperationRequestHandler): void;
  post(path: string, handler: OperationRequestHandler): void;
  put(path: string, handler: OperationRequestHandler): void;
  delete(path: string, handler: OperationRequestHandler): void;
  patch(path: string, handler: OperationRequestHandler): void;
  options(path: string, handler: OperationRequestHandler): void;
  head(path: string, handler: OperationRequestHandler): void;
  ws<TReceive = unknown, TSend = unknown>(path: string, handler: WsOperationRequestHandler<TReceive, TSend>): void;
  listen(port: number): Operation<Server>;
  join(): Operation<void>;
  raw: ews.Application;
}

export function express(): Resource<Express> {
  return {
    *init(scope) {
      let raw = ews(actualExpress()).app;
      let server: Server;

      let express: Express = {
        raw,

        use(handler) {
          raw.use((req, res) => {
            scope.spawn(function*() {
              yield handler(req, res);
            });
          });
        },

        get(path, handler) {
          raw.get(path, (req, res) => {
            scope.spawn(function*() {
              yield handler(req, res);
            });
          });
        },

        post(path, handler) {
          raw.post(path, (req, res) => {
            scope.spawn(function*() {
              yield handler(req, res);
            });
          });
        },

        put(path, handler) {
          raw.put(path, (req, res) => {
            scope.spawn(function*() {
              yield handler(req, res);
            });
          });
        },

        delete(path, handler) {
          raw.delete(path, (req, res) => {
            scope.spawn(function*() {
              yield handler(req, res);
            });
          });
        },

        patch(path, handler) {
          raw.patch(path, (req, res) => {
            scope.spawn(function*() {
              yield handler(req, res);
            });
          });
        },

        options(path, handler) {
          raw.options(path, (req, res) => {
            scope.spawn(function*() {
              yield handler(req, res);
            });
          });
        },

        head(path, handler) {
          raw.head(path, (req, res) => {
            scope.spawn(function*() {
              yield handler(req, res);
            });
          });
        },

        ws<TReceive = unknown, TSend = unknown>(path: string, handler: WsOperationRequestHandler<TReceive, TSend>): void {
          raw.ws(path, (rawSocket, req) => {
            scope.spawn(function*() {
              try {
                let subscription: Subscription<TReceive, CloseEvent> = yield createStream<TReceive, CloseEvent>((publish) => function*(task) {
                  task.spawn(on<MessageEvent>(rawSocket, 'message').map((event) => JSON.parse(event.data)).forEach(publish));
                  let close: CloseEvent = yield once(rawSocket, 'close');
                  return { code: close.code || 1006, reason: close.reason || ''};
                });
                let socket: Socket<TReceive, TSend> = {
                  ...subscription,
                  subscription,
                  raw: rawSocket,
                  send: (data: TSend) => ({
                    perform(resolve, reject) {
                      if(rawSocket.readyState === 1) {
                        rawSocket.send(JSON.stringify(data), (err) => {
                          if(err) {
                            reject(err);
                          } else {
                            resolve();
                          }
                        });
                      }
                    }
                  })
                }
                yield handler(socket, req);
              } finally {
                rawSocket.close();
                req.destroy();
              }
            });
          })
        },

        *listen(port) {
          server = raw.listen(port);

          scope.spawn(throwOnErrorEvent(server));
          scope.spawn(ensure(() => { server.close() }));

          yield once(server, "listening");

          return server;
        },

        *join() {
          if (server) {
            yield once(server, 'close');
          }
        }
      }

      return express;
    }
  }
}
