import {
  all,
  call,
  type Operation,
  resource,
  type Task,
  useScope,
} from "effection";
import { basename } from "jsr:@std/path@1.0.8";
import { Repository } from "./repository.ts";
import { z } from "npm:zod@3.23.8";
import { useMarkdown } from "../hooks/use-markdown.tsx";
import { toc } from "../lib/toc.ts";
import { JSXElement } from "revolution/jsx-runtime";

export interface DocModule {
  default: () => JSX.Element;
  frontmatter: {
    id: string;
    title: string;
  };
}

export interface Docs {
  all(): Operation<Doc[]>;
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
  content: JSXElement;
  toc: JSXElement;
  markdown: string;
}

const Structure = z.record(
  z.string(),
  z.array(z.tuple([z.string(), z.string()])),
);

export type StructureJson = z.infer<typeof Structure>;

export function loadDocs(
  { repo, pattern }: { repo: Repository; pattern: string },
): Operation<Docs> {
  return resource(function* (provide) {
    let loaders: Map<string, Task<Doc>> | undefined = undefined;

    let scope = yield* useScope();

    function* load() {
      const latest = yield* repo.getLatestSemverTag(pattern);

      if (!latest) {
        throw new Error(`Could not retrieve latest tag for "${pattern}"`);
      }

      const ref = yield* repo.loadRef(`tags/${latest.name}`);

      const json = yield* ref.loadJson("www/docs/structure.json");

      const structure = Structure.parse(json);

      let tasks = new Map<string, Task<Doc>>();
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
            filename: `www/docs/${filename}`,
            topics,
            prev,
          };
          if (prev) {
            prev.next = current;
          }
          topic.items.push(current);

          tasks.set(
            meta.id,
            scope.run(function* () {
              let source = yield* call(() => ref.loadText(meta.filename));

              const content = yield* useMarkdown(source);

              return {
                ...meta,
                markdown: source,
                content,
                toc: toc(content),
              };
            }),
          );
        }
      }
      return tasks;
    }

    yield* provide({
      *all() {
        if (!loaders) {
          loaders = yield* load();
        }
        return yield* all([...loaders.values()]);
      },
      *getDoc(id) {
        if (id) {
          if (!loaders) {
            loaders = yield* load();
          }
          let task = loaders.get(id);
          if (task) {
            return yield* task;
          }
        }
      },
    });
  });
}
