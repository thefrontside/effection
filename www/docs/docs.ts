import { createContext, expect, type Operation } from "effection";
import structure from "./structure.json" assert { type: "json" };

import remarkFrontmatter from "https://esm.sh/remark-frontmatter@4.0.1";
import remarkMdxFrontmatter from "https://esm.sh/remark-mdx-frontmatter@3.0.0";
import remarkGfm from "https://esm.sh/remark-gfm@3.0.1";

import rehypePrismPlus from "https://esm.sh/rehype-prism-plus@1.5.1";
import rehypeAutolinkHeadings from "https://esm.sh/rehype-autolink-headings@6.1.1";
import rehypeAddClasses from "https://esm.sh/rehype-add-classes@1.0.0";
import rehypeSlug from "https://esm.sh/rehype-slug@5.1.0";
import rehypeToc from "https://esm.sh/@jsdevtools/rehype-toc@3.0.2";

import { evaluate } from "https://esm.sh/@mdx-js/mdx@2.3.0";

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
      let location = new URL(filename, import.meta.url);
      let source = yield* expect(Deno.readTextFile(location));
      let mod = yield* expect(evaluate(source, {
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
          rehypeSlug,
          [rehypeAutolinkHeadings, {
            behavior: "append",
            properties: {
              className:
                "opacity-0 group-hover:opacity-100 after:content-['#']",
            },
          }],
          [rehypeAddClasses, {
            "h1[id],h2[id],h3[id],h4[id],h5[id],h6[id]": "group",
          }],
          [rehypeToc, {
            cssClasses: {
              toc: "fixed top-0 right-0",
            },
          }],
          rehypePrismPlus,
        ],
      }));

      let { id, title } = mod.frontmatter as { id: string; title: string };

      let previous = current;

      let doc = current = {
        id,
        title,
        filename,
        MDXContent: () => mod.default({}),
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
