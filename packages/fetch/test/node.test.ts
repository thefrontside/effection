import { EchoServer } from "./echo-server";
import { spawn } from "./helpers";
import { Deferred } from "./deferred";

describe("fetch in node", () => {
  let app: EchoServer;

  beforeEach(async () => {
    app = new EchoServer();

    let ready = Deferred<void>();

    await spawn(app.listen(ready.resolve));

    await ready.promise;
  });
});