import { call, useScope, type Operation } from "effection";
import {
  ClassMethodDef,
  doc,
  type DocNode,
  type DocOptions,
  ParamDef,
  TsTypeDef,
  TsTypeParamDef,
  CacheSetting,
  LoadResponse,
} from "jsr:@deno/doc@0.164.0";
import { createGraph } from "jsr:@deno/graph@0.86.7";

import { useDescription } from "./use-description-parse.tsx";
import { toHtml } from "npm:hast-util-to-html@9.0.4";
// @deno-types="npm:@types/parse-github-url@1.0.3";
import githubUrlParse from "npm:parse-github-url@1.0.3";

import { GithubClientContext } from "../context/github.ts";

export type { DocNode };

export function* useDenoDoc(
  specifiers: string[],
  docOptions?: DocOptions,
): Operation<Record<string, DocNode[]>> {
  return yield* call(() => doc(specifiers, docOptions));
}

export interface Dependency {
  source: string;
  name: string;
  version: string;
}

export interface DocPage {
  name: string;
  sections: DocPageSection[];
  description: string;
  kind: DocNode["kind"];
  dependencies: Dependency[];
}

export interface DocPageSection {
  id: string;

  node: DocNode;

  markdown?: string;

  ignore: boolean;
}

export const NO_DOCS_AVAILABLE = "*No documentation available.*";

export type DocsPages = Record<string, DocPage[]>;

export function* useDocPages(specifier: string): Operation<DocsPages> {
  const scope = yield* useScope();

  const loader = (specifier: string) => scope.run(docLoader(specifier));

  const graph = yield* call(() =>
    createGraph([specifier], {
      load: loader,
    }),
  );

  const externalDependencies: Dependency[] = graph.modules.flatMap((module) => {
    if (module.kind === "external") {
      const parts = module.specifier.match(/(.*):(.*)@(.*)/);
      if (parts) {
        const [, source, name, version] = parts;
        return [
          {
            source,
            name,
            version,
          },
        ];
      }
    }
    return [];
  });

  const docs = yield* useDenoDoc([specifier], {
    load: loader,
  });

  const entrypoints: Record<string, DocPage[]> = {};

  for (const [url, all] of Object.entries(docs)) {
    const pages: DocPage[] = [];
    for (const [symbol, nodes] of Object.entries(
      Object.groupBy(all, (node) => node.name),
    )) {
      if (nodes) {
        const sections: DocPageSection[] = [];
        for (const node of nodes) {
          const { markdown, ignore, pages: _pages } = yield* extract(node);
          sections.push({
            id: exportHash(node, sections.length),
            node,
            markdown,
            ignore,
          });
          pages.push(
            ..._pages.map((page) => ({
              ...page,
              dependencies: externalDependencies,
            })),
          );
        }

        const markdown = sections
          .map((s) => s.markdown)
          .filter((m) => m)
          .join("");

        const description = yield* useDescription(markdown);

        pages.push({
          name: symbol,
          kind: nodes?.at(0)?.kind!,
          description,
          sections,
          dependencies: externalDependencies,
        });
      }
    }

    entrypoints[url] = pages;
  }

  return entrypoints;
}

