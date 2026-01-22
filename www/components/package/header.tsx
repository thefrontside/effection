import type { Package } from "../../lib/package/types.ts";
import { GithubPill } from "./source-link.tsx";

export function* PackageHeader(pkg: Package) {
  let name = yield* pkg.getName();
  let version = yield* pkg.getVersion();
  let scopeName = yield* pkg.getScopeName();
  let shortName = name.includes("/") ? name.split("/")[1] : name;

  return (
    <header class="space-y-3 mb-5">
      <div class="flex flex-col xl:flex-row">
        <span class="text-3xl">
          <span class="font-bold">
            {scopeName ? `@${scopeName}` : ""}
            {scopeName ? <span>/</span> : <></>}
            {shortName}
          </span>
          <span class="mx-2">v{version ? version : ""}</span>
        </span>
        {yield* GithubPill({
          class: "mt-2 xl:mt-0",
          url: pkg.ref.url,
          text: pkg.ref.nameWithOwner,
        })}
      </div>
      <div class="space-x-1">
        <a href={`${pkg.npm}`} class="inline-block align-middle">
          <img
            src={`${pkg.npmVersionBadge}`}
            alt="NPM Badge with published version"
          />
        </a>
      </div>
    </header>
  );
}
