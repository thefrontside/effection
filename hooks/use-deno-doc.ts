import { call, type Operation } from "effection";
import {
  doc,
  type DocNode,
  type DocOptions,
  ParamDef,
  TsTypeDef,
  TsTypeParamDef,
} from "jsr:@deno/doc@0.162.4";
import { replaceAll } from "../lib/replace-all.ts";
import { useDescription } from "./use-description-parse.tsx";

export type { DocNode };

export type ResolveLinkFunction = (
  symbol: string,
  connector?: string,
  method?: string,
) => Operation<string>;

export function* defaultLinkResolver(
  symbol: string,
  connector?: string,
  method?: string,
) {
  const name = [symbol, connector, method].filter(Boolean).join("");
  return `[${name}](${name})`;
}

export function* useDenoDoc(
  specifiers: string[],
  docOptions?: DocOptions,
): Operation<Record<string, DocNode[]>> {
  return yield* call(() => doc(specifiers, docOptions));
}

export interface DocPage {
  name: string;
  sections: DocPageSection[];
  description: string;
  kind: string;
}

export interface DocPageSection {
  node: DocNode;

  markdown?: string;

  ignore: boolean;
}

export function* useDocPages(
  docs: Record<string, DocNode[]>,
  options: { resolveMarkdownLink: ResolveLinkFunction },
) {
  const entrypoints: Record<string, DocPage[]> = {};

  for (const [url, all] of Object.entries(docs)) {
    const pages: DocPage[] = [];
    for (
      const [symbol, nodes] of Object.entries(
        Object.groupBy(all, (node) => node.name),
      )
    ) {
      if (nodes) {
        const sections: DocPageSection[] = [];
        for (const node of nodes) {
          if (node.jsDoc) {
            const { markdown, ignore } = yield* extractJsDoc(
              node,
              options?.resolveMarkdownLink,
            );
            sections.push({
              node,
              markdown,
              ignore,
            });
          } else {
            sections.push({
              node,
              markdown: "",
              ignore: false,
            });
          }
        }

        const description = yield* useDescription(
          sections.map((s) => s.markdown).filter((m) => m).join(""),
        );

        pages.push({
          name: symbol,
          kind: nodes?.at(0)?.kind ?? "",
          description,
          sections,
        });
      }
    }

    entrypoints[url] = pages;
  }

  return entrypoints;
}

export function* extractJsDoc(
  node: DocNode,
  resolve: ResolveLinkFunction = defaultLinkResolver,
) {
  let markdown = "";
  let ignore = false;

  function* replaceLinks(doc: string) {
    return yield* replaceAll(
      doc,
      /@?{@?link\s*(\w*)(\W)?(\w*)?}/gm,
      function* (match) {
        const [, symbol, connector, method] = match;
        return yield* resolve(symbol, connector, method);
      },
    );
  }

  if (node.jsDoc && node.jsDoc.doc) {
    markdown += yield* replaceLinks(node.jsDoc.doc);
  }

  const lines = [];

  const deprecated = node.jsDoc && node.jsDoc.tags?.flatMap(tag => tag.kind === "deprecated" ? [tag] : []);
  if (deprecated && deprecated.length > 0) {
    lines.push(``)
    for (const warning of deprecated) {
      if (warning.doc) {
        lines.push(
          `<div class="border-l-4 border-red-500 mt-0 [&>*]:my-0 pl-3">
            <span class="text-red-500 font-bold">Deprecated</span>
            ${yield* replaceLinks(warning.doc)}
          </div>
          `);
      }
    }
  }

  const examples = node.jsDoc &&
    node.jsDoc.tags?.flatMap((tag) => tag.kind === "example" ? [tag] : []);
  if (examples && examples?.length > 0) {
    lines.push("### Examples");
    let i = 1;
    for (const example of examples) {
      lines.push(`#### Example ${i++}`);
      lines.push(yield* replaceLinks(example.doc));
      lines.push("---");
    }
  }

  if (node.kind === "function") {
    const { typeParams } = node.functionDef;
    if (typeParams.length > 0) {
      lines.push("### Type Parameters");
      const jsDocs = node.jsDoc?.tags?.flatMap((tag) => tag.kind === "template" ? [tag] : []) ?? [];
      let i = 0;
      for (const typeParam of typeParams) {
        lines.push(yield* replaceLinks(TypeParam(typeParam)));
        if (jsDocs[i]) {
          lines.push(yield* replaceLinks(jsDocs[i].doc ?? ""))
        }
        i++;
      }
      
    }

    const { params } = node.functionDef;
    if (params.length > 0) {
      lines.push("### Parameters");
      const jsDocs = node.jsDoc?.tags?.flatMap((tag) => tag.kind === "param" ? [tag] : []) ?? [];
      let i = 0;
      for (const param of params) {
        lines.push(yield* replaceLinks(Param(param)));
        lines.push("\n");
        if (jsDocs[i] && jsDocs[i].doc) {
          lines.push(yield* replaceLinks(jsDocs[i].doc ?? ""))
        }
        i++;
      }
    }

    if (node.functionDef.returnType) {
      lines.push("### Return Type");
      lines.push(yield* replaceLinks(TypeDef(node.functionDef.returnType)))
      const jsDocs = node.jsDoc?.tags?.find((tag) => tag.kind === "return");
      if (jsDocs && jsDocs.doc) {
        lines.push("\n")
        lines.push(yield* replaceLinks(jsDocs.doc))
      }
    }
  }

  markdown += lines.join("\n");

  if (node.jsDoc && node.jsDoc.tags) {
    for (const tag of node.jsDoc.tags) {
      switch (tag.kind) {
        case "ignore": {
          ignore = true;
          break;
        }
      }
    }
  }

  return {
    markdown,
    ignore,
  };
}