export function* extract(
  node: DocNode,
): Operation<{ markdown: string; ignore: boolean; pages: DocPage[] }> {
  const lines = [];
  const pages: DocPage[] = [];

  let ignore = false;

  if (node.jsDoc && node.jsDoc.doc) {
    lines.push(node.jsDoc.doc);
  }

  const deprecated =
    node.jsDoc &&
    node.jsDoc.tags?.flatMap((tag) => (tag.kind === "deprecated" ? [tag] : []));
  if (deprecated && deprecated.length > 0) {
    lines.push(``);
    for (const warning of deprecated) {
      if (warning.doc) {
        lines.push(
          `<div class="border-l-4 border-red-500 mt-1 [&>*]:my-0 pl-3">
          <span class="text-red-500 font-bold">Deprecated</span>

          ${warning.doc}
          
        </div>
        `,
        );
      }
    }
  }

  const examples =
    node.jsDoc &&
    node.jsDoc.tags?.flatMap((tag) => (tag.kind === "example" ? [tag] : []));
  if (examples && examples?.length > 0) {
    lines.push("### Examples");
    let i = 1;
    for (const example of examples) {
      lines.push(`#### Example ${i++}`, example.doc, "---");
    }
  }

  if (node.kind === "class") {
    if (node.classDef.constructors.length > 0) {
      lines.push(`### Constructors`, "<dl>");
      for (const constructor of node.classDef.constructors) {
        lines.push(
          `<dt>${NEW} **${node.name}**(${constructor.params.map(Param).join(", ")})</dt>`,
          `<dd>`,
          constructor.jsDoc,
          `</dd>`,
        );
      }
      lines.push("</dl>");
    }

    const nonStatic = node.classDef.methods.filter(
      (method) => !method.isStatic,
    );
    if (nonStatic.length > 0) {
      lines.push("### Methods", `<dl>`, ...methodList(nonStatic), "</dl>");
    }

    const staticMethods = node.classDef.methods.filter(
      (method) => method.isStatic,
    );
    if (staticMethods.length > 0) {
      lines.push(
        "### Static Methods",
        "<dl>",
        ...methodList(staticMethods),
        "</dl>",
      );
    }
  }

  if (node.kind === "namespace") {
    const variables =
      node.namespaceDef.elements.flatMap((node) =>
        node.kind === "variable" ? [node] : [],
      ) ?? [];
    if (variables.length > 0) {
      lines.push("### Variables");
      lines.push("<dl>");
      for (const variable of variables) {
        const name = `${node.name}.${variable.name}`;
        const section = yield* extract(variable);
        const description = variable.jsDoc?.doc || NO_DOCS_AVAILABLE;
        pages.push({
          name,
          kind: variable.kind,
          description,
          dependencies: [],
          sections: [
            {
              id: exportHash(variable, 0),
              node: variable,
              markdown: section.markdown,
              ignore: section.ignore,
            },
          ],
        });
        lines.push(
          `<dt>`,
          toHtml(<Icon kind={variable.kind} />),
          `[${name}](${name})`,
          `</dt>`,
        );
        lines.push(`<dd class="italic">`, description, `</dd>`);
      }
      lines.push("</dl>");
    }
  }

  if (node.kind === "interface") {
    lines.push("\n", ...TypeParams(node.interfaceDef.typeParams, node));

    if (node.interfaceDef.properties.length > 0) {
      lines.push("### Properties", "<dl>");
      for (const property of node.interfaceDef.properties) {
        const typeDef = property.tsType ? TypeDef(property.tsType) : "";
        const description = property.jsDoc?.doc || NO_DOCS_AVAILABLE;
        lines.push(
          `<dt class="border-dotted [&:not(:first-child)]:border-t-2 [&:not(:first-child)]:pt-3 [&:not(:first-child)]:mt-2">**${property.name}**: ${typeDef}</dt>`,
          `<dd class="flex flex-col [&>pre]:mb-3">`,
          description,
          "</dd>",
        );
      }
      lines.push("</dl>");
    }

    if (node.interfaceDef.methods.length > 0) {
      lines.push("### Methods", "<dl>");
      for (const method of node.interfaceDef.methods) {
        const typeParams = method.typeParams.map(TypeParam).join(", ");
        const params = method.params.map(Param).join(", ");
        const returnType = method.returnType ? TypeDef(method.returnType) : "";
        const description = method.jsDoc?.doc || NO_DOCS_AVAILABLE;
        lines.push(
          `<dt class="border-dotted [&:not(:first-child)]:border-t-2 [&:not(:first-child)]:pt-3 [&:not(:first-child)]:mt-2">**${method.name}**${typeParams ? `&lt;${typeParams}&gt;` : ""}(${params}): ${returnType}</dt>`,
          `<dd class="flex flex-col [&>pre]:mb-3">`,
          description,
          "</dd>",
        );
      }
      lines.push("</dl>");
    }
  }

  if (node.kind === "typeAlias") {
    lines.push("\n", ...TypeParams(node.typeAliasDef.typeParams, node));
  }

  if (node.kind === "function") {
    lines.push(...TypeParams(node.functionDef.typeParams, node));

    const { params } = node.functionDef;
    if (params.length > 0) {
      lines.push("### Parameters");
      const jsDocs =
        node.jsDoc?.tags?.flatMap((tag) =>
          tag.kind === "param" ? [tag] : [],
        ) ?? [];
      let i = 0;
      for (const param of params) {
        lines.push("\n", Param(param));
        if (jsDocs[i] && jsDocs[i].doc) {
          lines.push("\n", jsDocs[i].doc);
        }
        i++;
      }
    }

    if (node.functionDef.returnType) {
      lines.push("### Return Type", "\n", TypeDef(node.functionDef.returnType));
      const jsDocs = node.jsDoc?.tags?.find((tag) => tag.kind === "return");
      if (jsDocs && jsDocs.doc) {
        lines.push("\n", jsDocs.doc);
      }
    }
  }

  if (node.kind === "variable" && node.variableDef.tsType) {
    lines.push("### Type", "\n", TypeDef(node.variableDef.tsType))
  }

  const see: string[] = [];
  if (node.jsDoc && node.jsDoc.tags) {
    for (const tag of node.jsDoc.tags) {
      switch (tag.kind) {
        case "ignore": {
          ignore = true;
          break;
        }
        case "see": {
          see.push(tag.doc);
        }
      }
    }
  }
  if (see.length > 0) {
    lines.push("\n", "### See", ...see.map((item) => `* ${item}`));
  }

  const markdown = lines.join("\n");

  return {
    markdown,
    ignore,
    pages,
  };
}

