import { Application } from "https://deno.land/x/oak@v12.5.0/mod.ts";
import type { ApplicationListenEvent } from "https://deno.land/x/oak@v12.5.0/application.ts";
import {
  action,
  expect,
  type Operation,
  type Resolve,
  resource,
  suspend,
} from "effection";

export {
  type Context,
  type Middleware,
  Router,
  type RouterContext,
  type RouterMiddleware,
} from "https://deno.land/x/oak@v12.5.0/mod.ts";

export interface OakServer {
  url: string;
  hostname: string;
  port: number;
}

export interface OakOptions {
  hostname?: string;
  port?: number;
  init(app: Application): Operation<void>;
}

export function useOak(options: OakOptions): Operation<OakServer> {
  return resource(function* (provide) {
    let { abort, signal } = createAbortController();
    let app = new Application();

    yield* options.init(app);

    let done = app.listen({ port: 8080, signal });

    try {
      let listening = yield* once<ApplicationListenEvent>(app, "listen");
      let { hostname, port, secure } = listening;
      let protocol = secure ? "https" : "http";
      let url = `${protocol}://${hostname}:${port}`;

      yield* provide({ hostname, port, url });
    } finally {
      abort();
      yield* expect(done);
    }
  });
}

function createAbortController() {
  let controller = new AbortController();
  return {
    abort: () => controller.abort(),
    signal: controller.signal,
  };
}

export function once<T extends Event>(
  target: EventTarget,
  eventName: string,
): Operation<T> {
  return action<T>(function* (resolve) {
    try {
      target.addEventListener(eventName, resolve as Resolve<Event>);
      yield* suspend();
    } finally {
      target.removeEventListener(eventName, resolve as Resolve<Event>);
    }
  });
}
