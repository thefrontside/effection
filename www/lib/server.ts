import { getframe, type Operation, useScope } from "effection";
import { type OakServer, useOak, Router } from "freejack/oak.ts";
import { createRouteRecognizer, type Pattern } from "freejack/route-recognizer.ts";
import { twind } from "freejack/twind.ts";
import type { Route, ServerHandler } from "./types.ts";
import type { Tag } from "html";
import { render } from "html/render-incremental-dom.ts";
import { Document } from "dom";
import staticFiles from "https://deno.land/x/static_files@1.1.6/mod.ts";

export interface FreejackServerOptions {
  app: Route<void>;
  port: number;
}

export function useServer(
  options: FreejackServerOptions,
): Operation<OakServer> {
  return useOak({
    port: options.port,
    *init(http) {
      let { app } = options;

      let recognizer = createRecognizer(app, function*() {});

      let scope = yield* useScope();

      http.use(staticFiles("assets/images", { prefix: "/assets/images" }));

      let router = new Router();

      http.use(router.routes());

      http.use((ctx) =>
        scope.run(function* (): Operation<void> {
          let segments = recognizer.recognize(ctx.request.url.pathname);

          if (!segments) {
            ctx.response.body = "Not Found";
          } else {
            let frame = yield* getframe();
            let top: Tag<string> = ["html", {}, []];

            for (let i = segments.length - 1; i >= 0; i--) {
              let result = segments[i];
              let handler = result.handler as ServerHandler<unknown>;
              let model = yield* handler.model(result.params);
              let view = yield* handler.view(model);
              top = frame.context.outlet = view;
            }


            let doc = new Document().implementation.createHTMLDocument();
            if (!doc.documentElement) {
              throw new Error("null document element");
            }

            let element = doc.documentElement;

            render(top, element);

            twind(top, doc);

            ctx.response.body = element.outerHTML;
          }
        }));
    }
  });
}

export function createRecognizer(
  app: any,
  server: any,
): ReturnType<typeof createRouteRecognizer> {
  let recognizer = createRouteRecognizer();
  let collection = collect({
    app,
    server,
    path: "",
    pathway: [],
    patterns: [],
  });

  for (let patterns of collection) {
    recognizer.add(patterns);
  }

  return recognizer;
}

interface PatternCollector {
  app: any;
  server: any;
  path: string;
  patterns: Pattern[][];
  pathway: Pattern[];
}

export function collect(collector: PatternCollector): Pattern[][] {
  let { app, server, path, pathway } = collector;
  if (typeof app === "function") {
    return [
      ...collector.patterns,
      [...pathway, { path, handler: { model: server, view: app } }],
    ];
  } else if (Array.isArray(app)) {
    let [model, childserver] = server;
    let [view, childapp] = app;

    let pattern = { path: "", handler: { model, view } };
    return collect({
      ...collector,
      app: childapp,
      server: childserver,
      pathway: pathway.concat(pattern),
    });
  } else {
    let patterns = collector.patterns;
    for (let [key, childapp] of Object.entries(app)) {
      let childserver = server[key];
      patterns = patterns.concat(collect({
        app: childapp,
        server: childserver,
        path: key,
        patterns: [],
        pathway,
      }));
    }
    return patterns;
  }
}
