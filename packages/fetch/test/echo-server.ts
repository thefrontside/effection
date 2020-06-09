import { Operation, resource } from 'effection';
import * as express from 'express';
import { throwOnErrorEvent, once, on } from '@effection/events';
import { Subscribable } from '@effection/subscription';
import { AddressInfo } from 'net';

export class EchoServer {
  lastRequest?: express.Request;
  
  constructor(private addressInfo: AddressInfo) {}
  
  get address() {
    return `http://localhost:${this.addressInfo.port}`;
  }
  
  static *listen(): Operation<EchoServer> {
    
    let app = express().use(express.json());

    let http = app.listen();

    try {
      yield once(http, 'listening');
    } catch (e) {
      http.close();

      throw e;
    }

    let server = yield resource(new EchoServer(http.address() as AddressInfo), function*() {
      yield throwOnErrorEvent(http);

      try {
        yield Subscribable
          .from<[express.Request, express.Response], void>(on(http, 'request'))
          .forEach(function *([req, res]) {
            server.lastRequest = req;
          });
      } finally {
        http.close();        
      }
    });

    return server;
  }
}

