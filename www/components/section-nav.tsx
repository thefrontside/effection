// @ts-nocheck hastx does not typecheck raw <svg> children
import type { JSXElement } from "revolution/jsx-runtime";

interface Item {
  href: string;
  label: string;
  icon: JSXElement;
}

const stroke = {
  fill: "none",
  stroke: "currentColor",
  "stroke-width": "1.8",
  "stroke-linecap": "round",
  "stroke-linejoin": "round",
};

const ITEMS: Item[] = [
  {
    href: "#problem",
    label: "Problem",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" {...stroke} />
        <line x1="12" y1="8" x2="12" y2="13" {...stroke} />
        <line x1="12" y1="16.5" x2="12" y2="16.5" {...stroke} />
      </svg>
    ),
  },
  {
    href: "#effection",
    label: "Effection",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3v18M3 12h18M6 6l12 12M18 6L6 18" {...stroke} />
      </svg>
    ),
  },
  {
    href: "#proof",
    label: "Proof",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="10.5" cy="10.5" r="6.5" {...stroke} />
        <line x1="15.5" y1="15.5" x2="20" y2="20" {...stroke} />
      </svg>
    ),
  },
  {
    href: "#adopt",
    label: "Adopt",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3v11M7.5 9.5L12 14l4.5-4.5" {...stroke} />
        <path d="M4 17v3h16v-3" {...stroke} />
      </svg>
    ),
  },
];

/**
 * SectionNav — a compact row of anchor links under the hero that jump to the
 * page's main sections, so readers can see the structure at a glance.
 */
export function SectionNav(): JSXElement {
  return (
    <nav class="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-semibold text-gray-500 dark:text-gray-400">
      {ITEMS.map((item) => (
        <a
          href={item.href}
          class="inline-flex items-center gap-1.5 no-underline transition-colors hover:text-[#26ABE8]"
        >
          {item.icon}
          {item.label}
        </a>
      ))}
    </nav>
  );
}
