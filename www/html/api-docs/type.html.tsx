import type { Operation } from "effection";
import type { APIType } from "../../docs/api.ts";

export default function* APITypeHtml(type: APIType): Operation<JSX.Element> {
  let kind = type.declaration.kind === "typeAlias" ? "type" : "interface";

  console.dir({ type }, { depth: 20 });
  return <h1>{kind} {type.name}{typeParamsOf(type)}</h1>;
}

function typeParamsOf(type: APIType) {
  let { declaration } = type;
  let def = declaration.kind === "interface"
    ? declaration.interfaceDef
    : declaration.typeAliasDef;
  let params = def.typeParams;
  if (params.length === 0) {
    return "";
  } else {
    return `<${params.map((p) => p.name).join(", ")}>`;
  }
}