function TypeParams(typeParams: TsTypeParamDef[], node: DocNode) {
  let lines = [];
  if (typeParams.length > 0) {
    lines.push("### Type Parameters");
    const jsDocs =
      node.jsDoc?.tags?.flatMap((tag) =>
        tag.kind === "template" ? [tag] : [],
      ) ?? [];
    let i = 0;
    for (const typeParam of typeParams) {
      lines.push(TypeParam(typeParam));
      if (jsDocs[i]) {
        lines.push(jsDocs[i].doc);
      }
      lines.push("\n");
      i++;
    }
  }
  return lines;
}

function TypeDef(typeDef: TsTypeDef): string {
  switch (typeDef.kind) {
    case "fnOrConstructor": {
      const params = typeDef.fnOrConstructor.params.map(Param).join(", ");
      const tparams = typeDef.fnOrConstructor.typeParams
        .map(TypeParam)
        .join(", ");
      return `(${params})${tparams.length > 0 ? `<${tparams}>` : ""} => ${TypeDef(
        typeDef.fnOrConstructor.tsType,
      )}`;
    }
    case "typeRef": {
      const tparams = typeDef.typeRef.typeParams?.map(TypeDef).join(", ");
      return `{@link ${typeDef.typeRef.typeName}}${
        tparams && tparams?.length > 0 ? `&lt;${tparams}&gt;` : ""
      }`;
    }
    case "keyword": {
      return typeDef.keyword;
    }
    case "union": {
      return typeDef.union.map(TypeDef).join(" | ");
    }
    case "array": {
      return `${TypeDef(typeDef.array)}&lbrack;&rbrack;`;
    }
    case "typeOperator": {
      return `${typeDef.typeOperator.operator} ${TypeDef(
        typeDef.typeOperator.tsType,
      )}`;
    }
    case "tuple": {
      return `&lbrack;${typeDef.tuple.map(TypeDef).join(", ")}&rbrack;`;
    }
    case "parenthesized": {
      return TypeDef(typeDef.parenthesized);
    }
    case "intersection": {
      return typeDef.intersection.map(TypeDef).join(" &amp; ");
    }
    case "conditional":
    case "importType":
    case "indexedAccess":
    case "infer":
    case "literal":
    case "mapped":
    case "optional":
    case "rest":
    case "this":
    case "typeLiteral":
      // todo(taras): this is incomplete
      return `&#123;&#125;`;
    case "typePredicate":
    case "typeQuery":
      console.log("TypeDef: unimplemented", typeDef);
  }
  return "";
}

function TypeParam(paramDef: TsTypeParamDef) {
  let parts = [`{@link ${paramDef.name}}`];
  if (paramDef.constraint) {
    parts.push(`extends ${TypeDef(paramDef.constraint)}`);
  }
  if (paramDef.default) {
    parts.push(`= ${TypeDef(paramDef.default)}`);
  }
  return parts.join(" ");
}

function Param(paramDef: ParamDef): string {
  switch (paramDef.kind) {
    case "identifier": {
      return `**${paramDef.name}**${
        paramDef.optional ? OPTIONAL : ""
      }: ${paramDef.tsType ? TypeDef(paramDef.tsType) : ""}`;
    }
    case "rest": {
      return `...${Param(paramDef.arg)}: ${paramDef.tsType ? TypeDef(paramDef.tsType) : ""}`;
    }
    case "assign":
    case "array":
    case "object":
      console.log("Param: unimplemented", paramDef);
  }
  return "";
}

