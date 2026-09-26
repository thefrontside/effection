/**
 * The markdown twin of the API reference: the same symbols the HTML index and
 * symbol pages show, written out as markdown so that an agent following
 * `llms.txt` never has to read a rendered page.
 *
 * These are the string builders. The routes in `routes/api-markdown-route.ts`
 * supply the content, which comes from the same `pkg.docs()` the HTML routes
 * render.
 */

export interface ApiSymbol {
  name: string;
  /** exported from the package's `./experimental` entrypoint */
  experimental?: boolean;
}

export interface ApiVersion {
  /** series the symbols belong to, e.g. `v4` */
  series: string;
  /** version of the release that series resolves to, e.g. `4.1.1` */
  version: string;
  symbols: ApiSymbol[];
}

export interface ApiSection {
  /** the declaration, as the symbol page shows it */
  signature: string;
  /** the symbol's documentation */
  markdown: string;
  /** where the declaration lives */
  source?: string;
}

/**
 * Path of a symbol's markdown page. Experimental symbols live under an
 * `/experimental` segment, the same as their HTML pages.
 */
export function apiSymbolPath(series: string, symbol: ApiSymbol): string {
  let namespace = symbol.experimental ? `${series}/experimental` : series;

  return `/api/${namespace}/${symbol.name}.md`;
}

export function apiIndexMarkdown(
  versions: ApiVersion[],
  url: (path: string) => string,
): string {
  let sections = versions.map(({ series, version, symbols }) => {
    let entries = symbols.map((symbol) => {
      let href = url(apiSymbolPath(series, symbol));
      let suffix = symbol.experimental ? " (experimental)" : "";

      return `- [${symbol.name}](${href})${suffix}`;
    });

    return [`## ${version}`, "", ...entries].join("\n");
  });

  return `${["# API Reference", ...sections].join("\n\n")}\n`;
}

export function apiSymbolMarkdown(
  name: string,
  sections: ApiSection[],
): string {
  let bodies = sections.map(({ signature, markdown, source }) => {
    let body = ["```ts", signature, "```", "", markdown.trim()];

    if (source) {
      body.push("", `[View code](${source})`);
    }

    return body.join("\n");
  });

  return `${[`# ${name}`, ...bodies].join("\n\n")}\n`;
}
