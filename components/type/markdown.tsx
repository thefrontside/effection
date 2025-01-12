import { Operation } from "effection";
import type {
  ClassMethodDef,
  DocNode,
  ParamDef,
  TsTypeDef,
  TsTypeParamDef,
} from "jsr:@deno/doc@0.164.0/types";
import { toHtml } from "npm:hast-util-to-html@9.0.0";
import { DocPage } from "../../hooks/use-deno-doc.tsx";
import { Icon } from "./icon.tsx";

const NEW =
  `<span class="inline-block bg-violet-100 rounded px-2 text-sm text-violet-900 mx-1">new</span>`;
const OPTIONAL =
  `<span class="inline-block bg-sky-100 rounded px-2 text-sm text-sky-900 mx-1">optional</span>`;

export const NO_DOCS_AVAILABLE = "*No documentation available.*";

export function* extract(
  node: DocNode,
): Operation<{ markdown: string; ignore: boolean; pages: DocPage[] }> {
  const lines = [];
  const pages: DocPage[] = [];

  let ignore = false;

  if (node.jsDoc && node.jsDoc.doc) {
    lines.push(node.jsDoc.doc);
  }

  const deprecated = node.jsDoc &&
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

  const examples = node.jsDoc &&
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
          `<dt>${NEW} **${node.name}**(${
            constructor.params
              .map(Param)
              .join(", ")
          })</dt>`,
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
    const variables = node.namespaceDef.elements.flatMap((node) =>
      node.kind === "variable" ? [node] : []
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
          `<dt class="border-dotted [&:not(:first-child)]:border-t-2 [&:not(:first-child)]:pt-3 [&:not(:first-child)]:mt-2">**${method.name}**${
            typeParams ? `&lt;${typeParams}&gt;` : ""
          }(${params}): ${returnType}</dt>`,
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
      const jsDocs = node.jsDoc?.tags?.flatMap((tag) =>
        tag.kind === "param" ? [tag] : []
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
    lines.push("### Type", "\n", TypeDef(node.variableDef.tsType));
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

export function exportHash(node: DocNode, index: number): string {
  return [node.kind, node.name, index].filter(Boolean).join("_");
}

export function TypeParams(typeParams: TsTypeParamDef[], node: DocNode) {
  let lines = [];
  if (typeParams.length > 0) {
    lines.push("### Type Parameters");
    const jsDocs = node.jsDoc?.tags?.flatMap((tag) =>
      tag.kind === "template" ? [tag] : []
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

export function TypeDef(typeDef: TsTypeDef): string {
  switch (typeDef.kind) {
    case "fnOrConstructor": {
      const params = typeDef.fnOrConstructor.params.map(Param).join(", ");
      const tparams = typeDef.fnOrConstructor.typeParams
        .map(TypeParam)
        .join(", ");
      return `(${params})${tparams.length > 0 ? `<${tparams}>` : ""} => ${
        TypeDef(
          typeDef.fnOrConstructor.tsType,
        )
      }`;
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
      return `${typeDef.typeOperator.operator} ${
        TypeDef(
          typeDef.typeOperator.tsType,
        )
      }`;
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
    case "typeLiteral": {
      // todo(taras): this is incomplete
      return `&#123;&#125;`;
    }
    case "mapped": {
      return `[${TypeParam(typeDef.mappedType.typeParam)}]: ${
        typeDef.mappedType.tsType ? TypeDef(typeDef.mappedType.tsType) : ""
      }`;
    }
    case "conditional": {
      return `${TypeDef(typeDef.conditionalType.checkType)} extends ${
        TypeDef(typeDef.conditionalType.extendsType)
      } ? ${
        TypeDef(
          typeDef.conditionalType.trueType,
        )
      } : ${TypeDef(typeDef.conditionalType.falseType)}`;
    }
    case "indexedAccess": {
      return `${TypeDef(typeDef.indexedAccess.objType)}[${
        TypeDef(typeDef.indexedAccess.indexType)
      }]`;
    }
    case "importType":
    case "infer":
    case "literal":
    case "optional":
    case "rest":
    case "this":
    case "typePredicate":
    case "typeQuery":
      console.log("TypeDef: unimplemented", typeDef);
  }
  return "";
}

function TypeParam(paramDef: TsTypeParamDef) {
  let parts = [`{@link ${paramDef.name}}`];
  if (paramDef.constraint) {
    if (
      paramDef.constraint.kind === "typeOperator" &&
      paramDef.constraint.typeOperator.operator === "keyof"
    ) {
      parts.push(`in ${TypeDef(paramDef.constraint)}`);
    } else {
      parts.push(`extends ${TypeDef(paramDef.constraint)}`);
    }
  }
  if (paramDef.default) {
    parts.push(`= ${TypeDef(paramDef.default)}`);
  }
  return parts.join(" ");
}

function Param(paramDef: ParamDef): string {
  switch (paramDef.kind) {
    case "identifier": {
      return `**${paramDef.name}**${paramDef.optional ? OPTIONAL : ""}: ${
        paramDef.tsType ? TypeDef(paramDef.tsType) : ""
      }`;
    }
    case "rest": {
      return `...${Param(paramDef.arg)} ${
        paramDef.tsType ? TypeDef(paramDef.tsType) : ""
      }`;
    }
    case "assign":
    case "array":
    case "object":
      console.log("Param: unimplemented", paramDef);
  }
  return "";
}

export function methodList(methods: ClassMethodDef[]) {
  const lines = [];
  for (const method of methods) {
    const typeParams = method.functionDef.typeParams.map(TypeParam).join(", ");
    const params = method.functionDef.params.map(Param).join(", ");
    const returnType = method.functionDef.returnType
      ? TypeDef(method.functionDef.returnType)
      : "";
    const description = method.jsDoc?.doc || NO_DOCS_AVAILABLE;
    lines.push(
      `<dt>**${method.name}**${
        typeParams ? `&lt;${typeParams}&gt;` : ""
      }(${params}): ${returnType}</dt>`,
      `<dd class="flex flex-col [&>pre]:mb-3 [&:not(:last-child)]:border-dotted [&:not(:last-child)]:border-b-2 [&:not(:last-child)]:pb-3 [&:not(:last-child)]:mb-3">`,
      description,
      "</dd>",
    );
  }
  return lines;
}
