import { posixNormalize } from "https://deno.land/std@0.203.0/path/_normalize.ts";

import { selectAll } from "npm:hast-util-select@6.0.1";
import type { Element } from "hastx/jsx-runtime";

/**
 * Rebase an HTML document at a different URL. This replaces all `<a href>` and
 * `<img src>` attributes that contain an absolute path. Any path that is
 * relative or contains a fully qualitfied URL will be left alone.
 *
 * @param tree - the HTML tree to transform
 * @param baseUrl - a string representing a fully qualified url, e.g.
 *   http://frontside.com/effection
 */
export function rebase(tree: JSX.Element, baseUrl?: string): void {
  if (baseUrl) {
    let base = new URL(baseUrl);
    let hrefs: Element[] = selectAll('[href^="/"],[src^="/"]', tree);
    for (let element of hrefs) {
      let properties = element.properties!;

      if (properties.href) {
        properties.href = posixNormalize(`${base.pathname}${properties.href}`);
      }
      if (properties.src) {
        properties.src = posixNormalize(`${base.pathname}${properties.src}`);
      }
    }
  }
}
