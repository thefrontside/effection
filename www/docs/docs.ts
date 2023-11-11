import { call, type Operation, spawn, type Task } from "effection";
import structure from "./structure.json" assert { type: "json" };

import { basename } from "https://deno.land/std@0.205.0/path/posix/basename.ts";

import remarkGfm from "npm:remark-gfm@3.0.1";
import rehypePrismPlus from "npm:rehype-prism-plus@1.5.1";

import { evaluate } from "npm:@mdx-js/mdx@2.3.0";

import { Fragment, jsx, jsxs } from "revolution/jsx-runtime";

export interface DocModule {
  default: () => JSX.Element;
  frontmatter: {
    id: string;
    title: string;
  };
}

export interface Docs {
  getDoc(id?: string): Operation<Doc | undefined>;
}

export interface Topic {
  name: string;
  items: DocMeta[];
}

export interface DocMeta {
  id: string;
  title: string;
  filename: string;
  topics: Topic[];
  next?: DocMeta;
  prev?: DocMeta;
}

export interface Doc extends DocMeta {
  MDXContent: () => JSX.Element;
}

export function* loadDocs(): Operation<Docs> {
  let loaders = new Map<string, Task<Doc>>();

  let entries = Object.entries(structure);

  let topics: Topic[] = [];

  for (let [name, contents] of entries) {
    let topic: Topic = { name, items: [] };
    topics.push(topic);

    let current: DocMeta | undefined = void (0);
    for (let i = 0; i < contents.length; i++) {
      let prev: DocMeta | undefined = current;
      let [filename, title] = contents[i];
      let meta: DocMeta = current = {
        id: basename(filename, ".mdx"),
        title,
        filename,
        topics,
        prev,
      };
      if (prev) {
        prev.next = current;
      }
      topic.items.push(current);

      loaders.set(
        meta.id,
        yield* spawn(function* () {
          let location = new URL(filename, import.meta.url);
          let source = yield* call(Deno.readTextFile(location));
          let mod = yield* call(evaluate(source, {
            jsx,
            jsxs,
            jsxDEV: jsx,
            Fragment,
            remarkPlugins: [
              remarkGfm,
            ],
            rehypePlugins: [
              [rehypePrismPlus, { showLineNumbers: true }],
            ],
          }));

          return {
            ...meta,
            MDXContent: () => mod.default({}),
          } as Doc;
        }),
      );
    }
  }

  return {
    *getDoc(id) {
      if (id) {
        let task = loaders.get(id);
        if (task) {
          return yield* task;
        }
      }
    },
  };
}
