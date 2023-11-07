import { createContext, all, call, spawn, type Operation, type Task } from "effection";
import structure from "./structure.json" assert { type: "json" };

import { basename } from "https://deno.land/std@0.205.0/path/posix/basename.ts";

import remarkFrontmatter from "npm:remark-frontmatter@4.0.1";
import remarkMdxFrontmatter from "npm:remark-mdx-frontmatter@3.0.0";
import remarkGfm from "npm:remark-gfm@3.0.1";
import rehypePrismPlus from "npm:rehype-prism-plus@1.5.1";

import { evaluate } from "npm:@mdx-js/mdx@2.3.0";

import { Fragment, jsx, jsxs } from "hastx/jsx-runtime";

export const Docs = createContext<Docs>("docs");
export const useDocs = () => Docs;

export interface DocModule {
  default: () => JSX.Element;
  frontmatter: {
    id: string;
    title: string;
  };
}

export interface Docs {
  getTopics(): Operation<Topic[]>;
  getDoc(id?: string): Operation<Doc | undefined>;
}

export interface Topic {
  name: string;
  items: Doc[];
}

export interface Doc {
  id: string;
  title: string;
  MDXContent: () => JSX.Element;
  filename: string;
  nextId?: string;
  previousId?: string;
}

export function* loadDocs(): Operation<Docs> {

  let loaders = new Map<string, Task<Doc>>();

  let entries = Object.entries(structure);

  let topics = entries.map(([name]) => ({ name, items: []}) as Topic)

  let topicsByName = new Map<string, Topic>(topics.map(topic => [topic.name, topic]));

  let files = entries.flatMap(([topicName, files]) => {
    return files.map((filename, topicIndex) => ({ topicName, topicIndex, filename, id: basename(filename, ".mdx") }));
  })

  for (let i = 0; i < files.length; i++ ) {
    let file = files[i];
    let nextId = files[i + 1]?.id;
    let previousId = files[i - 1]?.id;
    let { topicName, topicIndex, filename, id } = file;
    let location = new URL(filename, import.meta.url);

    loaders.set(id, yield* spawn(function*() {
      let source = yield* call(Deno.readTextFile(location));
      let mod = yield* call(evaluate(source, {
        jsx,
        jsxs,
        jsxDEV: jsx,
        Fragment,
        remarkPlugins: [
          remarkFrontmatter,
          remarkMdxFrontmatter,
          remarkGfm,
        ],
        rehypePlugins: [
          [rehypePrismPlus, { showLineNumbers: true }],
        ],
      }));

      let { title } = mod.frontmatter as { id: string; title: string };

      let doc: Doc = {
        id,
        nextId,
        previousId,
        title,
        filename,
        MDXContent: () => mod.default({}),
      } as Doc;

      let topic = topicsByName.get(topicName);

      topic!.items[topicIndex] = doc;

      return doc;
    }));

  }

  return yield* Docs.set({
    *getTopics() {
      yield* all([...loaders.values()]);
      return topics;
    },
    *getDoc(id) {
      if (id) {
        let task = loaders.get(id);
        if (task) {
          return yield* task;
        }
      }
    },
  });
}
