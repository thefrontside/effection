import type { Operation } from "effection";
import { until } from "effection";
import z from "zod";
import { useClone } from "../clones.ts";
import { DEFAULT_CATEGORIES, type CategoryDefinition } from "./categories.ts";

const CategorySchema = z.object({
  keyword: z.string(),
  label: z.string(),
  description: z.string(),
});

const CategoriesSchema = z.array(CategorySchema).min(1);

const RootPackageJsonSchema = z.object({
  effectionx: z
    .object({
      categories: CategoriesSchema,
    })
    .optional(),
});

/**
 * Load the package taxonomy from the effectionx root package.json.
 *
 * Three cases:
 * 1. `effectionx.categories` is present and valid → use it (success path)
 * 2. `effectionx` or `effectionx.categories` is absent → fall back to
 *    DEFAULT_CATEGORIES (compatibility path for pre-merge preview deploys)
 * 3. `effectionx.categories` exists but is malformed → throw (configuration
 *    error that must be fixed in effectionx, not silently masked)
 */
export function* useTaxonomy(
  nameWithOwner: string,
): Operation<CategoryDefinition[]> {
  let rootPath = yield* useClone(nameWithOwner);
  let content = yield* until(
    Deno.readTextFile(`${rootPath}/package.json`),
  );
  let json = JSON.parse(content);
  let root = RootPackageJsonSchema.parse(json);

  if (!root.effectionx) {
    return [...DEFAULT_CATEGORIES];
  }

  return root.effectionx.categories;
}
