import { expect, type Operation } from "effection";
import structure from "./structure.json" assert { type: "json" };
import { compile } from "npm:@mdx-js/mdx";
import remarkFrontmatter from "npm:remark-frontmatter";
import remarkMdxFrontmatter from "npm:remark-mdx-frontmatter";

export interface Topic {
  name: string;
  items: {
    id: string;
    title: string;
    MDXContent: () => JSX.Element;
    filename: string;
  }[]
}


export function* loadDocs(): Operation<Topic[]> {
  let topics: Topic[] = [];
  for (let [topicName, files] of Object.entries(structure)) {
    let topic = { name: topicName, items: [], } as Topic;
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

      topic.items.push({
        id,
        title,
        filename
      })
    }
  }
  return topics;
}