function TypeDef(typeDef: TsTypeDef): string {
  switch (typeDef.kind) {
    case "fnOrConstructor": {
      const params = typeDef.fnOrConstructor.params.map(Param).join(", ");
      const tparams = typeDef.fnOrConstructor.typeParams.map(TypeParam).join(", ");
      return `(${params})${tparams.length > 0 ? `<${tparams}>` : ""} => ${TypeDef(typeDef.fnOrConstructor.tsType)}`
    }
    case "typeRef": {
      const tparams = typeDef.typeRef.typeParams?.map(TypeDef).join(", ")
      return `{@link ${typeDef.typeRef.typeName}}${tparams && tparams?.length > 0 ? `&lt;${tparams}&gt;` : ""} `
    }
    case "keyword": {
      return `__${typeDef.keyword}__`
    }
    case "union": {
      return typeDef.union.map(TypeDef).join(" | ");
    }
    case "array": {
      return `${TypeDef(typeDef.array)}&lbrack;&rbrack;`
    }
    case "typeOperator": {
      return `${typeDef.typeOperator.operator} ${TypeDef(typeDef.typeOperator.tsType)}`
    }
    case "tuple": {
      return `&lbrack;${typeDef.tuple.map(TypeDef).join(", ")}&rbrack;`;
    }
    case "conditional":
    case "importType":
    case "indexedAccess":
    case "infer":
    case "intersection":
    case "literal":
    case "mapped":
    case "optional":
    case "parenthesized": 
    case "rest":
    case "this":
    case "typeLiteral":
    case "typePredicate":
    case "typeQuery":
      console.log("TypeDef: unimplemented", typeDef);
  }
  return ""
}

function TypeParam(paramDef: TsTypeParamDef) {
  let parts = [paramDef.name];
  if (paramDef.constraint) {
    parts.push(`extends ${TypeDef(paramDef.constraint)}`);
  }
  if (paramDef.default) {
    parts.push(`= ${TypeDef(paramDef.default)}`);
  }
  return parts.join(" ")
}

function Param(paramDef: ParamDef) {
  switch (paramDef.kind) {
    case "identifier":
      {
        return `**${paramDef.name}**${paramDef.optional ? "?" : ""}: ${
          paramDef.tsType ? TypeDef(paramDef.tsType) : ""
        }`;
      }
    case "array":
    case "assign":
    case "object":
    case "rest":
      console.log("Param: unimplemented", paramDef)
  }
  return ""
}

// function Type({ node }: { node: DocNode }) {
//   switch (node.kind) {
//     case "function":
//       return `${node.functionDef.isAsync} && _async_ ${node.kind}${
//         node.functionDef.isGenerator && "*"
//       } ${node.name}: ()`;
//   }
// }