/**
 * Generate OG (Open Graph) images for blog posts.
 *
 * This script:
 * 1. Scans blog directories for SVG images referenced in frontmatter
 * 2. Strips CSS animations (for animated SVGs) to show final state
 * 3. Forces light mode for consistent social media previews
 * 4. Renders SVG → PNG at 1200×630 (standard OG dimensions)
 *
 * Uses Effection for structured concurrency with bounded parallelism.
 *
 * Run: deno task generate-og-images
 */

import { all, call, main, type Operation, until } from "effection";
import { exists } from "@std/fs";
import { join } from "@std/path";
import { parse as parseYaml } from "@std/yaml";
import { initWasm, Resvg } from "@resvg/resvg-wasm";

// =============================================================================
// Configuration
// =============================================================================

const BLOG_DIR = new URL("../blog/", import.meta.url).pathname;
const FONTS_DIR = new URL("./fonts/", import.meta.url).pathname;
const WASM_URL = "https://unpkg.com/@resvg/resvg-wasm@2.6.2/index_bg.wasm";
const OG_WIDTH = 1200;
const CONCURRENCY = 4;

// =============================================================================
// Types
// =============================================================================

/**
 * Immutable environment for rendering, initialized once in main().
 */
type RendererEnv = Readonly<{
  fontBuffers: readonly Uint8Array[];
}>;

/**
 * Frontmatter extracted from blog post markdown.
 */
interface Frontmatter {
  readonly title?: string;
  readonly image?: string;
}

/**
 * CSS text classes that need light mode fill overrides.
 */
const SVG_TEXT_CLASSES = [
  "svg-title",
  "svg-subtitle",
  "svg-caption",
  "svg-mono",
  "svg-mono-sm",
  "svg-label",
  "svg-label-heading",
] as const;

type SvgTextClass = (typeof SVG_TEXT_CLASSES)[number];
type HexColor = `#${string}`;

const LIGHT_FILL = {
  "svg-title": "#0B2A5B",
  "svg-subtitle": "#33547b",
  "svg-caption": "#23435f",
  "svg-mono": "#1e3a8a",
  "svg-mono-sm": "#1e3a8a",
  "svg-label": "#33547b",
  "svg-label-heading": "#0b2a5b",
} as const satisfies Record<SvgTextClass, HexColor>;

// =============================================================================
// Initialization
// =============================================================================

/**
 * Initialize the renderer by loading WASM and fonts.
 *
 * This is done once at startup and the environment is passed to workers.
 */
function* initializeRenderer(): Operation<RendererEnv> {
  console.log("📦 Initializing renderer...");

  // Fetch WASM from CDN
  let response = yield* until(fetch(WASM_URL));
  if (!response.ok) {
    throw new Error(
      `WASM fetch failed: ${response.status} ${response.statusText}`,
    );
  }
  let wasmBuffer = yield* until(response.arrayBuffer());

  // Initialize WASM (may be sync or async depending on build)
  yield* call(() => initWasm(wasmBuffer));

  // Load fonts concurrently
  let [inter, jetbrains] = yield* all([
    call(() => Deno.readFile(join(FONTS_DIR, "inter-variable.ttf"))),
    call(() => Deno.readFile(join(FONTS_DIR, "jetbrains-mono-variable.ttf"))),
  ]);

  console.log("   ✓ WASM and fonts loaded");

  return { fontBuffers: [inter, jetbrains] };
}

// =============================================================================
// SVG Transformations (pure sync functions)
// =============================================================================

/**
 * Replace system font stacks with our embedded font names.
 */
function replaceFontFamilies(svg: string): string {
  return svg
    .replace(/font-family:\s*ui-sans-serif[^;]+;/g, "font-family: 'Inter';")
    .replace(
      /font-family:\s*ui-monospace[^;]+;/g,
      "font-family: 'JetBrains Mono';",
    );
}

/**
 * Fix CSS fills that Resvg doesn't handle well.
 *
 * Resvg WASM doesn't properly apply `fill: url(#id)` from CSS rules.
 */
function fixCssFills(svg: string): string {
  return svg.replace(/fill:\s*url\(#ink\)\s*;/g, "fill: #0B2A5B;");
}

/**
 * Extract frontmatter from markdown content.
 */
function extractFrontmatter(content: string): Frontmatter {
  let match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  try {
    return parseYaml(match[1]) as Frontmatter;
  } catch {
    return {};
  }
}

/**
 * Strip CSS animations from SVG content.
 *
 * Removes @keyframes rules and animation properties,
 * then forces all animated elements to be visible.
 */
function stripAnimations(svg: string): string {
  // Remove @keyframes blocks
  svg = svg.replace(/@keyframes\s+[\w-]+\s*\{[^}]*(?:\{[^}]*\}[^}]*)*\}/g, "");

  // Remove animation properties from CSS
  svg = svg.replace(/animation:\s*[^;]+;/g, "");
  svg = svg.replace(/animation-[a-z-]+:\s*[^;]+;/g, "");

  // Inject overrides to force animated elements visible
  let overrideCSS = `
    /* OG Image: Force animated elements visible */
    [class*="svg-anim-"] { opacity: 1 !important; }
    .svg-cursor { opacity: 0 !important; }
  `;

  return svg.replace(/<\/style>/i, `${overrideCSS}</style>`);
}

