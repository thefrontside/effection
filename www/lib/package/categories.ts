export const PACKAGE_CATEGORIES = [
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
] as const;

export interface PackageSummary {
  name: string;
  description: string;
  workspaceName: string;
  keywords: readonly string[];
}

export interface PackageCategoryGroup<
  T extends PackageSummary = PackageSummary,
> {
  keyword: (typeof PACKAGE_CATEGORIES)[number]["keyword"];
  label: (typeof PACKAGE_CATEGORIES)[number]["label"];
  description: (typeof PACKAGE_CATEGORIES)[number]["description"];
  packages: T[];
}

export function groupPackagesByCategory<T extends PackageSummary>(
  packages: readonly T[],
): PackageCategoryGroup<T>[] {
  let categorizedPackages: PackageCategoryGroup<T>[] = [];

  for (let category of PACKAGE_CATEGORIES) {
    let categoryPackages = packages.filter((pkg) =>
      pkg.keywords.includes(category.keyword)
    );

    if (categoryPackages.length > 0) {
      categorizedPackages.push({ ...category, packages: categoryPackages });
    }
  }

  return categorizedPackages;
}
