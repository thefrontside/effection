import { serve } from "freejack/server.ts";
import { html } from "freejack/html.ts";
import { Outlet } from "freejack/view.ts";
import { Docs, loadDocs, useDocs } from "./docs/docs.ts";

import view from "./view.ts";

export default function* start() {

  let docs = yield* loadDocs();
  yield* Docs.set(docs);

  return yield* serve({

    // this is the kinda api we want to go for.
    // "/": html.get(function*() {
    //   return yield* renderHTML(view, "/", { title: "Effection" });
    // },

    "/": html.get(function*() {
      let [appview, content] = view;

      yield* Outlet.set(content["/"]());

      return yield* appview({ title: "Effection" });

    }),

    "/docs/:id": html.get(function*({ id }) {
      let docs = yield* useDocs();

      let doc = docs.getDoc(id);

      if (!doc) {
        return { name: "h1", attrs: {}, children: ["Not Found"] };
      }

      let [appview, content] = view;
      yield* Outlet.set(content["/docs/:id"](doc));

      return yield* appview({title: `${doc.title} | Effection`});
    })
  });;
}