/**
 * Force light mode in SVG using cascade override injection.
 *
 * Injects a final <style> block before </svg> that overrides dark mode styles.
 * CSS cascade rules mean the last declaration wins, and !important ensures
 * our light mode colors override any dark mode styles.
 */
function forceLightMode(svg: string): string {
  // Build CSS overrides for text fill colors
  let textOverrides = Object.entries(LIGHT_FILL)
    .map(([klass, color]) => `.${klass}{fill:${color} !important;}`)
    .join("");

  // Build CSS overrides for light/dark element visibility
  let visibilityOverrides = `
    .svg-bg-dark,.svg-shadow-dark,.svg-glow-dark{display:none !important;}
    .svg-bg-light,.svg-shadow-light,.svg-glow-light{display:block !important;}
  `.trim();

  let overrideStyle =
    `<style data-build="force-light">${textOverrides}${visibilityOverrides}</style>`;

  // Inject right before closing </svg> tag (last in cascade = wins)
  let closeIdx = svg.lastIndexOf("</svg>");
  if (closeIdx < 0) {
    throw new Error("Invalid SVG: missing </svg>");
  }

  return svg.slice(0, closeIdx) + overrideStyle + svg.slice(closeIdx);
}

/**
 * Apply all SVG transformations for OG image rendering.
 */
function transformSvg(svg: string): string {
  svg = replaceFontFamilies(svg);
  svg = fixCssFills(svg);
  svg = stripAnimations(svg);
  svg = forceLightMode(svg);
  return svg;
}

// =============================================================================
// Rendering
// =============================================================================

/**
 * Render SVG to PNG using Resvg.
 *
 * This is a sync function because WASM is already initialized.
 */
function renderSvgToPng(svg: string, env: RendererEnv): Uint8Array {
  let resvg = new Resvg(svg, {
    fitTo: {
      mode: "width",
      value: OG_WIDTH,
    },
    font: {
      fontBuffers: env.fontBuffers as Uint8Array[],
      defaultFontFamily: "Inter",
    },
  });

  return resvg.render().asPng();
}

// =============================================================================
// Blog Post Processing
// =============================================================================

/**
 * List all blog post directories.
 */
function* listBlogPostDirs(): Operation<string[]> {
  return yield* call(async () => {
    let dirs: string[] = [];
    for await (let entry of Deno.readDir(BLOG_DIR)) {
      if (entry.isDirectory && /^\d{4}-\d{2}-\d{2}-/.test(entry.name)) {
        dirs.push(join(BLOG_DIR, entry.name));
      }
    }
    // Sort for deterministic output order
    return dirs.sort();
  });
}

/**
 * Process a single blog post directory.
 *
 * Reads the index.md, checks for SVG image, transforms it, and renders to PNG.
 */
function* processBlogPost(
  postDir: string,
  env: RendererEnv,
): Operation<boolean> {
  let indexPath = join(postDir, "index.md");

  // Check if index.md exists
  let indexExists = yield* call(() => exists(indexPath));
  if (!indexExists) {
    return false;
  }

  // Read and parse frontmatter
  let content = yield* call(() => Deno.readTextFile(indexPath));
  let frontmatter = extractFrontmatter(content);

  // Check if there's an SVG image
  if (!frontmatter.image || !frontmatter.image.endsWith(".svg")) {
    return false;
  }

  let svgPath = join(postDir, frontmatter.image);
  let pngPath = svgPath.replace(/\.svg$/, ".png");

  // Check if SVG exists
  let svgExists = yield* call(() => exists(svgPath));
  if (!svgExists) {
    console.warn(`⚠ SVG not found: ${svgPath}`);
    return false;
  }

  console.log(`📸 Generating: ${pngPath}`);

  try {
    // Read SVG
    let svg = yield* call(() => Deno.readTextFile(svgPath));

    // Transform SVG (sync)
    svg = transformSvg(svg);

    // Render to PNG (sync after WASM init)
    let png = renderSvgToPng(svg, env);

    // Write PNG
    yield* call(() => Deno.writeFile(pngPath, png));

    console.log(`   ✓ Done (${(png.length / 1024).toFixed(1)} KB)`);
    return true;
  } catch (error) {
    console.error(`   ✗ Failed: ${error}`);
    return false;
  }
}

// =============================================================================
// Concurrency Helpers
// =============================================================================

/**
 * Process items in batches with bounded concurrency.
 *
 * This prevents CPU/memory spikes from unbounded parallelism.
 */
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

// =============================================================================
// Main Entry Point
// =============================================================================

await main(function* () {
  console.log("🖼  Generating OG images for blog posts...\n");

  // Check blog directory exists
  let blogExists = yield* call(() => exists(BLOG_DIR));
  if (!blogExists) {
    console.log("No blog directory found.");
    return;
  }

  // Initialize renderer (WASM + fonts) once
  let env = yield* initializeRenderer();

  // List blog post directories
  let postDirs = yield* listBlogPostDirs();

  if (postDirs.length === 0) {
    console.log("No blog posts found.");
    return;
  }

  // Process posts with bounded concurrency
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
