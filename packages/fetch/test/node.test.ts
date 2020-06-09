import { EchoServer } from "./echo-server";
import { spawn } from "./helpers";
import { fetch } from "../src";
import * as expect from 'expect';

describe("fetch in node", () => {
  let app: EchoServer;

  beforeEach(async () => {
    app = await spawn(EchoServer.listen());
  });

  describe('calling the server and posting a body', () => {
    beforeEach(async () => {
      await spawn(fetch(`${app.address}`, {
        method: 'POST',
        body: JSON.stringify({
          hello: 'world'
        }),
        headers: {
          'content-type': 'application/json',
          'x-header': 'SOME_HEADER'
        }
      }))
    });
    it("recieves the request", () => {
      expect(app.lastRequest).toBeDefined();
    });
    it("has body with hello: world", () => {
      expect(app.lastRequest?.body).toEqual({"hello":"world"})
    });
    it('has headers', () => {
      expect(app.lastRequest?.headers).toMatchObject({
        'x-header': 'SOME_HEADER'
      })
    });
  })
});