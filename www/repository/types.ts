import { type Operation } from "effection";

/**
 * Pattern to match Git refs in format heads/<name> or tags/<name>
 * Optionally prefixed with refs/
 */
export const REF_PATTERN = /^(\/?refs\/)?(heads|tags)\/(.*)$/;

/**
 * Interface for objects that can provide file content
 */
export interface ContentProvider {
  /**
   * Get contents of a file at the specified path
   * @param path - Path to the file
   */
  getContent(path: string): Operation<string>;
}

/**
 * Parameters for useRepository operation
 */
export interface UseRepositoryParams {
  owner: string;
  name: string;
}

/**
 * Parameters for useRef operation
 */
export interface UseRefParams {
  repository: Repository;
  ref: string;
}

/**
 * Interface for repository operations
 */
export interface Repositories {
  useRepository({ owner, name }: UseRepositoryParams): Operation<Repository>;
  useRef({ repository, ref }: UseRefParams): Operation<RepositoryRef>;
}

/**
 * Core repository interface
 */
export interface Repository {
  name: string;
  owner: string;
  nameWithOwner: string;

  getDefaultBranch(): Operation<string>;
  getStarCount(): Operation<number>;

  /**
   * Retrieve tags for the current repository.
   *
   * Optionally, filter tags using a glob. It should accept the same argument as we use to trigger a push event.
   *
   * For example:
   *  - v*
   *  - v3*
   *  - effection-v3*
   *
   * Should are valid glob patterns
   *
   * @returns tag objects
   */
  tags(ref?: string): Operation<{ name: string }[]>;

  /**
   * Get contents of a repository on main branch.
   * To read content on other branches, use loadRef to create
   * a RepositoryRef instance with it's own getContent method.
   */
  getContent(path: string): Operation<string>;

  loadRef(ref?: string): Operation<RepositoryRef>;
}

/**
 * Branch reference type
 */
export interface BranchRef {
  name: string;
  ref: string;
  type: "branch";
}

/**
 * Tag reference type
 */
export interface TagRef {
  name: string;
  ref: string;
  type: "tag";
}

/**
 * Union type for Git references
 */
export type GitRef = BranchRef | TagRef;

/**
 * Repository reference interface - represents a specific branch or tag
 */
export interface RepositoryRef extends ContentProvider {
  repository: Repository;

  /**
   * Name of the ref without heads/ or tags/ prefix
   */
  name: string;

  type: "branch" | "tag";

  /**
   * Ref in format heads/<name> for a branch and tags/<name> for a tag
   */
  ref: string;

  /**
   * Github web app url
   */
  url: string;

  /**
   * Get contents of a file at the specified path
   * @param path - Path to the file
   */
  getContent(path: string): Operation<string>;

  /**
   * Return complete URL of a file or a directory in GitHub
   * @param base - Base path
   * @param target - Target path
   * @param isFile - Whether the target is a file (blob) or directory (tree)
   */
  getUrl(base?: string, target?: string, isFile?: boolean): URL;
}