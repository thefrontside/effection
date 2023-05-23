import { type Handler, serve as $serve } from "https://deno.land/std@0.188.0/http/server.ts";
import { type Operation, action, expect, resource, useScope } from "effection";
import { createRouteRecognizer } from "freejack/route-recognizer.ts";
import type { ServeHandler } from "./types.ts";
//import staticFiles from "https://deno.land/x/static_files@1.1.6/mod.ts";

export interface FreejackServerOptions {
  serve: Operation<Handler>;
  port: number;
}

export interface FreejackServer {
  hostname: string;
  port: number;
}

export function useServer(
  options: FreejackServerOptions,
): Operation<FreejackServer> {
  return resource(function*(provide) {
    let handler = yield* options.serve;

    let controller = new AbortController();
    let { signal } = controller;

    let [done, server] = yield* action<[Promise<void>, FreejackServer]>(function*(resolve) {
      let promise = Promise.resolve();
      promise = $serve(handler, {
        port: options.port,
        signal,
        onListen(s) {
          resolve([promise, s]);
        }
      });
    });

    try {
      yield* provide(server);
    } finally {
      controller.abort();
      yield* expect(done);
    }
  })
}

export function serve(paths: Record<string, ServeHandler>): Operation<Handler>  {
  return resource(function*(provide) {
    let scope = yield* useScope();

    let recognizer = createRouteRecognizer();

    for (let [path, handler] of Object.entries(paths)) {
      recognizer.add([{ path, handler }]);
    }

    yield* provide(function Handler(request) {
      return scope.run(function*() {
        try {

          let url = new URL(request.url);

          let result = recognizer.recognize(url.pathname);
          let segment = result[0];

          if (!segment) {
            return new Response("Not Found", {
              status: 404,
              statusText: "Not Found",
            });
          } else {
            let handler = segment.handler as ServeHandler;
            if (request.method.toUpperCase() === handler.method) {
              return yield* handler.middleware(segment.params, request);
            } else {
              console.dir({ not: "found"} );
              return new Response("Not Found", {
                status: 404,
                statusText: "Not Found",
              });
            }
          }
        } catch (error) {
          return new Response(error.stack, {
            status: 500,
            statusText: "Internal Error",
          });
        }
      });
    })
  });
}
