import { useDocs } from "../lib/context.tsx";
import { Nav } from "./nav.tsx";
import { ProjectSelect } from "./project-select.tsx";

export function* useHeader() {
  const isDocs = yield* useDocs();

  return function Header() {
    return (
      <header class="header w-full top-0 p-6 py-8 sticky tracking-wide z-10">
        <div class="flex items-center justify-between max-w-screen-2xl mx-auto">
          <div class="flex">
            <a
              href="/"
              class="flex items-end gap-x-2 after:content-['v3'] after:inline after:relative after:top-0 after:text-sm"
            >
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
          <Nav isDocs={isDocs} />
        </div>
      </header>
    );
  };
}
