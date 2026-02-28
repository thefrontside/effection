import { createContext, type Operation } from "effection";

export interface SeriesConfig {
  /** Series identifier used in URLs, e.g., "v4", "v4-next" */
  name: string;
  /** Major version number for semver matching */
  major: number;
  /** Include prerelease versions when finding latest tag */
  includePrerelease?: boolean;
  /** Parent series name for grouping (e.g., "v4-next" -> "v4") */
  parent?: string;
}

export interface SiteConfig {
  series: SeriesConfig[];
  current: string;
}

const ConfigContext = createContext<SiteConfig>("site-config", {
  series: [
    { name: "v3", major: 3 },
    { name: "v4", major: 4 },
    { name: "v4-next", major: 4, includePrerelease: true, parent: "v4" },
  ],
  current: "v4",
});

export function* initConfig(
  config: SiteConfig,
): Operation<void> {
  yield* ConfigContext.set(config);
}

export function* useConfig(): Operation<SiteConfig> {
  return yield* ConfigContext.expect();
}

/**
 * Find a series configuration by name
 */
export function findSeries(
  config: SiteConfig,
  name: string,
): SeriesConfig | undefined {
  return config.series.find((s) => s.name === name);
}

/**
 * Get series that are children of a parent series
 */
export function getChildSeries(
  config: SiteConfig,
  parentName: string,
): SeriesConfig[] {
  return config.series.filter((s) => s.parent === parentName);
}
