import { serve } from "freejack/server.ts";
import { html } from "freejack/html.ts";
import { Outlet } from "freejack/view.ts";
import { loadDocs, loadAPIDocs } from "./docs/docs.ts";

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

      yield* Outlet.set(content["/"]());

      return yield* appview({ title: "Effection" });
    }),

    "/docs/:id": html.get(function* ({ id }) {
      let doc = docs.getDoc(id);

      if (!doc) {
        return { name: "h1", attrs: {}, children: ["Not Found"] };
      }

      let [appview, content] = view;
      yield* Outlet.set(content["/docs/:id"](doc));

      return yield* appview({ title: `${doc.title} | Effection` });
    }),

    "/api": html.get(function*() {
      let [appview, content] = view;

      yield* Outlet.set(content["/api"](apidocs));

      return yield* appview({ title: `API Docs | Effection` });
    })
  });
}
