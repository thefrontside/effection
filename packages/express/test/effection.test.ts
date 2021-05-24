import { describe, beforeEach, it } from '@effection/mocha';
import expect from 'expect';
import fetch, { Response } from 'node-fetch';

import { Express, express } from '../src/index';

describe('express', () => {
  let app: Express;

  beforeEach(function*() {
    app = yield express();

    app.use((req, res) => function*() {
      res.send("hello");
      res.end();
    });

    yield app.listen(26000);
  });

  describe('sending requests to the express app', () => {
    let response: Response;
    let text: string;

    beforeEach(function*() {
      response = yield fetch("http://localhost:26000");
      text = yield response.text();
    });

    it('contains response text from express', function*() {
      expect(response.status).toEqual(200);
      expect(text).toEqual("hello");
    });
  });
});
