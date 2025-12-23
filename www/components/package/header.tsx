import { Package } from "../../lib/package.ts";
import { GithubPill } from "./source-link.tsx";

export function* PackageHeader(pkg: Package) {
  return (
    <header class="space-y-3 mb-5">
      <div class="flex flex-col xl:flex-row">
        <span class="text-3xl">
          <span class="font-bold">
            @{pkg.scopeName}
            <span>/</span>
            {pkg.name.split("/")[1]}
          </span>
          <span class="mx-2">v{pkg.version ? pkg.version : ""}</span>
        </span>
        {yield* GithubPill({
          class: "mt-2 xl:mt-0",
          url: pkg.ref.url,
          text: pkg.ref.nameWithOwner,
        })}
      </div>
      <div class="space-x-1">
        <a href={`${pkg.jsr}`} class="inline-block align-middle">
          <img src={`${pkg.jsrBadge}`} alt="JSR Badge" />
        </a>
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
