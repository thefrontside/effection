import type { Operation } from "effection";
import type { Doc } from "../docs/docs.ts";
import { useDocs } from "../docs/docs.ts";
import { Navburger } from "./components/navburger.tsx";
import { Rehype } from "./components/rehype.tsx";

import rehypeSlug from "npm:rehype-slug@5.1.0";
import rehypeAutolinkHeadings from "npm:rehype-autolink-headings@6.1.1";
import rehypeAddClasses from "npm:rehype-add-classes@1.0.0";
import rehypeToc from "npm:@jsdevtools/rehype-toc@3.0.2";

export default function* (doc: Doc): Operation<JSX.Element> {
  let docs = yield* useDocs();
  let topics = docs.getTopics();

  return (
    <section class="mx-auto md:pt-8 w-full justify-items-normal md:grid md:grid-cols-[200px_auto] lg:grid-cols-[200px_auto_200px] md:gap-4">
      <p class="text-right mr-4 md:hidden">
        <label class="cursor-pointer" for="nav-toggle">
          <Navburger />
        </label>
      </p>
      <style media="all">
        {`
        #nav-toggle:checked ~ aside#docbar {
          display: none;
        }
        `}
      </style>
      <input class="hidden" id="nav-toggle" type="checkbox" checked />
      <aside id="docbar" class="fixed top-0 h-full w-full grid grid-cols-2">
        <nav class="bg-white pr-4 border-r-2 h-full">
          {topics.map((topic) => (
            <hgroup class="prose text-sm">
              <h3>{topic.name}</h3>
              <menu class="pl-4">
                {topic.items.map((doc) => (
                  <li class="whitespace-nowrap">
                    <a href={`/docs/${doc.id}`}>{doc.title}</a>
                  </li>
                ))}
              </menu>
            </hgroup>
          ))}
        </nav>
        <label for="nav-toggle" class="h-full w-full bg-gray-500 opacity-50" />
      </aside>
      <aside>
        <nav class="hidden md:block fixed pl-4">
          {topics.map((topic) => (
            <hgroup class="prose text-sm">
              <h3>{topic.name}</h3>
              <menu class="pl-4">
                {topic.items.map((doc) => (
                  <li class="">
                    <a href={`/docs/${doc.id}`}>{doc.title}</a>
                  </li>
                ))}
              </menu>
            </hgroup>
          ))}
        </nav>
      </aside>
      <Transform fn={liftTOC}>
        <article class="prose px-4 min-w-full">
          <h1>{doc.title}</h1>
          <Rehype
            plugins={[
              rehypeSlug,
              [rehypeAutolinkHeadings, {
                behavior: "append",
                properties: {
                  className:
                    "opacity-0 group-hover:opacity-100 after:content-['#'] after:ml-1.5",
                },
              }],
              [rehypeAddClasses, {
                "h1[id],h2[id],h3[id],h4[id],h5[id],h6[id]": "group",
              }],
              [rehypeToc, {
                cssClasses: {
                  toc:
                    "hidden text-sm tracking-wide leading-loose lg:block relative whitespace-nowrap",
                  list: "fixed",
                },
              }],
            ]}
          >
            <doc.MDXContent />
          </Rehype>
          <NextPrevLinks doc={doc} />
        </article>
      </Transform>
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

import { Transform } from "./components/transform.tsx";

/**
 * Lift the table of contents for the guide so that it is a peer
 * of the article, not contained within it.
 */
function liftTOC(element: JSX.Element): JSX.Element {
  if (element.type !== "element") {
    return element;
  }
  let nav = element.children.find((child) =>
    child.type === "element" && child.tagName === "nav"
  );
  if (!nav) {
    return element;
  }
  return {
    type: "root",
    children: [
      {
        ...element,
        children: element.children.filter((child) => child !== nav),
      },
      nav,
    ],
  };
}
