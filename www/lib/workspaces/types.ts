import type { Operation } from "effection";
import type { Package } from "../package/types.ts";

/**
 * A Workspaces instance provides access to all packages in a monorepo.
 */
export interface Workspaces {
  /** GitHub URL of the repository */
  url: string;

  /** GitHub owner/repo (e.g., "thefrontside/effectionx") */
  nameWithOwner: string;

  /** Workspace path patterns from config (e.g., ["packages/*"]) */
  workspacePatterns: string[];

  /**
   * Get a package by workspace directory name.
   * @example workspaces.getWorkspace("process") // returns Package for ./packages/process
   */
  getWorkspace(name: string): Operation<Package | undefined>;

  /**
   * Get a package by its npm/jsr package name.
   * @example workspaces.getPackage("@effectionx/process")
   */
  getPackage(name: string): Operation<Package | undefined>;

  /**
   * List all workspace directory names.
   */
  listWorkspaces(): Operation<string[]>;

  /**
   * List all package names.
   */
  listPackages(): Operation<string[]>;

  /**
   * Get all packages as an array.
   */
  getAllPackages(): Operation<Package[]>;
}

/**
 * Workspace configuration for different monorepo types.
 */
export interface WorkspaceConfig {
  /** Type of workspace (deno or node/pnpm) */
  type: "deno" | "node";

  /** Root path of the repository clone */
  rootPath: string;

  /** Git ref info for GitHub links */
  ref: {
    name: string;
    nameWithOwner: string;
  };

  /** Workspace patterns (e.g., ["packages/*"]) */
  patterns: string[];
}
