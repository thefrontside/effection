import z from "zod";
import { Operation, until } from "effection";

export const DenoJsonSchema = z.object({
  name: z.string().optional(),
  version: z.string().optional(),
  exports: z.union([z.record(z.string()), z.string()]).optional(),
  license: z.string().optional(),
  workspace: z.array(z.string()).optional(),
  imports: z.record(z.string()).optional(),
});

export type DenoJson = z.infer<typeof DenoJsonSchema>;

export function* useDenoJson(path: string): Operation<DenoJson> {
  let { default: json } = yield* until(
    import(path, { with: { type: "json" } }),
  );

  return DenoJsonSchema.parse(json);
}
