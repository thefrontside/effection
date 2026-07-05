// @ts-nocheck hastx does not typecheck raw <svg> children
import type { JSXElement } from "revolution/jsx-runtime";

interface Node {
  id: string;
  x: number;
  y: number;
  label: string;
}

const NODES: Node[] = [
  { id: "main", x: 300, y: 34, label: "entrypoint()" },
  { id: "server", x: 150, y: 138, label: "startServer()" },
  { id: "watch", x: 450, y: 138, label: "watchFiles()" },
  { id: "sock", x: 70, y: 246, label: "socket" },
  { id: "db", x: 230, y: 246, label: "db pool" },
  { id: "fs", x: 450, y: 246, label: "fs handle" },
];

const EDGES: [string, string][] = [
  ["main", "server"],
  ["main", "watch"],
  ["server", "sock"],
  ["server", "db"],
  ["watch", "fs"],
];

const NAVY = "#14315d";
const IDLE_EDGE = "#cbd5e1";
const byId = Object.fromEntries(NODES.map((n) => [n.id, n]));

/**
 * OperationTree — the interactive proof that halting forces control back and
 * teardown always runs. Rendered as static SVG server-side with stable
 * `data-*` hooks; `/assets/operation-tree.js` drives the halt↓ / teardown↑
 * cascade on click (no client framework).
 */
export function OperationTree(): JSXElement {
  return (
    <div id="operation-tree" class="mx-auto max-w-[620px]">
      <div class="rounded-lg border border-gray-200 bg-white px-2 pt-2 shadow-sm dark:border-gray-700">
        <svg
          viewBox="0 0 600 300"
          class="block h-auto w-full"
          font-family='"Fira Code", "Fira Mono", Menlo, Consolas, monospace'
        >
          <>
            {EDGES.map(([a, b]) => {
              let na = byId[a];
              let nb = byId[b];
              return (
                <line
                  data-edge
                  data-child={b}
                  x1={na.x}
                  y1={na.y + 16}
                  x2={nb.x}
                  y2={nb.y - 16}
                  stroke={IDLE_EDGE}
                  stroke-width={2}
                  style="transition: stroke .3s"
                />
              );
            })}
          </>
          <>
            {NODES.map((n) => {
              let w = Math.round(n.label.length * 8.2 + 34);
              return (
                <g
                  data-node={n.id}
                  style="transition: opacity .3s"
                >
                  <rect
                    data-rect
                    x={n.x - w / 2}
                    y={n.y - 16}
                    width={w}
                    height={32}
                    rx={6}
                    fill="#fff"
                    stroke={NAVY}
                    stroke-width={2}
                    style="transition: fill .3s, stroke .3s"
                  />
                  <text
                    data-label
                    x={n.x}
                    y={n.y + 5}
                    text-anchor="middle"
                    font-size={13.5}
                    fill={NAVY}
                    style="transition: fill .3s"
                  >
                    {n.label}
                  </text>
                  <text
                    data-done-label
                    x={n.x + w / 2 + 6}
                    y={n.y + 4}
                    font-size={11}
                    fill="#b45309"
                    opacity={0}
                  >
                    ✓ torn down
                  </text>
                </g>
              );
            })}
          </>
        </svg>
      </div>

      <div class="mt-3.5 flex items-center justify-center gap-5 text-xs text-gray-500 dark:text-gray-400">
        <span class="inline-flex items-center gap-2">
          <span class="h-2.5 w-2.5 rounded-[3px] border-2 border-[#16a34a] bg-[#f0fdf4]">
          </span>
          halt signal ↓
        </span>
        <span class="inline-flex items-center gap-2">
          <span class="h-2.5 w-2.5 rounded-[3px] border-2 border-[#b45309] bg-[#fffbeb]">
          </span>
          teardown ↑
        </span>
      </div>

      <div class="mt-4 flex items-center justify-center gap-3">
        <button
          id="operation-tree-halt"
          type="button"
          class="rounded font-mono text-[13px] font-semibold text-white bg-blue-900 px-4 py-2.5 transition-colors hover:bg-blue-800 disabled:cursor-default disabled:bg-gray-400"
        >
          entrypoint.halt()
        </button>
        <button
          id="operation-tree-reset"
          type="button"
          class="rounded border-2 border-[#14315D] font-mono text-[13px] font-semibold text-[#14315D] px-3.5 py-1.5 transition-colors hover:bg-blue-50 dark:border-[#26ABE8] dark:text-[#26ABE8]"
        >
          reset
        </button>
      </div>

      <p class="mt-3 text-center text-[13px] text-gray-500 dark:text-gray-400">
        The halt signal travels down the tree (green); teardown then completes
        bottom-up, rolling up each branch independently (amber) — a parent
        finishes only once all its children have, each <code>ensure</code>{" "}
        running as its operation exits.
      </p>
    </div>
  );
}
