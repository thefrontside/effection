import { call, type Operation } from "effection";
import { PackageConfig, readPackageConfig } from "./use-package.tsx";

export function* readPackages(
  { excludePrivate, base }: { excludePrivate: boolean; base: URL },
): Operation<PackageConfig[]> {
  const root = yield* call(async () => {
    try {
      const denoJson = await import("../../deno.json", {
        with: { type: "json" },
      });
      return denoJson;
    } catch (e) {
      console.error(e);
    }
  });

  console.log(`Found ${root?.default.workspace.join(", ")}`);

  const configs: PackageConfig[] = [];
  for (let workspace of root?.default?.workspace ?? []) {
    const config = yield* readPackageConfig(new URL(workspace, base));
    if (excludePrivate) {
      if (!config.denoJson.private) {
        configs.push(config);
      }
    } else {
      configs.push(config);
    }
  }

  return configs;
}
