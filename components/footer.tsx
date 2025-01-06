import { IconExternal } from "./icons/external.tsx";

export function Footer(): JSX.Element {
  return (
    <footer class="grid grid-cols-3 text-center text-gray-500 tracking-wide bg-gray-100 py-8 gap-y-4 leading-8 justify-self-end">
      <section class="flex flex-col gap-y-1">
        <h1 class="text-sm uppercase font-bold text-blue-primary mb-4">
          About
        </h1>
        <a class="text-gray-800" href="https://frontside.com">
          Maintained by Frontside <IconExternal />
        </a>
        <a
          class="text-gray-800"
          href="https://frontside.com/blog/2023-12-18-announcing-effection-v3/"
        >
          Effection v3 Release Post <IconExternal />
        </a>
      </section>
      <section class="flex flex-col gap-y-1">
        <h1 class="text-sm uppercase font-bold text-blue-primary mb-4">
          OSS Projects
        </h1>
        <a href="https://frontside.com/interactors" class="text-gray-800">
          Interactors <IconExternal />
        </a>
      </section>
      <section class="flex flex-col gap-y-1">
        <h1 class="text-sm uppercase font-bold text-blue-primary mb-4">
          Community
        </h1>
        <a href="https://discord.gg/r6AvtnU" class="text-gray-800">
          Discord <IconExternal />
        </a>
        <a
          href="https://github.com/thefrontside/effection"
          class="text-gray-800"
        >
          GitHub <IconExternal />
        </a>
      </section>
      <p class="col-span-3 text-blue-primary text-xs">
        Copyright © 2019 - {new Date().getFullYear()}{" "}
        The Frontside Software, Inc.
      </p>
    </footer>
  );
}
