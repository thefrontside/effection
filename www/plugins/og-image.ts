/**
 * Revolution plugin that generates OG (Open Graph) PNG images from SVG files.
 *
 * Intercepts requests to `/blog/.../image.png` and renders the corresponding
 * SVG to PNG with light mode forced and animations stripped.
 *
 * Uses Web Cache API for caching rendered PNGs.
 */
import { all, type Operation, until } from "effection";
import type { RevolutionPlugin } from "revolution";
import { initWasm, Resvg } from "@resvg/resvg-wasm";
import { join } from "@std/path";
import { serveFile } from "@std/http";
import { exists, readTextFile } from "@effectionx/fs";

export interface OgImageOptions {
  readonly basedir: string;
  readonly fontsDir: string;
}

type RendererEnv = Readonly<{
  fontBuffers: readonly Uint8Array[];
}>;

const WASM_URL = "https://unpkg.com/@resvg/resvg-wasm@2.6.2/index_bg.wasm";
const OG_WIDTH = 1200;
const FALLBACK_IMAGE = "/assets/images/meta-effection.png";

export function* ogImagePlugin(
  options: OgImageOptions,
): Operation<RevolutionPlugin> {
  let env = yield* initializeRenderer(options.fontsDir);
  let cache = yield* until(caches.open("og-images"));

  return {
    http(request, next) {
      let url = new URL(request.url);

      if (url.pathname.startsWith("/blog/") && url.pathname.endsWith(".png")) {
        return renderOgImage(request, url.pathname, options, env, cache);
      }

      return next(request);
    },
  };
}

function* initializeRenderer(fontsDir: string): Operation<RendererEnv> {
  console.log("📦 Initializing OG image renderer...");

  let response = yield* until(fetch(WASM_URL));
  if (!response.ok) {
    throw new Error(`Failed to fetch resvg WASM: ${response.status}`);
  }
  let wasmBuffer = yield* until(response.arrayBuffer());
  yield* until(initWasm(wasmBuffer));

  let [inter, jetbrains] = yield* all([
    until(Deno.readFile(join(fontsDir, "inter-variable.ttf"))),
    until(Deno.readFile(join(fontsDir, "jetbrains-mono-variable.ttf"))),
  ]);

  console.log("   ✓ WASM and fonts loaded");
  return { fontBuffers: [inter, jetbrains] };
}

function* renderOgImage(
  request: Request,
  pathname: string,
  options: OgImageOptions,
  env: RendererEnv,
  cache: Cache,
): Operation<Response> {
  // Check cache first
  let cached = yield* until(cache.match(request));
  if (cached) {
    return cached;
  }

  let svgPath = join(options.basedir, pathname.replace(/\.png$/, ".svg"));

  try {
    if (!(yield* exists(svgPath))) {
      return yield* serveFallback(request, options.basedir);
    }

    let svg = yield* readTextFile(svgPath);
    svg = transformSvg(svg);
    let png = renderSvgToPng(svg, env);

    let response = new Response(png, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=604800",
      },
    });

    yield* until(cache.put(request, response.clone()));
    return response;
  } catch (error) {
    console.error(`OG image generation failed for ${pathname}:`, error);
    return yield* serveFallback(request, options.basedir);
  }
}

function* serveFallback(
  request: Request,
  basedir: string,
): Operation<Response> {
  let fallbackPath = join(basedir, FALLBACK_IMAGE);
  return yield* until(serveFile(request, fallbackPath));
}

// ============= SVG Transformation Functions =============

type SvgTextClass =
  | "svg-title"
  | "svg-subtitle"
  | "svg-caption"
  | "svg-mono"
  | "svg-mono-sm"
  | "svg-label"
  | "svg-label-heading";

const LIGHT_FILL: Record<SvgTextClass, `#${string}`> = {
  "svg-title": "#0B2A5B",
  "svg-subtitle": "#33547b",
  "svg-caption": "#23435f",
  "svg-mono": "#1e3a8a",
  "svg-mono-sm": "#1e3a8a",
  "svg-label": "#33547b",
  "svg-label-heading": "#0b2a5b",
};

function transformSvg(svg: string): string {
  svg = replaceFontFamilies(svg);
  svg = fixCssFills(svg);
  svg = stripAnimations(svg);
  svg = forceLightMode(svg);
  return svg;
}

function replaceFontFamilies(svg: string): string {
  return svg
    .replace(/font-family:\s*ui-sans-serif[^;]+;/g, "font-family: 'Inter';")
    .replace(
      /font-family:\s*ui-monospace[^;]+;/g,
      "font-family: 'JetBrains Mono';",
    )
    .replace(
      /font-family:\s*'JetBrains Mono Variable'/g,
      "font-family: 'JetBrains Mono'",
    );
}

function fixCssFills(svg: string): string {
  return svg.replace(/fill:\s*url\(#ink\)\s*;/g, "fill: #0B2A5B;");
}

function stripAnimations(svg: string): string {
  svg = svg.replace(/@keyframes\s+[\w-]+\s*\{[^}]*(?:\{[^}]*\}[^}]*)*\}/g, "");
  svg = svg.replace(/animation:\s*[^;]+;/g, "");
  svg = svg.replace(/animation-[a-z-]+:\s*[^;]+;/g, "");

  let overrideCSS = `
    [class*="svg-anim-"] { opacity: 1 !important; }
    .svg-cursor { opacity: 0 !important; }
  `;
  return svg.replace(/<\/style>/i, `${overrideCSS}</style>`);
}

function forceLightMode(svg: string): string {
  let textOverrides = Object.entries(LIGHT_FILL)
    .map(([klass, color]) => `.${klass}{fill:${color} !important;}`)
    .join("");

  let visibilityOverrides = `
    .svg-bg-dark,.svg-shadow-dark,.svg-glow-dark{display:none !important;}
    .svg-bg-light,.svg-shadow-light,.svg-glow-light{display:block !important;}
  `;

  let overrideStyle =
    `<style data-build="force-light">${textOverrides}${visibilityOverrides}</style>`;

  let closeIdx = svg.lastIndexOf("</svg>");
  if (closeIdx < 0) {
    throw new Error("Invalid SVG: missing </svg>");
  }
  return svg.slice(0, closeIdx) + overrideStyle + svg.slice(closeIdx);
}

function renderSvgToPng(svg: string, env: RendererEnv): Uint8Array {
  let resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: OG_WIDTH },
    font: {
      fontBuffers: env.fontBuffers as Uint8Array[],
      defaultFontFamily: "Inter",
    },
  });
  return resvg.render().asPng();
}
