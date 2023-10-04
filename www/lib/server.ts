import {
  type Handler,
  serve as $serve,
} from "https://deno.land/std@0.188.0/http/server.ts";
import { serveDir } from "https://deno.land/std@0.190.0/http/file_server.ts";
import { action, expect, type Operation, resource, useScope } from "effection";
import { createRouteRecognizer } from "freejack/route-recognizer.ts";
import type { ServeHandler } from "./types.ts";

export interface FreejackServerOptions {
  serve(): Operation<Handler>;
  port: number;
  dir: string;
}

export interface FreejackServer {
  hostname: string;
  port: number;
}

export function useServer(
  options: FreejackServerOptions,
): Operation<FreejackServer> {
  return resource(function* (provide) {
    let requestHandler = yield* options.serve();

    let handler: Handler = async (request, info) => {
      let pathname = new URL(request.url).pathname;
      if (pathname.startsWith("/assets")) {
        return serveDir(request, { fsRoot: options.dir });
      } else {
        return await requestHandler(request, info);
      }
    };

    let controller = new AbortController();
    let { signal } = controller;

    let [done, server] = yield* action<[Promise<void>, FreejackServer]>(
      function* (resolve) {
        let promise = Promise.resolve();
        promise = $serve(handler, {
          port: options.port,
          signal,
          onListen(s) {
            resolve([promise, s]);
          },
        });
      },
    );

    try {
      yield* provide(server);
    } finally {
      controller.abort();
      yield* expect(done);
    }
  });
}

export function serve(paths: Record<string, ServeHandler>): Operation<Handler> {
  return resource(function* (provide) {
    let scope = yield* useScope();

    let recognizer = createRouteRecognizer();

    for (let [path, handler] of Object.entries(paths)) {
      recognizer.add([{ path, handler }]);
    }

    yield* provide(function Handler(request) {
      return scope.run(function* () {
        try {
          let url = new URL(request.url);

          let result = recognizer.recognize(url.pathname);

          if (!result || !result[0]) {
            return new Response("Not Found", {
              status: 404,
              statusText: "Not Found",
            });
          } else {
            let segment = result[0];
            let handler = segment.handler as ServeHandler;
            if (
              !handler.method || request.method.toUpperCase() === handler.method
            ) {
              return yield* handler.middleware(segment.params, request);
            } else {
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
    });
  });
}
