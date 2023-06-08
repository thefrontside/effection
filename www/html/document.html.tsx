import type { Operation } from "effection";
import type { Doc } from "../docs/docs.ts";
import { useDocs } from "../docs/docs.ts";

export default function* (doc: Doc): Operation<JSX.Element> {
  let docs = yield* useDocs();
  let topics = docs.getTopics();

  return (
    <main class="grid grid-cols-4">
      <nav role="sidebar">
        {topics.map((topic) => (
          <menu>
            <li>
              <b>{topic.name}</b>
              <ul>
                {topic.items.map((doc) => (
                  <li>
                    <a href={`/docs/${doc.id}`}>{doc.title}</a>
                  </li>
                ))}
              </ul>
            </li>
          </menu>
        ))}
      </nav>
      <section class="col-span-3" role="content">
        <h1 class="font-bold text-2xl">{doc.title}</h1>
        <doc.MDXContent />
      </section>
    </main>
  );
}
