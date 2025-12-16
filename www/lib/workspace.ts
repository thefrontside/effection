import { Operation } from "effection";
import { useClone } from "./clones.ts";
import { Package, usePackage } from "./package.ts";

export interface Workspace {
  url: string;
  nameWithOwner: string;
  root: Package;
  packages: Package[];
}

export function* useWorkspace(nameWithOwner: string): Operation<Workspace> {
  let path = yield* useClone(nameWithOwner);
  let [name] = nameWithOwner.split("/");

  let url = `https://github.com/${nameWithOwner}`;

  let root = yield* usePackage({
    type: "clone",
    name,
    path,
    workspacePath: ".",
    ref: {
      name: "main",
      nameWithOwner,
      url: `${url}}/tree/main`,
    },
  });

  let packages: Package[] = [];

  for (let workspacePath of root.workspaces) {
    packages.push(
      yield* usePackage({
        type: "clone",
        path: `${path}/${workspacePath}`,
        workspacePath,
        ref: {
          name: "main",
          nameWithOwner,
          url: `${url}/tree/main/${workspacePath}`,
        },
      }),
    );
  }

  return {
    url,
    nameWithOwner,
    root,
    packages,
  };
}
