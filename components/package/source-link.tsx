import { IconExternal } from "../../components/icons/external.tsx";
import { IconGithub } from "../../components/icons/github.tsx";
import { Package } from "../../resources/package.ts";

export function* PackageSourceLink({
  pkg,
  ...props
}: {
  pkg: Package
  class?: string;
}) {
  return (
    <a
      href={pkg.source.toString()}
      class={`flex flex-row h-10 items-center rounded-full bg-gray-200 px-2 py-1 ${props.class ?? ""}`}
    >
      <IconGithub />
      <span class="px-1">{pkg.ref.repository.nameWithOwner}</span>
      <IconExternal />
    </a>
  );
}
