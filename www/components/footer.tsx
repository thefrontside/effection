import { IconExternal } from "./icons/external.tsx";

export function Footer(): JSX.Element {
  return (
    <footer class="grid grid-cols-3 py-2 text-center text-gray-500 tracking-wide bg-gray-100">
      <section class="col-span-3">
        <a class="text-gray-800" href="https://frontside.com">
          Created by Frontside <IconExternal />
        </a>
      </section>
      <p class="col-span-3 text-blue-primary text-xs">
        Copyright © 2019 - {new Date().getFullYear()}{" "}
        The Frontside Software, Inc.
      </p>
    </footer>
  );
}
