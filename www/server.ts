import { serve } from "freejack/server.ts";
import { html } from "freejack/html.ts";
import { Outlet } from "freejack/view.ts";
import { useDocs } from "./docs/docs.ts";

import view from "./view.ts";

export default serve({

  "/": html.get(function*() {
    let [appview, content] = view;

    yield* Outlet.set(content["/"]());

    return yield* appview({ title: "Effection" });

  }),

  "/docs/:id": html.get(function*({ id }) {
    let [appview, content] = view;
    let docs = yield* useDocs();

    const doc = docs.getDoc(id);
    if (!doc) {
      return { name: "h1", attrs: {}, children: ["Not Found"] };
    }

    yield* Outlet.set(content["/docs/:id"](doc));

    return yield* appview({title: `${doc.title} | Effection`});
  })
});
