import { IconExtern } from "./icons/iconextern.tsx";

export function Footer(): JSX.Element {
  return (
    <footer class="grid grid-cols-3 text-center text-gray-500 tracking-wide bg-gray-100 pt-5 gap-y-4 leading-10">
      <section class="flex flex-col gap-y-1">
        <h1 class="text-sm uppercase font-bold text-blue-primary mb-4">
          About
        </h1>
        <a class="text-gray-800" href="https://frontside.com">
          Created by Frontside <IconExtern />
        </a>
      </section>
      <section class="flex flex-col gap-y-1">
        <h1 class="text-sm uppercase font-bold text-blue-primary mb-4">
          OSS Projects
        </h1>
        <a href="https://frontside.com/interactors" class="text-gray-800">
          Interactors <IconExtern />
        </a>
        <a href="/V2" class="text-gray-800">
          Effection<em class="align-super text-xs">v2</em> <IconExtern />
        </a>
      </section>
      <section class="flex flex-col gap-y-1">
        <h1 class="text-sm uppercase font-bold text-blue-primary mb-4">
          Community
        </h1>
        <a href="https://discord.gg/r6AvtnU" class="text-gray-800">
          Discord <IconExtern />
        </a>
        <a 
          href="https://github.com/thefrontside/effection"
          class="text-gray-800"
        >
          GitHub <IconExtern />
        </a>
      </section>
      <p class="col-span-3 text-blue-primary text-xs py-4">
        Copyright © 2019 - {new Date().getFullYear()}{" "}
        The Frontside Software, Inc.
      </p>
    </footer>
  );
}
