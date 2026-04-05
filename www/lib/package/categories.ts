/**
 * A single category definition from the effectionx root package.json.
 */
export interface CategoryDefinition {
  keyword: string;
  label: string;
  description: string;
}

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
