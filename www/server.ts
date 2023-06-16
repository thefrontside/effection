import { serve } from "freejack/server.ts";
import { html } from "freejack/html.ts";
import { Outlet } from "freejack/view.ts";
import { loadDocs } from "./docs/docs.ts";
import { loadAPIDocs } from "./docs/api.ts";

import view from "./view.ts";

export default function* start() {
  let docs = yield* loadDocs();
  let apidocs = yield* loadAPIDocs();

  return yield* serve({
    // this is the kinda api we want to go for.
    // "/": html.get(function*() {
    //   return yield* renderHTML(view, "/", { title: "Effection" });
    // },

    "/": html.get(function* () {
      let [appview, content] = view;

      yield* Outlet.set(yield* content["/"]());

      return yield* appview({ title: "Effection" });
    }),

    "/docs/:id": html.get(function* ({ id }) {
      let doc = docs.getDoc(id);

      if (!doc) {
        return { name: "h1", attrs: {}, children: ["Not Found"] };
      }

      let [appview, content] = view;
      yield* Outlet.set(yield* content["/docs/:id"](doc));

      return yield* appview({ title: `${doc.title} | Effection` });
    }),

    "/api": html.get(function* () {
      yield* Outlet.set(yield* view[1]["/api"][1]["/"]());

      yield* Outlet.set(yield* view[1]["/api"][0](apidocs));

      yield* Outlet.set(yield* view[0]({ title: `API Docs | Effection` }));

      return yield* Outlet;
    }),

    "/api/functions/:modname/:name": html.get(function* ({ modname, name }) {
      let fn = apidocs.getFunction(modname, name);

      if (!fn) {
        return { name: "h1", attrs: {}, children: ["Not Found"] };
      }

      yield* Outlet.set(
        yield* view[1]["/api"][1]["/functions/:modname/:name"](fn),
      );

      yield* Outlet.set(yield* view[1]["/api"][0](apidocs));

      yield* Outlet.set(
        yield* view[0]({ title: `${fn.name}() | Effection API Docs` }),
      );

      return yield* Outlet;
    }),

    "/api/types/:modname/:name": html.get(function* ({ modname, name }) {
      let type = apidocs.getType(modname, name);

      if (!type) {
        return { name: "h1", attrs: {}, children: ["Not Found"] };
      }

      yield* Outlet.set(
        yield* view[1]["/api"][1]["/types/:modname/:name"](type),
      );

      yield* Outlet.set(yield* view[1]["/api"][0](apidocs));

      yield* Outlet.set(
        yield* view[0]({ title: `${type.name} | Effection API Docs` }),
      );

      return yield* Outlet;
    }),
  });
}
