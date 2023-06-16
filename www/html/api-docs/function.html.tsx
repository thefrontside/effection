import type { Operation } from "effection";
import type { APIFn, DocNodeFunction } from "../../docs/api.ts";
import { type2string } from "./type2string.ts";

export default function* (fn: APIFn): Operation<JSX.Element> {
  console.dir({ fn }, { depth: 20 });

  return (
    <section>
      {fn.declarations.map((variant) => <Fn fn={variant} />)}
    </section>
  );
}

function Fn({ fn }: { fn: DocNodeFunction }): JSX.Element {
  return <h1>function {fn.name}{typeParamsOf(fn)}(): {returnTypeOf(fn)}</h1>;
}

function typeParamsOf(fn: DocNodeFunction): string {
  let params = fn.functionDef.typeParams;
  if (params.length === 0) {
    return "";
  } else {
    return `<${params.map((p) => p.name).join(", ")}>`;
  }
}

function returnTypeOf(fn: DocNodeFunction): string {
  let returnType = fn.functionDef.returnType;
  if (!returnType) {
    return "unknown";
  } else {
    return "thingus";
  }
}
