import type { Operation } from "effection";
import { call } from "effection";
import { respondNotFound, useParams } from "revolution";
import { CurrentRequest } from "../context/request.ts";
import { useImageStore } from "../resources/image-store.ts";

export function blogImageRoute(): {
  handler(): Operation<Response>;
} {
  return {
    *handler() {
      let { id, name } = yield* useParams<{ id: string; name: string }>();
      let request = yield* CurrentRequest.expect();
      let url = new URL(request.url);

      let blogDir = new URL(`../blog/${id}/`, import.meta.url).pathname;
      let pngPath = `${blogDir}${name}.png`;

      // if a static .png exists, serve it directly
      try {
        let png = yield* call(() => Deno.readFile(pngPath));
        return pngResponse(png);
      } catch {
        // no static png, continue
      }

      let w = url.searchParams.get("w");
      let h = url.searchParams.get("h");

      // no static png and no dimensions: 404
      if (!w || !h) {
        return yield* respondNotFound();
      }

      let width = parseInt(w, 10);
      let height = parseInt(h, 10);

      if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
        return yield* respondNotFound();
      }

      let svgPath = `${blogDir}${name}.svg`;

      let svg: string;
      try {
        svg = yield* call(() => Deno.readTextFile(svgPath));
      } catch {
        return yield* respondNotFound();
      }

      let store = yield* useImageStore();

      svg = stripAnimations(svg);

      let key = `${id}/${name}/${width}x${height}`;
      let png = store.render(svg, width, key);

      return pngResponse(png);
    },
  };
}

function pngResponse(png: Uint8Array): Response {
  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

function stripAnimations(svg: string): string {
  return svg.replace(
    /\.svg-anim-\w+\s*\{[^}]*opacity:\s*0[^}]*\}/g,
    (match) =>
      match
        .replace(/opacity:\s*0/, "opacity: 1")
        .replace(/animation:[^;}]+;?/g, ""),
  );
}
