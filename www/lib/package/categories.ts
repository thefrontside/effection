/**
 * A single category definition from the effectionx root package.json.
 */
export interface CategoryDefinition {
  keyword: string;
  label: string;
  description: string;
}

/**
 * Fallback taxonomy used when the cloned effectionx repo does not yet
 * contain an `effectionx.categories` field (e.g. during PR review
 * before the taxonomy PR is merged).
 */
export const DEFAULT_CATEGORIES: readonly CategoryDefinition[] = [
  {
    keyword: "testing",
    label: "Testing",
    description: "Test frameworks, adapters, and assertion helpers",
  },
  {
    keyword: "io",
    label: "I/O & Network",
    description: "HTTP, WebSocket, file system, and Node.js adapters",
  },
  {
    keyword: "process",
    label: "Processes",
    description: "Child process management and file watching",
  },
  {
    keyword: "streams",
    label: "Streams",
    description: "Stream transformation, parsing, and storage",
  },
  {
    keyword: "concurrency",
    label: "Concurrency",
    description: "Rate limiting, timeouts, and flow control",
  },
  {
    keyword: "reactivity",
    label: "Reactivity",
    description: "Reactive state and async workflows",
  },
  {
    keyword: "interop",
    label: "Interop",
    description: "Integration with other ecosystems and patterns",
  },
  {
    keyword: "platform",
    label: "Platform",
    description: "Browser and runtime-specific APIs",
  },
];

export interface PackageSummary {
  name: string;
  description: string;
  workspaceName: string;
  keywords: readonly string[];
}

export interface PackageCategoryGroup<
  T extends PackageSummary = PackageSummary,
> {
  keyword: string;
  label: string;
  description: string;
  packages: T[];
}

/**
 * Group packages by category based on their keywords.
 * Categories with no matching packages are omitted.
 */
export function groupPackagesByCategory<T extends PackageSummary>(
  categories: readonly CategoryDefinition[],
  packages: readonly T[],
): PackageCategoryGroup<T>[] {
  let categorizedPackages: PackageCategoryGroup<T>[] = [];

  for (let category of categories) {
    let categoryPackages = packages.filter((pkg) =>
      pkg.keywords.includes(category.keyword)
    );

    if (categoryPackages.length > 0) {
      categorizedPackages.push({ ...category, packages: categoryPackages });
    }
  }

  return categorizedPackages;
}
