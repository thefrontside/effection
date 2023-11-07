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
  let topics = yield* docs.getTopics();
  let next = yield* docs.getDoc(doc.nextId);
  let prev = yield* docs.getDoc(doc.previousId);

  return (
    <section class="mx-auto md:pt-8 w-full justify-items-normal md:grid md:grid-cols-[225px_auto] lg:grid-cols-[225px_auto_200px] md:gap-4">
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
        <nav class="bg-white px-2 border-r-2 h-full pt-20">
          {topics.map((topic) => (
            <hgroup>
              <h3 class="text-lg">{topic.name}</h3>
              <menu class="text-gray-700">
                {topic.items.map((item) => (
                  <li class="mt-1">
                    {doc.id !== item.id
                      ? (
                        <a
                          class="rounded px-4 block w-full h-full py-2 hover:bg-gray-100"
                          href={`/docs/${item.id}`}
                        >
                          {item.title}
                        </a>
                      )
                      : (
                        <a class="rounded px-4 block w-full h-full py-2 bg-gray-100 cursor-default">
                          {item.title}
                        </a>
                      )}
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
            <hgroup>
              <h3 class="text-lg">{topic.name}</h3>
              <menu class="text-gray-700">
                {topic.items.map((item) => (
                  <li class="mt-1">
                    {doc.id !== item.id
                      ? (
                        <a
                          class="rounded px-4 block w-full h-full py-2 hover:bg-gray-100"
                          href={`/docs/${item.id}`}
                        >
                          {item.title}
                        </a>
                      )
                      : (
                        <a class="rounded px-4 block w-full h-full py-2 bg-gray-100 cursor-default">
                          {item.title}
                        </a>
                      )}
                  </li>
                ))}
              </menu>
            </hgroup>
          ))}
        </nav>
      </aside>
      <Transform fn={liftTOC}>
        <article class="prose px-6 min-w-full">
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
                    "hidden text-sm font-light tracking-wide leading-loose lg:block relative whitespace-nowrap",
                  list: "fixed",
                },
              }],
            ]}
          >
            <doc.MDXContent />
          </Rehype>
          <NextPrevLinks prev={prev} next={next} />
        </article>
      </Transform>
    </section>
  );
}

function NextPrevLinks({ next, prev }: { next?: Doc, prev?: Doc }): JSX.Element {
  return (
    <menu class="grid grid-cols-2 my-10 gap-x-2 xl:gap-x-20 2xl:gap-x-40 text-lg">
      {prev
        ? (
          <li class="col-start-1 text-left font-light border-1 rounded-lg p-4">
            Previous
            <a
              class="py-2 block text-xl font-bold text-blue-primary no-underline tracking-wide leading-5 before:content-['«&nbsp;'] before:font-normal"
              href={`/docs/${prev.id}`}
            >
              {prev.title}
            </a>
          </li>
        )
        : <li />}
      {next
        ? (
          <li class="col-start-2 text-right font-light border-1 rounded-lg p-4">
            Next
            <a
              class="py-2 block text-xl font-bold text-blue-primary no-underline tracking-wide leading-5 after:content-['&nbsp;»'] after:font-normal"
              href={`/docs/${next.id}`}
            >
              {next.title}
            </a>
          </li>
        )
        : <li />}
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
