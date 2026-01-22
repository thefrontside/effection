import type { Operation } from "effection";
import type { PackageDetails, PackageScore, Registry } from "./types.ts";

export const jsr: Registry = {
  name: "JSR",

  packageUrl(packageName: string): URL {
    return new URL(`./${packageName}/`, "https://jsr.io/");
  },

  versionBadgeUrl(packageName: string): URL {
    return new URL(`./${packageName}`, "https://jsr.io/badges/");
  },

  configUrl(packageName: string): string {
    return `https://jsr.io/${packageName}/deno.json`;
  },

  *getPackageDetails(_packageName: string): Operation<PackageDetails | null> {
    // TODO: Implement JSR API call
    // const [, scope, name] = packageName.match(/@(.*)\/(.*)/) ?? [];
    // fetch from https://api.jsr.io/scopes/{scope}/packages/{name}
    return null;
  },

  *getPackageScore(_packageName: string): Operation<PackageScore | null> {
    // TODO: Implement JSR API call
    return null;
  },
};
