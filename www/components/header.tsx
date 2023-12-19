import { ProjectSelect } from "./project-select.tsx";
import { IconGithub } from "./icons/github.tsx";
import { IconDiscord } from "./icons/discord.tsx";
import { Navburger } from "./navburger.tsx";

export function Header() {
  return (
    <header class="header w-full top-0 p-6 py-8 sticky tracking-wide z-10 rounded-lg max-w-screen-2xl m-auto">
      <div class="flex items-center justify-between">
        <div class="flex">
          <a
            href="/"
            class="flex items-end gap-x-2 after:content-['v3'] after:inline after:relative after:top-0 after:text-sm"
          >
            <img src="/assets/images/effection-logo.svg" alt="Effection Logo" width={156} height={24} />
          </a>
          <snap class="hidden sm:flex items-center">
            <ProjectSelect />
          </snap>
        </div>
        <nav aria-label="Site Nav" class="text-sm font-bold">
          <ul class="flex items-center sm:gap-1.5 gap-3 md:gap-16">
            <li>
              <a href="/docs/installation">Guides</a>
            </li>
            <li>
              <a href="https://deno.land/x/effection/mod.ts">API</a>
            </li>
            <li>
              <a class="flex flex-row" href="https://github.com/thefrontside/effection">
                <span class="pr-1 md:inline-flex">
                  <IconGithub />
                </span>
                <span class="hidden md:inline-flex">Github</span>
              </a>
            </li>
            <li>
              <a class="flex flex-row" href="https://discord.gg/r6AvtnU">
                <span class="pr-1 md:inline-flex">
                  <IconDiscord />
                </span>
                <span class="hidden md:inline-flex">Discord</span>
              </a>
            </li>
            <li class="sm:hidden shrink-0">
              <ProjectSelect />
            </li>
            <li>
              <p class="flex flex-row md:hidden">
                <label class="cursor-pointer" for="nav-toggle">
                  <Navburger />
                </label>
              </p>
              <style media="all">
                {`
            #nav-toggle:checked ~ aside#docbar {
              display: none;
            }
                `}
              </style>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
