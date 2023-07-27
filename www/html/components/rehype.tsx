import type { PluggableList } from "https://esm.sh/unified@10.1.2";
import { unified } from "https://esm.sh/unified@10.1.2";

export interface RehypeOptions {
  children: JSX.Element;
  plugins: PluggableList;
}

export function Rehype(options: RehypeOptions): JSX.Element {
  let { children, plugins } = options;
  let pipeline = unified().use(plugins);

  let result = pipeline.runSync(children);
  if (
    result.type === "text" || result.type === "element" ||
    result.type === "root"
  ) {
    return result as JSX.Element;
  } else {
    throw new Error(
      `rehype plugin stack: {options.plugins} did not return a HAST Element`,
    );
  }
}
