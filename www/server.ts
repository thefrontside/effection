import { serve } from "freejack/server.ts";
import { html } from "freejack/html.ts";
import { Outlet } from "freejack/view.ts";
import { Docs, loadDocs, useDocs } from "./docs/docs.ts";

import view from "./view.ts";

export default function* start() {
  let docs = yield* loadDocs();
  yield* Docs.set(docs);

  return yield* serve({
    "/": html.get(function* () {
      yield* Outlet.set(yield* view[1]["/"]());

      yield* Outlet.set(yield* view[0]({ title: "Effection" }));

      return yield* Outlet;
    }),

    "/docs/:id": html.get(function* ({ id }) {
      let docs = yield* useDocs();

      let doc = docs.getDoc(id);

      if (!doc) {
        return { name: "h1", attrs: {}, children: ["Not Found"] };
      }

      yield* Outlet.set(yield* view[1]["/docs/:id"](doc));

      yield* Outlet.set(yield* view[0]({ title: `${doc.title} | Effection` }));

      return yield* Outlet;
    }),
  });
}
