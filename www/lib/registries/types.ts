import type { Operation } from "effection";

/**
 * Package details from a registry API.
 */
export interface PackageDetails {
  name: string;
  description?: string;
}

/**
 * Package score/quality metrics from a registry.
 */
export interface PackageScore {
  score?: number;
}

/**
 * Interface for a package registry (JSR, npm, etc.)
 */
export interface Registry {
  /** Registry name for display */
  name: string;

  /** Get the URL to the package page on the registry */
  packageUrl(packageName: string): URL;

  /** Get the URL for the version badge */
  versionBadgeUrl(packageName: string): URL;

  /** URL to the config file for a package (for fetching imports) */
  configUrl(packageName: string): string;

  /** Fetch package details from registry API */
  getPackageDetails(packageName: string): Operation<PackageDetails | null>;

  /** Fetch package score/quality metrics */
  getPackageScore(packageName: string): Operation<PackageScore | null>;
}

/**
 * Available registries.
 */
export interface Registries {
  jsr: Registry;
  npm: Registry;
}
