import type {
  DocNodeFunction,
  DocNodeInterface,
  DocNodeTypeAlias,
} from "https://deno.land/x/deno_doc@0.62.0/types.d.ts";

export type {
  DocNodeFunction,
  DocNodeInterface,
  TsTypeDef,
} from "https://deno.land/x/deno_doc@0.62.0/types.d.ts";

export interface APIDocs {
  getFunctions(): IterableIterator<APIFn>;
  getFunction(modname: string, name: string): APIFn | undefined;
  getTypes(): IterableIterator<APIType>;
  getType(modname: string, name: string): APIType | undefined;
}

export interface APIFn {
  name: string;
  modname: string;
  declarations: DocNodeFunction[];
}

export interface APIType {
  name: string;
  modname: string;
  declaration: DocNodeTypeAlias | DocNodeInterface;
}

import { doc } from "https://deno.land/x/deno_doc@0.62.0/mod.ts";
import { createContext, expect } from "../../mod.ts";

const APIDocs = createContext<APIDocs>("apidocs");

export function* loadAPIDocs() {
  let modurl = new URL("../../lib/mod.ts", import.meta.url).toString();

  let base = modurl.replace(/mod\.ts$/, "");

  let entries = yield* expect(
    doc(new URL("../../mod.ts", import.meta.url).toString()),
  );

  let modules = new Map<string, {
    functions: Map<string, APIFn>;
    types: Map<string, APIType>;
  }>();

  for (let entry of entries) {
    let { name } = entry;
    let modname = entry.location.filename
      .replace(base, "")
      .replace("/", "--");

    let mod = modules.get(modname);
    if (!mod) {
      mod = {
        functions: new Map<string, APIFn>(),
        types: new Map<string, APIType>(),
      };
      modules.set(modname, mod);
    }

    switch (entry.kind) {
      case "function":
        let fn = mod.functions.get(entry.name);
        if (!fn) {
          fn = {
            name,
            modname,
            declarations: [],
          };
          mod.functions.set(name, fn);
        }
        fn.declarations.push(entry);
        break;
      case "typeAlias":
      case "interface":
        mod.types.set(name, {
          name,
          modname,
          declaration: entry,
        });
      default:
        break;
    }
  }

  return yield* APIDocs.set({
    *getTypes() {
      for (let mod of modules.values()) {
        yield* mod.types.values();
      }
    },
    getType(modname, name) {
      return modules.get(modname)?.types.get(name);
    },
    *getFunctions() {
      for (let mod of modules.values()) {
        yield* mod.functions.values();
      }
    },
    getFunction(modname, name) {
      return modules.get(modname)?.functions.get(name);
    },
  });
}
