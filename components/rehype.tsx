import rehypeAddClasses from "npm:rehype-add-classes@1.0.0";
import rehypeAutolinkHeadings from "npm:rehype-autolink-headings@7.1.0";
import rehypeInferDescriptionMeta from "npm:rehype-infer-description-meta@2.0.0";
import rehypeSlug from "npm:rehype-slug@6.0.0";
import { unified, type PluggableList } from "npm:unified@11.0.5";
import type { JSXElement } from "revolution/jsx-runtime";


export interface RehypeOptions {
  children: JSX.Element;
  plugins: PluggableList;
}

export function OriginalRehype(options: RehypeOptions): JSX.Element {
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

interface RehypeProps {
  children: JSXElement;
}

export function Rehype({ children }: RehypeProps) {
  return (
    <OriginalRehype
      plugins={[
        rehypeSlug,
        rehypeInferDescriptionMeta,
        [
          rehypeAutolinkHeadings,
          {
            behavior: "append",
            properties: {
              className:
                "opacity-0 group-hover:opacity-100 after:content-['#'] after:ml-1.5",
            },
          },
        ],
        [
          rehypeAddClasses,
          {
            "h1[id],h2[id],h3[id],h4[id],h5[id],h6[id]": "group",
            pre: "grid",
          },
        ],
      ]}
    >
      {children}
    </OriginalRehype>
  );
}
