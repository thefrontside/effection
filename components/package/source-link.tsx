import { IconExternal } from "effection-www/components/icons/external.tsx";
import { IconGithub } from "effection-www/components/icons/github.tsx";

import { usePackage } from "../../hooks/use-package.tsx";
import { useRepository } from "../../hooks/use-repository.ts";

export function PackageSourceLink() {
  return function* () {
    const pkg = yield* usePackage();
    const repository = yield* useRepository();

    return (
      <a
        href={pkg.source.toString()}
        class="[&>*]:inline-block rounded-full bg-gray-200 px-2 py-1"
      >
        <IconGithub />
        <span class="px-1">{repository.name}</span>
        <IconExternal />
      </a>
    );
  };
}
