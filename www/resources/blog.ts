import { call, createContext, type Operation, resource } from "effection";
import { existsSync } from "@std/fs";
import { Fragment, jsx, jsxs } from "revolution/jsx-runtime";
import { type JSXElement } from "revolution/jsx-runtime";

// deno-lint-ignore no-import-prefix
import { evaluate } from "npm:@mdx-js/mdx@3.1.0";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import remarkGfm from "remark-gfm";
import rehypePrismPlus from "rehype-prism-plus";
import rehypeSlug from "rehype-slug";
import rehypeAddClasses from "rehype-add-classes";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import z from "zod";

export interface Blog {
  get(id: string): BlogPost | undefined;
  getPosts(): BlogPost[];
  getPostsByTag(tag: string): BlogPost[];
}

export interface BlogPost {
  id: string;
  title: string;
  description: string;
  image: string;
  date: Date;
  author: string;
  tags: string[];
  content: () => JSXElement;
}

let Frontmatter = z.object({
  title: z.string(),
  description: z.string(),
  author: z.string(),
  tags: z.array(z.string()).default([]),
  image: z.string(),
});

const BlogContext = createContext<Blog>("blog");

export function* useBlog(): Operation<Blog> {
  return yield* BlogContext.expect();
}

export function* initBlog(): Operation<void> {
  let blog = yield* loadBlog();
  yield* BlogContext.set(blog);
}

function* loadBlog(): Operation<Blog> {
  return yield* resource(function* (provide) {
    // Blog posts are in the www/blog directory
    let directory = new URL(import.meta.resolve("../blog/")).pathname;

    // Check if directory exists
    if (!existsSync(directory)) {
      // Return empty blog if no posts exist yet
      yield* provide({
        get: () => undefined,
        getPosts: () => [],
        getPostsByTag: () => [],
      });
      return;
    }

    let entries = Deno.readDirSync(directory);

    // Find all blog post directories matching date pattern
    let matches = [...entries].flatMap((entry) => {
      let markdownfile = `${directory}${entry.name}/index.md`;
      if (entry.isDirectory && existsSync(markdownfile)) {
        let [match] = [...entry.name.matchAll(/(\d{4})-(\d{2})-(\d{2})-.*/g)];
        if (match) {
          let [dirname, yearstring, monthstring, daystring] = match;
          let date = new Date(
            Number(yearstring),
            Number(monthstring) - 1,
            Number(daystring),
          );
          return [{ markdownfile, dirname, date, id: dirname }];
        }
      }
      return [];
    });

    let posts = new Map<string, BlogPost>();
    let tags = new Map<string, BlogPost[]>();

    // Process each post
    for (let match of matches.toReversed()) {
      let { date, id, markdownfile } = match;
      let source = yield* call(() => Deno.readTextFile(markdownfile));

      let mod = yield* call(() =>
        evaluate(source, {
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
            [rehypePrismPlus, { showLineNumbers: true }],
            [
              rehypeAutolinkHeadings,
              {
                behavior: "append",
                properties: {
                  className:
                    "opacity-0 group-hover:opacity-100 after:content-['#'] after:ml-1.5 no-underline",
                },
              },
            ],
            [
              rehypeAddClasses,
              {
                "h1[id],h2[id],h3[id],h4[id],h5[id],h6[id]":
                  "group scroll-mt-[100px] grow",
                pre: "grid",
              },
            ],
          ],
        })
      );

      let frontmatter = Frontmatter.parse(mod.frontmatter);
      let post: BlogPost = {
        id,
        date,
        title: frontmatter.title,
        description: frontmatter.description,
        author: frontmatter.author,
        tags: frontmatter.tags,
        image: frontmatter.image,
        content: () => mod.default({}) as JSXElement,
      };

      posts.set(id, post);

      // Index by tags
      for (let tag of post.tags) {
        let key = normalizeTag(tag);
        if (tags.has(key)) {
          tags.get(key)!.push(post);
        } else {
          tags.set(key, [post]);
        }
      }
    }

    // Sort by date descending (newest first)
    let values = [...posts.values()].sort(
      (a, b) => b.date.getTime() - a.date.getTime(),
    );

    yield* provide({
      get: (id: string) => posts.get(id),
      getPosts: () => values,
      getPostsByTag: (tag: string) => tags.get(normalizeTag(tag)) ?? [],
    });
  });
}

function normalizeTag(tag: string): string {
  return tag.toLocaleUpperCase().replaceAll(/\W/g, "-");
}
