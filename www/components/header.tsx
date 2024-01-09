import { ProjectSelect } from "./project-select.tsx";
import { IconGithHub } from "./icons/github.tsx";
import { IconDiscord } from "./icons/discord.tsx";

export function Header() {
  return (
    <header class="header w-full top-0 p-6 tracking-wide z-10">
      <div class="flex items-center justify-between">
        <div>
          <a
            href="/"
            class="flex items-end gap-x-2 sm:gap-x-1 after:content-['v3'] after:inline after:relative after:top-0 after:text-sm"
          >
            <img
              src="/assets/images/effection-logo.svg"
              alt="Effection Logo"
              width={156}
              height={24}
            />
          </a>
        </div>
        <nav aria-label="Site Nav" class="text-sm">
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
                  <IconGithHub />
                </span>
                <span class="hidden md:inline-flex">
                  GitHub
                </span>
              </a>
            </li>
            <li>
              <a class="flex flex-row" href="https://discord.gg/r6AvtnU">
                <span class="pr-1 md:inline-flex">
                  <IconDiscord />
                </span>
                <span class="hidden md:inline-flex">
                  Discord
                </span>
              </a>
            </li>
            <li>
              <ProjectSelect />
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}