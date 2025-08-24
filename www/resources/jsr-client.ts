import { call, type Operation, resource } from "effection";
import { z } from "npm:zod@3.23.8";

interface GetPackageDetailsParams {
  scope: string;
  package: string;
}

const PackageScore = z.object({
  hasReadme: z.boolean(),
  hasReadmeExamples: z.boolean(),
  allEntrypointsDocs: z.boolean(),
  allFastCheck: z.boolean(),
  hasProvenance: z.boolean(),
  hasDescription: z.boolean(),
  atLeastOneRuntimeCompatible: z.boolean(),
  multipleRuntimesCompatible: z.boolean(),
  percentageDocumentedSymbols: z.number().min(0).max(1),
  total: z.number(),
});

const PackageDetails = z.object({
  scope: z.string(),
  name: z.string(),
  description: z.string(),
  runtimeCompat: z.object({
    browser: z.boolean().optional(),
    deno: z.boolean().optional(),
    node: z.boolean().optional(),
    bun: z.boolean().optional(),
    workerd: z.boolean().optional(),
  }),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  githubRepository: z.object({
    id: z.number(),
    owner: z.string(),
    name: z.string(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }).nullable(),
  score: z.number().min(0).max(100).nullable(),
});

export type PackageScoreResult = z.infer<typeof PackageScore>;
export type PackageDetailsResult = z.infer<typeof PackageDetails>;

export interface JSRClient {
  getPackageScore: (
    params: GetPackageDetailsParams,
  ) => Operation<z.SafeParseReturnType<unknown, PackageScoreResult>>;
  getPackageDetails: (
    params: GetPackageDetailsParams,
  ) => Operation<z.SafeParseReturnType<unknown, PackageDetailsResult>>;
}

export function createJSRClient(token: string): Operation<JSRClient> {
  return resource<JSRClient>(function* (provide) {
    yield* provide({
      *getPackageScore(params) {
        const response = yield* call(() =>
          fetch(
            `https://api.jsr.io/scopes/${params.scope}/packages/${params.package}/score`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          )
        );

        if (response.ok) {
          const json = yield* call(() => response.json());
          return yield* call(() => PackageScore.safeParseAsync(json));
        }

        throw new Error(
          `Could not get package score for @${params.scope}/${params.package}`,
          {
            cause: `${response.status}: ${response.statusText}`,
          },
        );
      },
      *getPackageDetails(params) {
        const response = yield* call(() =>
          fetch(
            `https://api.jsr.io/scopes/${params.scope}/packages/${params.package}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          )
        );

        if (response.ok) {
          const json = yield* call(() => response.json());
          return yield* call(() => PackageDetails.safeParseAsync(json));
        }

        throw new Error(
          `Could not get package details for @${params.scope}/${params.package}`,
          {
            cause: `${response.status}: ${response.statusText}`,
          },
        );
      },
    });
  });
}
