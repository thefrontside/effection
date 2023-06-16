import type { APIType, DocNodeInterface, TsTypeDef } from "../../docs/api.ts";

type Declaration = APIType["declaration"];
type Params = DocNodeInterface["interfaceDef"]["typeParams"];

export function params2string(params: Params): string {
  if (params.length === 0) {
    return "";
  } else {
    return `<${params.map((p) => p.name).join(", ")}>`;
  }
}
export function type2string(decl: Declaration): string {
  if (decl.kind === "interface") {
    return `${decl.name}${params2string(decl.interfaceDef.typeParams)}`;
  } else {
    return `${decl.name}${params2string(decl.typeAliasDef.typeParams)}`;
  }
}
