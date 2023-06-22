import type { Operation } from "effection";
import type { Doc } from "../docs/docs.ts";
import { useDocs } from "../docs/docs.ts";

export default function* (doc: Doc): Operation<JSX.Element> {
  let docs = yield* useDocs();
  let topics = docs.getTopics();

  return (
    <section class="grid grid-cols-4">
      <nav role="navigation" class="hidden fixed md:block">
        {topics.map((topic) => (
          <details open>
            <summary>{topic.name}</summary>
            <menu>
              {topic.items.map((doc) => (
                <li>
                  <a href={`/docs/${doc.id}`}>{doc.title}</a>
                </li>
              ))}
            </menu>
          </details>
        ))}
      </nav>
      <article class="prose col-span-3 md:col-start-2">
        <h1>{doc.title}</h1>
        <doc.MDXContent />
        <NextPrevLinks doc={doc} />
      </article>
    </section>
  );
}

function NextPrevLinks({ doc }: { doc: Doc }): JSX.Element {
  return (
    <menu class="grid grid-cols-2">
      {doc.previous
        ? (
          <li class="col-start-1 text-left">
            Previous
            <a class="block" href={`/docs/${doc.previous.id}`}>
              ‹‹{doc.previous.title}
            </a>
          </li>
        )
        : ""}
      {doc.next
        ? (
          <li class="col-start-2 text-right">
            Next
            <a class="block" href={`/docs/${doc.next.id}`}>{doc.next.title}</a>
          </li>
        )
        : ""}
    </menu>
  );
}
