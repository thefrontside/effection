import type { Operation } from "effection";
import type { PackageDetails, PackageScore, Registry } from "./types.ts";

export const npm: Registry = {
  name: "npm",

  packageUrl(packageName: string): URL {
    return new URL(`./${packageName}`, "https://www.npmjs.com/package/");
  },

  versionBadgeUrl(packageName: string): URL {
    return new URL(`./${packageName}`, "https://img.shields.io/npm/v/");
  },

  configUrl(packageName: string): string {
    return `https://unpkg.com/${packageName}/package.json`;
  },

  *getPackageDetails(_packageName: string): Operation<PackageDetails | null> {
    // TODO: Implement npm API call
    // fetch from https://registry.npmjs.org/{packageName}
    return null;
  },

  *getPackageScore(_packageName: string): Operation<PackageScore | null> {
    // npm doesn't have a score API like JSR
    return null;
  },
};
