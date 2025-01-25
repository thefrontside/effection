import type hast from "npm:@types/hast@3.0.4";
import {select} from "npm:hast-util-select@6.0.3";
import { toc as rehypeToc, Options } from "npm:@jsdevtools/rehype-toc@3.0.2";

export type Nodes = hast.Nodes;

export type TOCOptions = Options;

export function toc(tree: Nodes, options?: TOCOptions) {
  const tocTransformer = rehypeToc(options ?? {
    cssClasses: {
      toc: "hidden text-sm font-light tracking-wide leading-loose lg:block relative pt-2",
      list: "fixed w-[200px]",
      link: "hover:underline hover:underline-offset-2",
    },
  });

  return select("nav", tocTransformer(tree));
}