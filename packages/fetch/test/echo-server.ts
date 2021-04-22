import { Operation, Task } from '@effection/core';
import { throwOnErrorEvent, once } from '@effection/events';
import { AddressInfo } from 'net';
import { createServer, Server, IncomingMessage, ServerResponse } from 'http';

export class EchoServer {
  requests: Array<[IncomingMessage, ServerResponse]> = [];

  private http: Server;

  constructor(private scope: Task) {
    this.http = createServer((req, res) => {
      this.requests.push([req, res]);
    });
  }

  get addressInfo(): AddressInfo {
    return this.http.address() as AddressInfo;
  }

  get last() {
    return this.requests[this.requests.length - 1];
  }

  get address() {
    return `http://localhost:${this.addressInfo.port}`;
  }

  get lastRequest(): IncomingMessage {
    if (this.last) {
      return this.last[0];
    } else {
      throw new Error('there have been no requests');
    }
  }

  get lastResponse(): ServerResponse {
    if (this.last) {
      return this.last[1];
    } else {
      throw new Error('there have been no requests');
    }
  }

  listen(): Operation<void> {
    let { scope, http } = this;
    return function*() {
      http.listen();

      try {
        yield once(http, 'listening');
      } catch (e) {
        http.close();
        throw e;
      }

      throwOnErrorEvent(scope, http);
      scope.spawn(function*() {
        try {
          yield;
        } finally {
          http.close();
        }
      });
    }
  }
}
