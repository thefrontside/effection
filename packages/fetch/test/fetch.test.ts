import { IncomingMessage } from 'http';
import { EchoServer } from "./echo-server";
import { run, when, never } from "./helpers";
import { fetch } from "../src";
import * as expect from 'expect';

describe("fetch in node", () => {
  let app: EchoServer;
  let response: Promise<Response>;
  let body: string;

  beforeEach(async () => {
    app = await run(EchoServer.listen());
  });

  describe('calling the server and posting a body', () => {
    beforeEach(async () => {
      response = run(fetch(`${app.address}`, {
        method: 'POST',
        body: JSON.stringify({
          hello: 'world'
        }),
        headers: {
          'content-type': 'application/json',
          'x-header': 'SOME_HEADER'
        }
      }));

      await when(() => expect(app.lastRequest).toBeDefined());
      body = JSON.parse(await read(app.lastRequest));
    });
    it("recieves the request", () => {
      expect(app.lastRequest).toBeDefined();
    });

    it("has body with hello: world", () => {
      expect(body).toEqual({hello: "world"});
    });

    it('has headers', () => {
      expect(app.lastRequest.headers).toMatchObject({
        'x-header': 'SOME_HEADER'
      })
    });

    describe('sending the headers from the server to the client, but not the complete body', () => {
      let error: Error;
      let body: Promise<string>;

      beforeEach(async () => {
        let serverResponse = app.lastResponse;
        serverResponse.writeHead(200, 'ok', {
          'Content-Type': 'text/plain',
          'Transfer-Encoding': 'chunked'
        });
        serverResponse.write("echo");

        let res = await response;

        body = res.text()
          .catch((e: Error) => {error = e; return ''});
      });

      it('returns the response, but does not resolve the response text', async () => {
        await never(() => expect(error).toBeDefined());
      });

      describe('completing the response body', () => {
        beforeEach(async () => {
          app.lastResponse.end();
        });
        it('resolves the reponse', async () => {
          expect(await body).toEqual('echo');
        });
      });

    });
  })
});

async function read(request: IncomingMessage): Promise<string> {
  let data = '';
  for await (let chunk of request) {
    data += chunk;
  }
  return data;
}
