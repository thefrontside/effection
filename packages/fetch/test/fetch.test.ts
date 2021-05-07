import { IncomingMessage } from 'http';
import { EchoServer } from "./echo-server";
import { when, never } from "./helpers";
import { fetch } from "../src";
import * as expect from 'expect';

import { describe, it, beforeEach } from '@effection/mocha';

describe("fetch in node", () => {
  let app: EchoServer;
  let response: Promise<Response>;
  let body: string;

  beforeEach(function*(task) {
    app = new EchoServer(task);
    yield app.listen();
  });

  describe('calling the server and posting a body', () => {
    beforeEach(function*(task) {
      response = task.spawn(fetch(`${app.address}`, {
        method: 'POST',
        body: JSON.stringify({
          hello: 'world'
        }),
        headers: {
          'content-type': 'application/json',
          'x-header': 'SOME_HEADER'
        }
      }));

      yield when(() => expect(app.lastRequest).toBeDefined());
      body = JSON.parse(yield read(app.lastRequest));
    });
    it("recieves the request", function*() {
      expect(app.lastRequest).toBeDefined();
    });

    it("has body with hello: world", function*() {
      expect(body).toEqual({hello: "world"});
    });

    it('has headers', function*() {
      expect(app.lastRequest.headers).toMatchObject({
        'x-header': 'SOME_HEADER'
      })
    });

    describe('sending the headers from the server to the client, but not the complete body', () => {
      let error: Error;
      let body: Promise<string>;

      beforeEach(function*() {
        let serverResponse = app.lastResponse;
        serverResponse.writeHead(200, 'ok', {
          'Content-Type': 'text/plain',
          'Transfer-Encoding': 'chunked'
        });
        serverResponse.write("echo");

        let res = yield response;

        body = res.text()
          .catch((e: Error) => {error = e; return ''});
      });

      it('returns the response, but does not resolve the response text', function*() {
        yield never(() => expect(error).toBeDefined());
      });

      describe('completing the response body', () => {
        beforeEach(function*() {
          app.lastResponse.end();
        });
        it('resolves the reponse', function*() {
          expect(yield body).toEqual('echo');
        });
      });

    });
  })

  describe('.text', () => {
    it('returns text response', function*(task) {
      let response = task.spawn(fetch(`${app.address}`).text());

      yield when(() => expect(app.lastResponse).toBeDefined());
      app.lastResponse.writeHead(200, 'ok', { 'Content-Type': 'text/plain' });
      app.lastResponse.write("foobar");
      app.lastResponse.end();

      let result = yield response;
      expect(result).toEqual('foobar');
    });
  });

  describe('.json', () => {
    it('returns json response', function*(task) {
      let response = task.spawn(fetch(`${app.address}`).json());

      yield when(() => expect(app.lastResponse).toBeDefined());
      app.lastResponse.writeHead(200, 'ok', { 'Content-Type': 'application/json' });
      app.lastResponse.write(JSON.stringify({ foo: "bar" }));
      app.lastResponse.end();

      let result = yield response;
      expect(result.foo).toEqual('bar');
    });
  });
});

async function read(request: IncomingMessage): Promise<string> {
  let data = '';
  for await (let chunk of request) {
    data += chunk;
  }
  return data;
}
