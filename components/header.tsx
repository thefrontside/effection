import { NavLinks } from "./nav-links.tsx";
import { ProjectSelect } from "./project-select.tsx";

export function* Header() {
  return (
    <header class="header w-full top-0 p-6 py-8 sticky tracking-wide z-10">
      <div class="flex items-center justify-between max-w-screen-2xl mx-auto">
        <div class="flex-none">
          <a href="/" class="flex items-end gap-x-2">
            <img
              src="/assets/images/effection-logo.svg"
              alt="Effection Logo"
              width={156}
              height={24}
            />
          </a>
          <span class="hidden sm:flex items-center">
            <ProjectSelect />
          </span>
        </div>
        <nav aria-label="Site Nav" class="grow text-sm font-bold">
          {yield* NavLinks()}
        </nav>
        <div id="search" class="flex-none [&>.DocSearch-Button]:bg-white"></div>
      </div>
    </header>
  );
}
