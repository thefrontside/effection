// @ts-nocheck hastx's button `type` union omits "button"
import type { JSXElement } from "revolution/jsx-runtime";

export interface InstallCopyProps {
  command?: string;
}

/**
 * InstallCopy — a terminal-style install pill with a copy-to-clipboard button.
 * The button carries the command in `data-copy`; `/assets/home-islands.js`
 * wires the clipboard write and the "copied" feedback. Kept dark in both
 * themes since it reads as a terminal.
 */
export function InstallCopy(
  { command = "npm install effection" }: InstallCopyProps,
): JSXElement {
  return (
    <div class="inline-flex items-center gap-3.5 rounded-lg border border-white/10 bg-[#0f1b2d] px-4 py-3 pl-[18px] font-mono text-[15px]">
      <span class="select-none text-[#6b7c93]">$</span>
      <span class="text-[#e6edf6]">{command}</span>
      <button
        type="button"
        data-copy={command}
        aria-label="Copy install command"
        class="ml-1 inline-flex items-center gap-1.5 rounded border border-white/10 bg-white/[0.06] px-2.5 py-1 font-mono text-[12.5px] font-semibold text-[#8aa0b8] transition-colors data-[copied]:text-[#28c840]"
      >
        <span data-copy-label>copy</span>
      </button>
    </div>
  );
}
