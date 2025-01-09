import { IconExternal } from "../../components/icons/external.tsx";
import { IconGithub } from "../../components/icons/github.tsx";

export function* GithubPill({
  url,
  text,
  ...props
}: {
  url: string;
  text: string;
  class?: string;
}) {
  return (
    <a
      href={url}
      class={`flex flex-row h-10 items-center rounded-full bg-gray-200 px-2 py-1 ${props.class ?? ""}`}
    >
      <IconGithub />
      <span class="px-1">{text}</span>
      <IconExternal />
    </a>
  );
}
