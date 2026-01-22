import { basename } from "@std/path";
import {
  all,
  createContext,
  type Operation,
  resource,
  type Task,
  until,
  useScope,
} from "effection";
import { JSXElement } from "revolution/jsx-runtime";
import { z } from "zod";

import { useMarkdown } from "../hooks/use-markdown.tsx";
import { createToc } from "../lib/toc.ts";
import { useWorktree } from "../lib/worktrees.ts";
import { $ } from "../context/shell.ts";

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

const GuidesContext = createContext<Map<string, Guides>>("guides");

export type GuidesOptions = {
  current: string;
  worktrees: string[];
};

export function* initGuides(options: GuidesOptions): Operation<void> {
  let guides = new Map<string, Guides>();

  let path = yield* useGitRoot();
  guides.set(options.current, yield* loadGuides(path));

  for (let series of options.worktrees) {
    let path = yield* useWorktree(series);
    guides.set(series, yield* loadGuides(path));
  }

  yield* GuidesContext.set(guides);
}

export function* useGitRoot() {
  let result = yield* $(`git rev-parse --show-toplevel`);
  return result.stdout.trim();
}

export function* useGuides(series: string): Operation<Guides> {
  let guidesBySeries = yield* GuidesContext.expect();
  let guides = guidesBySeries.get(series);
  if (!guides) {
    throw new Error(`guides not found for series '${series}'`);
  }
  return guides;
}

export function loadGuides(dirpath: string): Operation<Guides> {
  return resource(function* (provide) {
    let scope = yield* useScope();
    let loaders = new Map<string, Task<GuidesPage>>();

    let structureModule = yield* until(
      import(`${dirpath}/docs/structure.json`, { with: { type: "json" } }),
    );

    let structure = Structure.parse(structureModule.default);

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

        loaders.set(
          meta.id,
          scope.run(function* () {
            let source = yield* until(
              Deno.readTextFile(`${dirpath}/${meta.filename}`),
            );

            let content = yield* useMarkdown(source);

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

    yield* provide({
      *first() {
        let [[_id, task]] = loaders.entries();
        return yield* task;
      },
      *all() {
        return yield* all([...loaders.values()]);
      },
      *get(id) {
        if (id) {
          let task = loaders.get(id);
          if (task) {
            return yield* task;
          }
        }
      },
    });
  });
}
