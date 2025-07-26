import {
  LibraryRepositoryContext,
  XRepositoryContext,
} from "../context/repository.ts";
import { IconDiscord } from "./icons/discord.tsx";
import { IconGithub } from "./icons/github.tsx";
import { StarIcon } from "./icons/star.tsx";
import { Navburger } from "./navburger.tsx";
import { SearchInput } from "./search-input.tsx";

export interface HeaderProps {
  hasLeftSidebar?: boolean;
}

export function* Header(props?: HeaderProps) {
  let library = yield* LibraryRepositoryContext.expect();
  let x = yield* XRepositoryContext.expect();
  let xMain = yield* x.loadRef();
  let workspaces = yield* xMain.loadWorkspaces();

  return (
    <header class="sticky top-0 w-full z-10 tracking-wide text-white [background-image:linear-gradient(45deg,#14315d_-5%,#44378a,#26abe8_105%)] dark:bg-gray-900 dark:text-gray-200">
      <div class="flex items-center justify-between max-w-screen-2xl mx-auto px-6 py-4">
        <div class="flex-none">
          <a href="/" class="flex items-end gap-x-2">
            <img
              src="/assets/images/effection-logo.svg"
              alt="Effection Logo"
              width={156}
              height={24}
              class="drop-shadow"
            />
          </a>
        </div>
        <nav aria-label="Site Nav" class="flex-1">
          <ul class="flex items-center justify-end gap-4 md:gap-7 lg:gap-12">
            <li>
              <a
                class="hover:text-pink-secondary dark:hover:text-blue-secondary transition-colors duration-200"
                href="/guides/v3"
              >
                Guides
              </a>
            </li>
            <li>
              <a
                class="hover:text-pink-secondary dark:hover:text-blue-secondary transition-colors duration-200"
                href="/api"
              >
                API
              </a>
            </li>
            <li class="hidden md:flex">
              <a
                class="flex flex-row space-x-1 hover:text-pink-secondary dark:hover:text-blue-secondary transition-colors duration-200"
                href="/x"
              >
                <span>Ext</span>
                <span>({workspaces.length})</span>
              </a>
            </li>
            <li class="hidden md:flex">
              <a
                class="flex flex-row items-center p-1 rounded bg-gradient-to-r from-pink-secondary via-purple-400 to-blue-secondary hover:from-blue-secondary hover:to-pink-secondary dark:from-gray-800 dark:via-gray-700 dark:to-gray-900 text-white shadow-md"
                href="https://github.com/thefrontside/effection"
              >
                <span class="flex items-center">
                  <IconGithub />
                </span>
                <span class="flex flex-row items-center pl-1">
                  <StarIcon class="pr-0.5" />
                  <span>{yield* library.starCount()}</span>
                  <span class="font-black">+</span>
                </span>
              </a>
            </li>
            <li class="hidden md:flex">
              <a
                class="flex flex-row items-center space-x-1 hover:text-pink-secondary dark:hover:text-blue-secondary transition-colors duration-200"
                href="https://discord.gg/r6AvtnU"
              >
                <IconDiscord />
                <span>Discord</span>
              </a>
            </li>
            {props?.hasLeftSidebar
              ? (
                <li class="flex flex-row md:hidden">
                  <label class="cursor-pointer" for="nav-toggle">
                    <Navburger />
                  </label>
                </li>
              )
              : <></>}
            <li class="hidden md:flex">
              <SearchInput />
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
