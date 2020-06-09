import { Operation } from 'effection';
import * as express from 'express';
import { throwOnErrorEvent, once, on, Subscription } from '@effection/events';
import { AddressInfo } from 'net';

export class EchoServer {
  app = express();
  lastRequest?: express.Request;
  addressInfo?: AddressInfo;

  *listen(ready: () => void): Operation<void> {
    let http = this.app.listen();

    yield throwOnErrorEvent(http);

    try {
      yield once(http, 'listening');

      this.addressInfo = http.address() as AddressInfo;

      ready();

      let subscription: Subscription<[express.Request, express.Response]> = yield on(http, 'request');

      while (true) {
        let next = yield subscription.next();
        
        let [req, res]: [express.Request, express.Response] = next.value;

        this.lastRequest = req;

        res.end("ok");
      }

    } finally {
      http.close();
    }
  }
}

