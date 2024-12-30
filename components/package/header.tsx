import { Package } from "../../resources/package.ts";
import { PackageSourceLink } from "./source-link.tsx";

export function* PackageHeader(pkg: Package) {
  return (
    <header class="space-y-3 mb-5">
      <div class="[&>*]:inline-block">
        <span class="text-3xl font-bold align-middle">
          @{pkg.scope}
          <span>/</span>
          {pkg.name}
        </span>
        <span class="text-3xl mx-2 align-middle">
          v{pkg.version ? pkg.version : ""}
        </span>
        {yield* PackageSourceLink()()}
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
        <a href={`${pkg.bundlephobia}`} class="inline-block align-middle">
          <img src={`${pkg.bundleSizeBadge}`} alt="Bundle size badge" />
        </a>
        <a href={`${pkg.bundlephobia}`} class="inline-block align-middle">
          <img
            src={`${pkg.dependencyCountBadge}`}
            class="inline-block"
            alt="Dependency count badge"
          />
        </a>
        <a href={`${pkg.bundlephobia}`} class="inline-block align-middle">
          <img
            src={`${pkg.treeShakingSupportBadge}`}
            class="inline-block"
            alt="Tree shaking support badge"
          />
        </a>
      </div>
    </header>
  );
}
