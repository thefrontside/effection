import type { Operation } from "effection";
import { until } from "effection";
import z from "zod";
import { useClone } from "../clones.ts";
import type { CategoryDefinition } from "./categories.ts";

const CategorySchema = z.object({
  keyword: z.string(),
  label: z.string(),
  description: z.string(),
});

const CategoriesSchema = z.array(CategorySchema).min(1);

const RootPackageJsonSchema = z.object({
  effectionx: z.object({
    categories: CategoriesSchema,
  }),
});

/**
 * Load the package taxonomy from the effectionx root package.json.
 *
 * Reads `effectionx.categories` from the cloned repo's root package.json
 * and validates it with Zod. Throws if the field is absent or malformed.
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

  return root.effectionx.categories;
}
