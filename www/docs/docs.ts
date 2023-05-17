import { createContext, type Operation } from "effection";
import structure from "./structure.json" assert { type: "json" };

import type { Tag } from "html";

import index from "./esm/index.ts";

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
  getTopics(): Topic[];
  getDoc(id: string): Doc | undefined;
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
  previous?: Doc;
  next?: Doc;
}

export function* loadDocs(): Operation<Docs> {
  let topics: Topic[] = [];
  let docs: Record<string, Doc> = {};
  let current: Doc | undefined;

  for (let [topicName, files] of Object.entries(structure)) {
    let topic = { name: topicName, items: [] } as Topic;

    topics.push(topic);

    for (let filename of files) {
      //@ts-expect-error json imports do not treat as const
      let mod = index[filename];

      let { id, title } = mod.frontmatter;

      let previous = current;
      let doc = current = {
        id,
        title,
        filename,
        MDXContent: () => {
          let tag: Tag<string> = mod.default();
          reclassify(tag);
          return tag;
        },
        previous,
      } as Doc;

      topic.items.push(doc);
      docs[id] = doc;
      if (previous) {
        previous.next = doc;
      }
    }
  }
  return {
    getTopics: () => topics,
    getDoc: (id) => docs[id],
  };
}

/**
 * Rewrite React `className` attrs to HTML `class`
 */
function reclassify(tag: Tag<string>) {
  if (tag.attrs && tag.attrs.className) {
    tag.attrs["class"] = tag.attrs.className;
    delete tag.attrs.className;
  }
  for (let child of tag.children) {
    if (typeof child !== "string") {
      reclassify(child);
    }
  }
}
