/**
 * Generate OG (Open Graph) PNG images from SVG blog post featured images.
 *
 * Run: deno task generate-og-images
 */

import { all, call, main, type Operation, until } from "effection";
import { exists } from "@std/fs";
import { join } from "@std/path";
import { parse as parseYaml } from "@std/yaml";
import { initWasm, Resvg } from "@resvg/resvg-wasm";

const BLOG_DIR = new URL("../blog/", import.meta.url).pathname;
const FONTS_DIR = new URL("./fonts/", import.meta.url).pathname;
const WASM_URL = "https://unpkg.com/@resvg/resvg-wasm@2.6.2/index_bg.wasm";
const OG_WIDTH = 1200;
const CONCURRENCY = 4;

type RendererEnv = Readonly<{
  fontBuffers: readonly Uint8Array[];
}>;

interface Frontmatter {
  readonly title?: string;
  readonly image?: string;
}

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

function* initializeRenderer(): Operation<RendererEnv> {
  console.log("📦 Initializing renderer...");

  let response = yield* until(fetch(WASM_URL));
  if (!response.ok) {
    throw new Error(
      `WASM fetch failed: ${response.status} ${response.statusText}`,
    );
  }
  let wasmBuffer = yield* until(response.arrayBuffer());
  yield* call(() => initWasm(wasmBuffer));

  let [inter, jetbrains] = yield* all([
    call(() => Deno.readFile(join(FONTS_DIR, "inter-variable.ttf"))),
    call(() => Deno.readFile(join(FONTS_DIR, "jetbrains-mono-variable.ttf"))),
  ]);

  console.log("   ✓ WASM and fonts loaded");
  return { fontBuffers: [inter, jetbrains] };
}

function replaceFontFamilies(svg: string): string {
  return svg
    .replace(/font-family:\s*ui-sans-serif[^;]+;/g, "font-family: 'Inter';")
    .replace(
      /font-family:\s*ui-monospace[^;]+;/g,
      "font-family: 'JetBrains Mono';",
    );
}

function fixCssFills(svg: string): string {
  return svg.replace(/fill:\s*url\(#ink\)\s*;/g, "fill: #0B2A5B;");
}

function extractFrontmatter(content: string): Frontmatter {
  let match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  try {
    return parseYaml(match[1]) as Frontmatter;
  } catch {
    return {};
  }
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
  `.trim();

  let overrideStyle =
    `<style data-build="force-light">${textOverrides}${visibilityOverrides}</style>`;

  let closeIdx = svg.lastIndexOf("</svg>");
  if (closeIdx < 0) {
    throw new Error("Invalid SVG: missing </svg>");
  }
  return svg.slice(0, closeIdx) + overrideStyle + svg.slice(closeIdx);
}

function transformSvg(svg: string): string {
  svg = replaceFontFamilies(svg);
  svg = fixCssFills(svg);
  svg = stripAnimations(svg);
  svg = forceLightMode(svg);
  return svg;
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

function* listBlogPostDirs(): Operation<string[]> {
  return yield* call(async () => {
    let dirs: string[] = [];
    for await (let entry of Deno.readDir(BLOG_DIR)) {
      if (entry.isDirectory && /^\d{4}-\d{2}-\d{2}-/.test(entry.name)) {
        dirs.push(join(BLOG_DIR, entry.name));
      }
    }
    return dirs.sort();
  });
}

function* processBlogPost(
  postDir: string,
  env: RendererEnv,
): Operation<boolean> {
  let indexPath = join(postDir, "index.md");

  let indexExists = yield* call(() => exists(indexPath));
  if (!indexExists) return false;

  let content = yield* call(() => Deno.readTextFile(indexPath));
  let frontmatter = extractFrontmatter(content);

  if (!frontmatter.image || !frontmatter.image.endsWith(".svg")) {
    return false;
  }

  let svgPath = join(postDir, frontmatter.image);
  let pngPath = svgPath.replace(/\.svg$/, ".png");

  let svgExists = yield* call(() => exists(svgPath));
  if (!svgExists) {
    console.warn(`⚠ SVG not found: ${svgPath}`);
    return false;
  }

  console.log(`📸 Generating: ${pngPath}`);

  try {
    let svg = yield* call(() => Deno.readTextFile(svgPath));
    svg = transformSvg(svg);
    let png = renderSvgToPng(svg, env);
    yield* call(() => Deno.writeFile(pngPath, png));
    console.log(`   ✓ Done (${(png.length / 1024).toFixed(1)} KB)`);
    return true;
  } catch (error) {
    console.error(`   ✗ Failed: ${error}`);
    return false;
  }
}

function* processInBatches<T, R>(
  items: readonly T[],
  batchSize: number,
  worker: (item: T) => Operation<R>,
): Operation<R[]> {
  let results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    let batch = items.slice(i, i + batchSize);
    let batchResults = yield* all(batch.map(worker));
    results.push(...batchResults);
  }
  return results;
}

await main(function* () {
  console.log("🖼  Generating OG images for blog posts...\n");

  let blogExists = yield* call(() => exists(BLOG_DIR));
  if (!blogExists) {
    console.log("No blog directory found.");
    return;
  }

  let env = yield* initializeRenderer();
  let postDirs = yield* listBlogPostDirs();

  if (postDirs.length === 0) {
    console.log("No blog posts found.");
    return;
  }

  let results = yield* processInBatches(
    postDirs,
    CONCURRENCY,
    (dir) => processBlogPost(dir, env),
  );

  let generated = results.filter(Boolean).length;
  console.log(
    `\n✅ Processed ${postDirs.length} blog posts, generated ${generated} images.`,
  );
});
