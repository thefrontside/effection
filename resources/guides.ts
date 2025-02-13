import {
  all,
  call,
  type Operation,
  resource,
  type Task,
  useScope,
} from "effection";
import { basename } from "jsr:@std/path@1.0.8";
import { z } from "npm:zod@3.23.8";
import { JSXElement } from "revolution/jsx-runtime";

import { useMarkdown } from "../hooks/use-markdown.tsx";
import { createToc } from "../lib/toc.ts";
import { RepositoryRef } from "./repository-ref.ts";

export interface DocModule {
  default: () => JSX.Element;
  frontmatter: {
    id: string;
    title: string;
  };
}

export interface Guides {
  all(): Operation<GuidesPage[]>;
  get(id?: string): Operation<GuidesPage | undefined>;
  first(): Operation<GuidesPage>;
}

export interface Topic {
  name: string;
  items: GuidesMeta[];
}

export interface GuidesMeta {
  id: string;
  title: string;
  filename: string;
  topics: Topic[];
  next?: GuidesMeta;
  prev?: GuidesMeta;
}

export interface GuidesPage extends GuidesMeta {
  content: JSXElement;
  toc: JSXElement;
  markdown: string;
}

const Structure = z.record(
  z.string(),
  z.array(z.tuple([z.string(), z.string()])),
);

export type StructureJson = z.infer<typeof Structure>;

export function guides(
  { ref }: { ref: RepositoryRef },
): Operation<Guides> {
  return resource(function* (provide) {
    let loaders: Map<string, Task<GuidesPage>> | undefined = undefined;

    let scope = yield* useScope();

    function* fetchLoaders() {
      const json = yield* ref.loadJson("docs/structure.json");

      const structure = Structure.parse(json);

      let tasks = new Map<string, Task<GuidesPage>>();
      let entries = Object.entries(structure);

      let topics: Topic[] = [];

      for (let [name, contents] of entries) {
        let topic: Topic = { name, items: [] };
        topics.push(topic);

        let current: GuidesMeta | undefined = void (0);
        for (let i = 0; i < contents.length; i++) {
          let prev: GuidesMeta | undefined = current;
          let [filename, title] = contents[i];
          let meta: GuidesMeta = current = {
            id: basename(filename, ".mdx"),
            title,
            filename: `docs/${filename}`,
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
                toc: createToc(content),
              };
            }),
          );
        }
      }
      return tasks;
    }

    function* load() {
      if (!loaders) {
        loaders = yield* fetchLoaders();
      }
      return loaders;
    }

    yield* provide({
      *first() {
        const [[_id, task]] = (yield* load()).entries();
        return yield* task;
      },
      *all() {
        const loaders = yield* load();
        return yield* all([...loaders.values()]);
      },
      *get(id) {
        if (id) {
          const loaders = yield* load();
          let task = loaders.get(id);
          if (task) {
            return yield* task;
          }
        }
      },
    });
  });
}
