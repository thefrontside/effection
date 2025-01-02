import { PackageDetailsResult } from "../../resources/jsr-client.ts";

export function CircleScore({ details }: { details: PackageDetailsResult }) {
  return (
    <>
      <h3 class="text-2xl flex justify-center">
        <img src="/assets/images/jsr-logo.svg" alt="JSR Logo" class="mr-2" />
        Score
      </h3>
      <div
        class={`h-32 w-32 justify-center aspect-square rounded-full p-1.5 ${getScoreBgColorClass(
          details.score,
        )}`}
        style="background-image: conic-gradient(transparent, transparent 100%, #e7e8e8 100%)"
      >
        <span class="rounded-full w-full h-full bg-white flex justify-center items-center text-center text-3xl font-bold">
          {details.score}%
        </span>
      </div>
    </>
  );
}

/** @src https://github.com/jsr-io/jsr/blob/34603e996f56eb38e811619f8aebc6e5c4ad9fa7/frontend/utils/score_ring_color.ts */
export function getScoreBgColorClass(score: number): string {
  if (score >= 90) {
    return "bg-green-500";
  } else if (score >= 60) {
    return "bg-yellow-500";
  }
  return "bg-red-500";
}
