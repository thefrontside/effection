import { JSXElement } from "revolution/jsx-runtime";
import { type PackageScoreResult } from "../resources/jsr-client.ts";
import { Package } from "../resources/package.ts";
import {
  BrowserIcon,
  BunIcon,
  Check,
  CloudflareWorkersIcon,
  Cross,
  DenoIcon,
  IconProps,
  JSRIcon,
  NodeIcon,
  NPMIcon,
} from "./package/icons.tsx";

export function* ScoreCard(pkg: Package) {
  const [details, score] = yield* pkg.jsrPackageDetails();

  const jsrScore = (details.success && details.data && details.data.score) || 0;

  return (
    <div class="flex flex-col items-center space-y-5 w-full">
      <>
        <div class="flex flex-col md:flex-row gap-2 md:gap-8 items-between">
          <div class="flex flex-row md:flex-col items-center md:items-end gap-2 md:gap-1.5 text-sm font-bold">
            <div aria-hidden="true">Published on</div>
            <div class="flex space-x-2">
              <a href={`${pkg.jsr}`}>
                <JSRIcon class="h-6" />
              </a>
              <a href={`${pkg.npm}`}>
                <NPMIcon class="h-6" />
              </a>
            </div>
          </div>
          <div class="flex flex-row md:flex-col items-baseline md:items-end gap-2 md:gap-1.5 text-sm font-bold">
            <div>TypeScript</div>
            <span class="text-green-600 text-lg">Yes</span>
          </div>
        </div>
        <div class="flex flex-col md:flex-row gap-2 md:gap-8 items-between">
          <div class="flex flex-row md:flex-col items-center md:items-end gap-2 md:gap-1.5 text-sm font-bold">
            <div aria-hidden="true">Works with</div>
            <div class="min-w-content font-semibold select-none">
              <div class="flex items-center *:mx-0.5 flex-row-reverse">
                <SupportedEnvironment
                  name="Cloudflare Workers"
                  Icon={CloudflareWorkersIcon}
                  width={416}
                  height={375}
                  enabled={details.data?.runtimeCompat.workerd ?? false}
                />
                <SupportedEnvironment
                  name="Node.js"
                  Icon={NodeIcon}
                  width={256}
                  height={292}
                  enabled={details.data?.runtimeCompat.node ?? false}
                />
                <SupportedEnvironment
                  name="Deno"
                  Icon={DenoIcon}
                  width={512}
                  height={512}
                  enabled={details.data?.runtimeCompat.deno ?? false}
                />
                <SupportedEnvironment
                  name="Bun"
                  Icon={BunIcon}
                  width={435}
                  height={435}
                  enabled={details.data?.runtimeCompat.bun ?? false}
                />
                <SupportedEnvironment
                  name="Browser"
                  Icon={BrowserIcon}
                  width={1200}
                  height={500}
                  enabled={details.data?.runtimeCompat.browser ?? false}
                />
              </div>
            </div>
          </div>
          <a
            class="flex flex-row md:flex-col items-baseline md:items-end gap-2 md:gap-1.5 text-sm font-bold"
            href={`${new URL("./score/", pkg.jsr)}`}
          >
            <div>JSR Score</div>
            <div
              class={`!leading-none md:text-xl ${getScoreTextColorClass(
                jsrScore,
              )}`}
            >
              {jsrScore}%
            </div>
          </a>
        </div>
        {score.success && score.data ? (
          <ScoreDescription score={score.data} pkg={pkg} />
        ) : (
          <></>
        )}
      </>
    </div>
  );
}

interface SupportedEnvironmentProps {
  name: string;
  enabled: boolean;
  width: number;
  height: number;
  Icon: (props: IconProps) => JSXElement;
}

function SupportedEnvironment(props: SupportedEnvironmentProps) {
  return (
    <div
      class="relative h-4 md:h-5"
      style={`aspect-ratio: ${props.width} / ${props.height}`}
    >
      <props.Icon
        width={`${props.width}`}
        height={`${props.height}`}
        style="max-width: 100%"
        class={`h-4 md:h-5 ${
          props.enabled ? "" : "select-none filter grayscale opacity-40"
        }`}
      />
      {props.enabled ? (
        <></>
      ) : (
        <div
          aria-hidden="true"
          title={`It is unknown whether this package works with ${props.name}`}
          class="absolute inset-0 h-full w-full text-jsr-cyan-600 text-center leading-4 md:leading-5 drop-shadow-md font-bold text-md md:text-xl select-none"
        >
          ?
        </div>
      )}
    </div>
  );
}

function ScoreDescription({
  score,
  pkg,
}: {
  score: PackageScoreResult;
  pkg: Package;
}) {
  const {
    percentageDocumentedSymbols: _percentageDocumentedSymbols,
    total: _total,
    ...flags
  } = score;

  const SCORE_MAP = {
    hasReadme: "Has a readme or module doc",
    hasReadmeExamples: "Has examples in the readme or module doc",
    allEntrypointsDocs: "Has module docs in all entrypoints",
    allFastCheck: (
      <>
        No{" "}
        <a class="underline" href="https://jsr.io/docs/about-slow-types">
          slow types
        </a>{" "}
        are used
      </>
    ),
    hasProvenance: "Has provenance",
    hasDescription: (
      <>
        Has a{" "}
        <a
          class="underline"
          href={`${new URL("./settings#description", pkg.jsr)}`}
        >
          description
        </a>
      </>
    ),
    atLeastOneRuntimeCompatible: "At least one runtime is marked as compatible",
    multipleRuntimesCompatible:
      "At least two runtimes are marked as compatible",
  };

  return (
    <details>
      <summary class="text-gray-500 text-sm">
        The JSR score is a measure of the overall quality of a package, expand
        for more detail.
      </summary>
      <ul class="flex flex-col divide-y-1 w-full pt-5 px-2">
        <>
          {Object.entries(flags).map(([key, value]) => (
            <li class="grid grid-cols-[auto_1fr_auto] gap-x-3 py-3 first:pt-0 items-start">
              {value ? <Check /> : <Cross />}
              <span>{SCORE_MAP[key as keyof typeof flags]}</span>
            </li>
          ))}
        </>
      </ul>
    </details>
  );
}

/** @src https://github.com/jsr-io/jsr/blob/34603e996f56eb38e811619f8aebc6e5c4ad9fa7/frontend/utils/score_ring_color.ts */
export function getScoreTextColorClass(score: number): string {
  if (score >= 90) {
    return "text-green-600";
  } else if (score >= 60) {
    return "text-yellow-700";
  }
  return "text-red-500";
}
