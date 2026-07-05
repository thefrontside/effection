import { Operation } from "effection";
import type {
  ClassMethodDef,
  Declaration,
  ParamDef,
  TsTypeDef,
  TsTypeParamDef,
} from "@deno/doc";
import { toHtml } from "hast-util-to-html";
import { DocPage, type SymbolInfo } from "../../hooks/use-deno-doc.tsx";
import { Icon } from "./icon.tsx";

const NEW =
  `<span class="inline-block bg-violet-100 rounded px-2 text-sm text-violet-900 mx-1">new</span>`;
const OPTIONAL =
  `<span class="inline-block bg-sky-100 rounded px-2 text-sm text-sky-900 mx-1">optional</span>`;
const READONLY =
  `<span class="inline-block bg-orange-100 rounded px-2 text-sm text-orange-900 mx-1">readonly</span>`;

export const NO_DOCS_AVAILABLE = "*No documentation available.*";

export function* extract(
  node: Declaration,
  symbol: SymbolInfo,
): Operation<{ markdown: string; ignore: boolean; pages: DocPage[] }> {
  let lines = [];
  let pages: DocPage[] = [];

  let ignore = false;

  if (node.jsDoc && node.jsDoc.doc) {
    lines.push(node.jsDoc.doc);
  }

  let deprecated = node.jsDoc &&
    node.jsDoc.tags?.flatMap((tag) => (tag.kind === "deprecated" ? [tag] : []));
  if (deprecated && deprecated.length > 0) {
    lines.push(``);
    for (let warning of deprecated) {
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

  let examples = node.jsDoc &&
    node.jsDoc.tags?.flatMap((tag) => (tag.kind === "example" ? [tag] : []));
  if (examples && examples?.length > 0) {
    lines.push("### Examples");
    let i = 1;
    for (let example of examples) {
      lines.push(`#### Example ${i++}`, example.doc, "---");
    }
  }

  if (node.kind === "class") {
    let constructors = node.def.constructors ?? [];
    if (constructors.length > 0) {
      lines.push(`### Constructors`, "<dl>");
      for (let constructor of constructors) {
        lines.push(
          `<dt>${NEW} **${symbol.name}**(${
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

    let methods = node.def.methods ?? [];
    let nonStatic = methods.filter(
      (method) => !method.isStatic,
    );
    if (nonStatic.length > 0) {
      lines.push("### Methods", `<dl>`, ...methodList(nonStatic), "</dl>");
    }

    let staticMethods = methods.filter(
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
    // v2 namespace elements are member symbols; render each variable member,
    // passing the member's own symbol for its name/identity.
    let members = node.def.elements.flatMap((element) =>
      element.declarations
        .filter((declaration) => declaration.kind === "variable")
        .map((declaration) => ({ declaration, member: element }))
    );
    if (members.length > 0) {
      lines.push("### Variables");
      lines.push("<dl>");
      for (let { declaration, member } of members) {
        let name = `${symbol.name}.${member.name}`;
        let section = yield* extract(declaration, member);
        let description = declaration.jsDoc?.doc || NO_DOCS_AVAILABLE;
        pages.push({
          name,
          kind: declaration.kind,
          description,
          dependencies: [],
          sections: [
            {
              id: exportHash(declaration, member, 0),
              declaration,
              markdown: section.markdown,
              ignore: section.ignore,
            },
          ],
        });
        lines.push(
          `<dt>`,
          toHtml(<Icon kind={declaration.kind} />),
          `[${name}](${name})`,
          `</dt>`,
        );
        lines.push(`<dd class="italic">`, description, `</dd>`);
      }
      lines.push("</dl>");
    }
  }

  if (node.kind === "interface") {
    lines.push("\n", ...TypeParams(node.def.typeParams ?? [], node));

    let properties = node.def.properties ?? [];
    if (properties.length > 0) {
      lines.push("### Properties", "<dl>");
      for (let property of properties) {
        let typeDef = property.tsType ? TypeDef(property.tsType) : "";
        let description = property.jsDoc?.doc || NO_DOCS_AVAILABLE;
        lines.push(
          `<dt class="border-dotted dark:border-blue-900 [&:not(:first-child)]:border-t-1 [&:not(:first-child)]:pt-3 [&:not(:first-child)]:mt-2">**${property.name}**${
            property.readonly ? READONLY : ""
          }${property.optional ? OPTIONAL : ""}: ${typeDef}</dt>`,
          `<dd class="flex flex-col [&>pre]:mb-3">`,
          description,
          "</dd>",
        );
      }
      lines.push("</dl>");
    }

    let methods = node.def.methods ?? [];
    if (methods.length > 0) {
      lines.push("### Methods", "<dl>");
      for (let method of methods) {
        let typeParams = (method.typeParams ?? []).map(TypeParam).join(", ");
        let params = method.params.map(Param).join(", ");
        let returnType = method.returnType ? TypeDef(method.returnType) : "";
        let description = method.jsDoc?.doc || NO_DOCS_AVAILABLE;
        lines.push(
          `<dt class="border-dotted [&:not(:first-child)]:border-t-2 [&:not(:first-child)]:pt-3 [&:not(:first-child)]:mt-2"><h4 id="${method.name}" class="inline scroll-mt-[100px]">${method.name}</h4>${
            typeParams ? `&lt;${typeParams}&gt;` : ""
          }(${params}): ${returnType}</dt>`,
          `<dd class="flex flex-col [&>pre]:mb-3 [&>p:not(:first-child)]:mt-0" >`,
          description,
          "</dd>",
        );
      }
      lines.push("</dl>");
    }
  }

  if (node.kind === "typeAlias") {
    lines.push("\n", ...TypeParams(node.def.typeParams ?? [], node));
  }

  if (node.kind === "function") {
    lines.push(...TypeParams(node.def.typeParams ?? [], node));

    let { params } = node.def;
    if (params.length > 0) {
      lines.push("### Parameters");
      let jsDocs = node.jsDoc?.tags?.flatMap((tag) =>
        tag.kind === "param" ? [tag] : []
      ) ?? [];
      let i = 0;
      for (let param of params) {
        lines.push("\n", Param(param));
        if (jsDocs[i] && jsDocs[i].doc) {
          lines.push("\n", jsDocs[i].doc);
        }
        i++;
      }
    }

    if (node.def.returnType) {
      lines.push("### Return Type", "\n", TypeDef(node.def.returnType));
      let jsDocs = node.jsDoc?.tags?.find((tag) => tag.kind === "return");
      if (jsDocs && jsDocs.doc) {
        lines.push("\n", jsDocs.doc);
      }
    }
  }

  if (node.kind === "variable" && node.def.tsType) {
    lines.push("### Type", "\n", TypeDef(node.def.tsType));
  }

  let see: string[] = [];
  if (node.jsDoc && node.jsDoc.tags) {
    for (let tag of node.jsDoc.tags) {
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

  let markdown = lines.join("\n");

  return {
    markdown,
    ignore,
    pages,
  };
}

export function exportHash(
  declaration: Declaration,
  symbol: SymbolInfo,
  index: number,
): string {
  return [declaration.kind, symbol.name, index].filter(Boolean).join("_");
}

export function TypeParams(typeParams: TsTypeParamDef[], node: Declaration) {
  let lines = [];
  if (typeParams.length > 0) {
    lines.push("### Type Parameters");
    let jsDocs = node.jsDoc?.tags?.flatMap((tag) =>
      tag.kind === "template" ? [tag] : []
    ) ?? [];
    let i = 0;
    for (let typeParam of typeParams) {
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
      let params = typeDef.value.params.map(Param).join(", ");
      let tparams = (typeDef.value.typeParams ?? [])
        .map(TypeParam)
        .join(", ");
      return `${tparams.length > 0 ? `&lt;${tparams}&gt;` : ""}(${params}) => ${
        TypeDef(
          typeDef.value.tsType,
        )
      }`;
    }
    case "typeRef": {
      let tparams = typeDef.value.typeParams?.map(TypeDef).join(", ");
      return `{@link ${typeDef.value.typeName}}${
        tparams && tparams?.length > 0 ? `&lt;${tparams}&gt;` : ""
      }`;
    }
    case "keyword": {
      return typeDef.value;
    }
    case "union": {
      return typeDef.value.map(TypeDef).join(" | ");
    }
    case "array": {
      return `${TypeDef(typeDef.value)}&lbrack;&rbrack;`;
    }
    case "typeOperator": {
      return `${typeDef.value.operator} ${
        TypeDef(
          typeDef.value.tsType,
        )
      }`;
    }
    case "tuple": {
      return `&lbrack;${typeDef.value.map(TypeDef).join(", ")}&rbrack;`;
    }
    case "parenthesized": {
      return TypeDef(typeDef.value);
    }
    case "intersection": {
      return typeDef.value.map(TypeDef).join(" &amp; ");
    }
    case "typeLiteral": {
      // todo(taras): this is incomplete
      return `&#123;&#125;`;
    }
    case "mapped": {
      return `[${TypeParam(typeDef.value.typeParam)}]: ${
        typeDef.value.tsType ? TypeDef(typeDef.value.tsType) : ""
      }`;
    }
    case "conditional": {
      return `${TypeDef(typeDef.value.checkType)} extends ${
        TypeDef(
          typeDef.value.extendsType,
        )
      } ? ${
        TypeDef(
          typeDef.value.trueType,
        )
      } : ${TypeDef(typeDef.value.falseType)}`;
    }
    case "indexedAccess": {
      return `${TypeDef(typeDef.value.objType)}[${
        TypeDef(
          typeDef.value.indexType,
        )
      }]`;
    }
    case "literal": {
      return `*${typeDef.repr ?? ""}*`;
    }
    case "importType":
    case "infer":
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
      paramDef.constraint.value.operator === "keyof"
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
    case "array":
    case "object":
      console.log("Param: unimplemented", paramDef);
  }
  return "";
}

export function methodList(methods: ClassMethodDef[]) {
  let lines = [];
  for (let method of methods) {
    let typeParams = (method.def.typeParams ?? []).map(TypeParam).join(", ");
    let params = method.def.params.map(Param).join(", ");
    let returnType = method.def.returnType
      ? TypeDef(method.def.returnType)
      : "";
    let description = method.jsDoc?.doc || NO_DOCS_AVAILABLE;
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