export function Icon({ kind }: { kind: string }) {
  switch (kind) {
    case "function":
      return (
        <span class="rounded-full bg-sky-100 inline-block w-6 h-full mr-1 text-center">
          f
        </span>
      );
    case "interface":
      return (
        <span class="rounded-full bg-orange-50 text-orange-600 inline-block w-6 h-full mr-1 text-center">
          I
        </span>
      );
    case "typeAlias":
      return (
        <span class="rounded-full bg-red-50 text-red-600 inline-block w-6 h-full mr-1 text-center">
          T
        </span>
      );
    case "variable": {
      return (
        <span class="rounded-full bg-purple-200 text-violet-600 inline-block w-6 h-full mr-1 text-center">
          v
        </span>
      );
    }
  }
  return <></>;
}

function exportHash(node: DocNode, index: number): string {
  return [node.kind, node.name, index].filter(Boolean).join("_");
}

const OPTIONAL = `<span class="inline-block bg-sky-100 rounded px-2 text-sm text-sky-900 mx-1">optional</span>`;
const NEW = `<span class="inline-block bg-violet-100 rounded px-2 text-sm text-violet-900 mx-1">new</span>`;

function methodList(methods: ClassMethodDef[]) {
  const lines = [];
  for (const method of methods) {
    const typeParams = method.functionDef.typeParams.map(TypeParam).join(", ");
    const params = method.functionDef.params.map(Param).join(", ");
    const returnType = method.functionDef.returnType
      ? TypeDef(method.functionDef.returnType)
      : "";
    const description = method.jsDoc?.doc || NO_DOCS_AVAILABLE;
    lines.push(
      `<dt>**${method.name}**${typeParams ? `&lt;${typeParams}&gt;` : ""}(${params}): ${returnType}</dt>`,
      `<dd class="flex flex-col [&>pre]:mb-3 [&:not(:last-child)]:border-dotted [&:not(:last-child)]:border-b-2 [&:not(:last-child)]:pb-3 [&:not(:last-child)]:mb-3">`,
      description,
      "</dd>",
    );
  }
  return lines;
}

function docLoader(
  specifier: string,
  _isDynamic?: boolean,
  _cacheSetting?: CacheSetting,
  _checksum?: string,
): () => Operation<LoadResponse | undefined> {
  return function* downloadDocModules() {
    const github = yield* GithubClientContext.expect();

    const url = URL.parse(specifier);

    if (url?.host === "github.com") {
      const gh = githubUrlParse(specifier);
      if (gh && gh.owner && gh.name && gh.filepath) {
        const result = yield* call(() =>
          github.rest.repos.getContent({
            owner: gh.owner!,
            repo: gh.name!,
            path: gh.filepath!,
            ref: gh.branch,
            mediaType: {
              format: "raw",
            },
          }),
        );
        return {
          kind: "module",
          specifier,
          content: `${result.data}`,
        };
      } else {
        throw new Error(`Could not parse ${specifier} as Github URL`);
      }
    }

    if (url?.host === "jsr.io") {
      console.log(`Ignoring ${url} while reading docs`);
    }
  };
}

export function isDocsPages(value: unknown): value is DocsPages {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  // Check if each key is a string and value is an array of DocPage objects
  for (const key in value) {
    if (typeof key !== "string") {
      return false;
    }

    const pages = (value as Record<string, unknown>)[key];

    if (!Array.isArray(pages)) {
      return false;
    }

    // Check if each item in the array is a valid DocPage
    for (const page of pages) {
      if (!isDocPage(page)) {
        return false;
      }
    }
  }

  return true;
}

function isDocPage(value: unknown): value is DocPage {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const page = value as DocPage;

  return (
    typeof page.name === "string" &&
    Array.isArray(page.sections) && page.sections.every(isDocPageSection) &&
    typeof page.description === "string" &&
    typeof page.kind === "string" &&
    Array.isArray(page.dependencies) && page.dependencies.every(isDependency)
  );
}

function isDocPageSection(value: unknown): value is DocPageSection {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const section = value as DocPageSection;

  return (
    typeof section.id === "string" &&
    typeof section.node === "object" && section.node !== null && // You might need a guard for DocNode if it's complex
    (typeof section.markdown === "undefined" || typeof section.markdown === "string") &&
    typeof section.ignore === "boolean"
  );
}

function isDependency(value: unknown): value is Dependency {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const dependency = value as Dependency;

  return (
    typeof dependency.source === "string" &&
    typeof dependency.name === "string" &&
    typeof dependency.version === "string"
  );
}
