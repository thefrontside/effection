import { expect, type Operation } from "effection";
import { createContext } from "freejack/context.ts";
import structure from "./structure.json" assert { type: "json" };
import { compile } from "https://esm.sh/@mdx-js/mdx@2.3.0";
import remarkFrontmatter from "https://esm.sh/remark-frontmatter@4.0.1";
import remarkMdxFrontmatter from "https://esm.sh/remark-mdx-frontmatter@3.0.0";
import rehypePrismPlus from "https://esm.sh/rehype-prism-plus@1.5.1";
import remarkGfm from "https://esm.sh/remark-gfm@3.0.1";
import type { Tag } from "html";

export const Docs = createContext<Docs>("docs");
export const useDocs = Docs.expect;

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
}

export function* loadDocs(): Operation<Docs> {
  let topics: Topic[] = [];
  let docs: Record<string, Doc> = {};
  for (let [topicName, files] of Object.entries(structure)) {
    let topic = { name: topicName, items: [] } as Topic;

    topics.push(topic);

    for (let filename of files) {
      let bytes = yield* expect(Deno.readFile(`docs/${filename}`));
      let source = new TextDecoder().decode(bytes);

      let mdx = yield* expect(compile(source, {
        jsxImportSource: "html",
        remarkPlugins: [
          remarkFrontmatter,
          remarkMdxFrontmatter,
          remarkGfm,
        ],
        rehypePlugins: [
          rehypePrismPlus,
        ],
      }));

      let blob = new Blob([mdx.value], { type: "text/javascript" });

      let url = URL.createObjectURL(blob);

      let mod = yield* expect(import(url));

      let { id, title } = mod.frontmatter;

      let doc = {
        id,
        title,
        filename,
        MDXContent: () => {
          let tag: Tag<string> = mod.default();
          reclassify(tag);
          return tag;
        },
      } as Doc;

      topic.items.push(doc);
      docs[id] = doc;
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
