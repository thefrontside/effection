import { refractor } from "refractor/all";
import type { JSXElement } from "revolution/jsx-runtime";

const LANGS: Record<string, string> = {
  ts: "typescript",
  tsx: "tsx",
  js: "javascript",
  jsx: "jsx",
};

export interface CodeWindowProps {
  code: string;
  filename?: string;
  language?: string;
}

/**
 * CodeWindow — a "macOS window" code block: a chrome bar with three
 * traffic-light dots and an optional filename, above a syntax-highlighted
 * `<pre>`. Highlighting is produced at render time with `refractor` (the same
 * tokenizer `rehype-prism-plus` uses across the site), so colours come from
 * `/assets/prism-atom-one-dark.css` and follow the OS light/dark preference.
 */
export function CodeWindow(
  { code, filename, language = "ts" }: CodeWindowProps,
): JSXElement {
  let grammar = LANGS[language] ?? "typescript";
  // refractor returns a hast tree of <span class="token …"> nodes, which is the
  // same shape revolution's JSX runtime renders — embed its children directly.
  let tokens = refractor.highlight(code.replace(/\n$/, ""), grammar)
    .children as unknown as JSXElement[];

  return (
    <div class="overflow-hidden rounded-lg border border-gray-200 shadow-sm dark:border-gray-700">
      <div class="flex items-center gap-2 border-b border-gray-200 bg-gray-100 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-800">
        <span class="flex gap-1.5">
          <span class="h-3 w-3 rounded-full bg-[#ff5f57]"></span>
          <span class="h-3 w-3 rounded-full bg-[#febc2e]"></span>
          <span class="h-3 w-3 rounded-full bg-[#28c840]"></span>
        </span>
        {filename
          ? (
            <span class="ml-1 font-mono text-xs text-gray-500 dark:text-gray-400">
              {filename}
            </span>
          )
          : <></>}
      </div>
      <pre
        class={`language-${language} !m-0 !rounded-none overflow-x-auto p-4 text-[13.5px] leading-relaxed`}
      >
        <code class={`language-${language} code-highlight`}>{tokens}</code>
      </pre>
    </div>
  );
}
