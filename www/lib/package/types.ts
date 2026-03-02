import type { Operation } from "effection";
import type { Registries } from "../registries/types.ts";
import type { LocalDocsPages } from "../../hooks/use-deno-doc.tsx";

/**
 * Git ref information for linking to source on GitHub.
 */
export interface Ref {
  /** Ref name (e.g., "main", "v4.0.0") */
  name: string;

  /** GitHub owner/repo (e.g., "thefrontside/effectionx") */
  nameWithOwner: string;

  /** URL to this ref on GitHub (e.g., "https://github.com/.../tree/main/process") */
  url: string;
}

/**
 * Normalized package manifest.
 */
export interface PackageManifest {
  /** Package name (e.g., "@effectionx/process") */
  name?: string;

  /** Package version */
  version?: string;

  /** Package description from package.json */
  description?: string;

  /** Package keywords for categorization */
  keywords?: string[];
  /**
   * Normalized exports - always Record<string, string>.
   * For Node packages, uses the "development" condition.
   */
  exports: Record<string, string>;

  /** License identifier */
  license?: string;

  /**
   * Import map for dependency resolution.
   * For Deno: from `imports` field
   * For Node: merged dependencies + peerDependencies
   */
  imports: Record<string, string>;
}

/**
 * Represents a single package in a workspace.
 */
export interface Package {
  /** URL to the manifest file (deno.json or package.json) */
  manifestUrl: URL;

  /**
   * Local file path to the package directory.
   */
  path: string;

  /** Workspace directory name (e.g., "process") */
  workspaceName: string;

  /**
   * Workspace path relative to root (e.g., "packages/process").
   * For compatibility with old API.
   */
  workspacePath: string;

  /** Git ref for this package (for GitHub links) */
  ref: Ref;

  /** Get the parsed manifest */
  getManifest(): Operation<PackageManifest>;

  /** Get package name from manifest */
  getName(): Operation<string>;

  /** Get package version from manifest */
  getVersion(): Operation<string>;

  /** Get the scope name (e.g., "effectionx" from "@effectionx/process") */
  getScopeName(): Operation<string | undefined>;

  /** Get normalized exports map */
  getExports(): Operation<Record<string, string>>;

  /** Get imports for doc generation */
  getImports(): Operation<Record<string, string>>;

  /** Get entrypoints as URLs (from exports) */
  getEntrypoints(): Operation<Record<string, URL>>;

  /** Generate API documentation for all entrypoints */
  getDocs(): Operation<LocalDocsPages>;

  /** Read README.md content */
  getReadme(): Operation<string>;

  /** Parse README as MDX and return rendered content */
  getMDXContent(): Operation<JSX.Element>;

  /** Extract title from README */
  getTitle(): Operation<string>;

  /** Extract description from README */
  getDescription(): Operation<string>;

  /** Get keywords for categorization */
  getKeywords(): Operation<string[]>;

  /** Is this a Deno package (has deno.json) */
  deno: boolean;

  /** Is this a Node package (has package.json) */
  node: boolean;

  /** Available registries */
  registries: Registries;

  /** URL to npm package page */
  npm: URL;

  /** URL to npm version badge */
  npmVersionBadge: URL;
}
