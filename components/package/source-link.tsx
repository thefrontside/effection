import { IconExternal } from "../../components/icons/external.tsx";
import { IconGithub } from "../../components/icons/github.tsx";

export function* PackageSourceLink({
  sourceUrl,
  repositoryName,
}: {
  sourceUrl: string;
  repositoryName: string;
}) {
  return (
    <a
      href={sourceUrl}
      class="[&>*]:inline-block rounded-full bg-gray-200 px-2 py-1"
    >
      <IconGithub />
      <span class="px-1">{repositoryName}</span>
      <IconExternal />
    </a>
  );
}
