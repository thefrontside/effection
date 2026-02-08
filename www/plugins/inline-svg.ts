import { exists } from "@std/fs";
import { join } from "@std/path";
import { until } from "effection";
import { fromHtml } from "hast-util-from-html";
import type { RevolutionPlugin } from "revolution";
import { visit } from "unist-util-visit";
import type { Element, Parent, RootContent } from "hast";

export interface InlineSvgOptions {
  /** Base directory to resolve SVG file paths from */
  readonly basedir: string;
}

/**
 * Revolution plugin that inlines SVG images into the HTML output.
 *
 * Any `<img>` element with a `data-inline-svg` attribute and a `.svg`
 * src will be replaced with the actual SVG markup, wrapped in a `<div>`
 * that carries the original `<img>` classes.
 *
 * Parsed SVGs are cached for the lifetime of the server.
 */
export function inlineSvgPlugin(options: InlineSvgOptions): RevolutionPlugin {
  let cache = new Map<string, Element>();

  return {
    *html(request, next) {
      let html = yield* next(request);

      // Phase 1: synchronous walk to collect replacement targets
      let replacements: { parent: Parent; index: number; src: string }[] = [];

      visit(html, "element", (node: Element, index, parent) => {
        if (
          node.tagName === "img" &&
          typeof node.properties?.src === "string" &&
          node.properties.src.endsWith(".svg") &&
          hasDataInlineSvg(node) &&
          parent &&
          typeof index === "number"
        ) {
          replacements.push({
            parent: parent as Parent,
            index,
            src: node.properties.src as string,
          });
        }
      });

      // Phase 2: async I/O for uncached SVGs, then replace nodes
      for (let { parent, index, src } of replacements) {
        let imgNode = parent.children[index] as Element;
        let filepath = resolveSvgPath(src, request.url, options.basedir);

        let svgElement = cache.get(filepath);

        if (!svgElement) {
          if (yield* until(exists(filepath))) {
            let svgString = yield* until(Deno.readTextFile(filepath));
            let svgTree = fromHtml(svgString, {
              fragment: true,
              space: "svg",
            });
            let found = svgTree.children.find(
              (c: RootContent) => c.type === "element" && c.tagName === "svg",
            ) as Element | undefined;

            if (found) {
              found.properties = {
                ...found.properties,
                style: "width: 100%; height: auto;",
              };
              delete found.properties.width;
              delete found.properties.height;
              svgElement = found;
              cache.set(filepath, svgElement);
            }
          }
        }

        if (svgElement) {
          let imgClasses = normalizeClassName(imgNode);

          parent.children[index] = {
            type: "element",
            tagName: "div",
            properties: { className: imgClasses },
            children: [structuredClone(svgElement)],
          };
        }
      }

      return html;
    },
  };
}

/**
 * Check for the data-inline-svg attribute. HAST may store data-*
 * attributes as either camelCase or literal kebab-case depending
 * on how the HTML was produced.
 */
function hasDataInlineSvg(node: Element): boolean {
  if (!node.properties) return false;
  return (
    node.properties["dataInlineSvg"] !== undefined ||
    node.properties["data-inline-svg"] !== undefined
  );
}

/**
 * Extract className from an element, normalizing to a string.
 * HAST stores className as string[] in some contexts.
 */
function normalizeClassName(node: Element): string {
  let value = node.properties?.className ?? node.properties?.class ?? "";
  if (Array.isArray(value)) {
    return value.join(" ");
  }
  return String(value);
}

/**
 * Resolve an SVG src (from the <img> tag) to a filesystem path.
 *
 * Handles both absolute paths (`/blog/2026-02-06-.../image.svg`)
 * and relative paths (`image.svg`, resolved against the request URL).
 */
function resolveSvgPath(
  src: string,
  requestUrl: string,
  basedir: string,
): string {
  if (src.startsWith("/")) {
    // Absolute path — join with basedir
    return join(basedir, src);
  }
  // Relative path — resolve against request URL directory
  let url = new URL(requestUrl);
  let dir = url.pathname.replace(/[^/]*$/, "");
  return join(basedir, dir, src);
}
