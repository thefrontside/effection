export type {
  PackageDetails,
  PackageScore,
  Registries,
  Registry,
} from "./types.ts";
export { jsr } from "./jsr.ts";
export { npm } from "./npm.ts";

import { jsr } from "./jsr.ts";
import { npm } from "./npm.ts";
import type { Registries } from "./types.ts";

export const registries: Registries = { jsr, npm };
