import { IconExternal } from "./icons/external.tsx";

export function Footer(): JSX.Element {
  return (
    <footer class="grid grid-cols-4 text-center text-gray-500 tracking-wide bg-gray-100 dark:bg-gray-900 dark:text-gray-400 py-8 gap-y-4 leading-8 justify-self-end px-5">
      <section class="flex flex-col gap-y-1">
        <h4 class="text-sm uppercase font-bold text-blue-primary dark:text-blue-secondary mb-4">
          About
        </h4>
        <a
          class="text-gray-800 dark:text-gray-200"
          href="https://frontside.com"
        >
          Maintained by Frontside <IconExternal />
        </a>
        <a
          class="text-gray-800 dark:text-gray-200"
          href="https://frontside.com/blog/2025-12-23-announcing-effection-v4/"
        >
          Effection v4 Release Post <IconExternal />
        </a>
      </section>
      <section class="flex flex-col gap-y-1">
        <h4 class="text-sm uppercase font-bold text-blue-primary dark:text-blue-secondary mb-4">
          OSS Projects
        </h4>
        <a
          href="https://frontside.com/interactors"
          class="text-gray-800 dark:text-gray-200"
        >
          Interactors <IconExternal />
        </a>
      </section>
      <section class="flex flex-col gap-y-1">
        <h4 class="text-sm uppercase font-bold text-blue-primary dark:text-blue-secondary mb-4">
          AI Agent Resources
        </h4>
        <a href="/llms.txt" class="text-gray-800 dark:text-gray-200">
          llms.txt
        </a>
        <a
          href="https://raw.githubusercontent.com/thefrontside/effection/v4/AGENTS.md"
          class="text-gray-800 dark:text-gray-200"
        >
          AGENTS.md
        </a>
      </section>
      <section class="flex flex-col gap-y-1">
        <h4 class="text-sm uppercase font-bold text-blue-primary dark:text-blue-secondary mb-4">
          Community
        </h4>
        <a
          href="https://discord.gg/r6AvtnU"
          class="text-gray-800 dark:text-gray-200"
        >
          Discord <IconExternal />
        </a>
        <a
          href="https://github.com/thefrontside/effection"
          class="text-gray-800 dark:text-gray-200"
        >
          GitHub <IconExternal />
        </a>
      </section>
      <p class="col-span-4 text-blue-primary dark:text-blue-secondary text-xs">
        Copyright © 2019 - {new Date().getFullYear()}{" "}
        The Frontside Software, Inc.
      </p>
    </footer>
  );
}
