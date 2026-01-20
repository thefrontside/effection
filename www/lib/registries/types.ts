import type { Operation } from "effection";
import type { z } from "zod";
import type {
  PackageDetailsResult,
  PackageScoreResult,
} from "../../resources/jsr-client.ts";

/**
 * Package details from a registry API (simplified).
 */
export interface PackageDetails {
  name: string;
  description?: string;
}

/**
 * Package score/quality metrics from a registry (simplified).
 */
export interface PackageScore {
  score?: number;
}

/**
 * JSR-specific result types that include Zod validation.
 */
export type JSRDetailsResult = z.SafeParseReturnType<unknown, PackageDetailsResult>;
export type JSRScoreResult = z.SafeParseReturnType<unknown, PackageScoreResult>;

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
