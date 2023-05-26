import { expect, type Operation } from "effection";
import { createContext } from "freejack/context.ts";
import structure from "./structure.json" assert { type: "json" };
import { compile } from "npm:@mdx-js/mdx";
import remarkFrontmatter from "npm:remark-frontmatter";
import remarkMdxFrontmatter from "npm:remark-mdx-frontmatter";

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
        MDXContent: mod.default,
      } as Doc;

      topic.items.push(doc);
      docs[id] = doc;
    }
  }
  return {
    getTopics: () => topics,
    getDoc: (id) => docs[id],
  }
}
