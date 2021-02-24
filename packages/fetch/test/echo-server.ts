import { Operation, resource } from '@effection/core';
import { throwOnErrorEvent, once, on } from '@effection/events';
import { AddressInfo } from 'net';
import { createServer, IncomingMessage, ServerResponse } from 'http';

export class EchoServer {
  requests: Array<[IncomingMessage, ServerResponse]> = [];

  constructor(private addressInfo: AddressInfo) {}

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

  static *listen(): Operation<EchoServer>
{
    let http = createServer((req, res) => {
      server.requests.push([req, res]);
    });
    http.listen();

    try {
      yield once(http, 'listening');
    } catch (e) {
      http.close();
      throw e;
    }

    let server: EchoServer = yield resource(new EchoServer(http.address() as AddressInfo), function*() {
      yield throwOnErrorEvent(http);

      try {
        yield;
      } finally {
        http.close();
      }
    });

    return server;
  }
}
