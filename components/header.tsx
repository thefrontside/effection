import { css } from "npm:@twind/core@1.1.3";

import {
  ContribRepositoryContext,
  LibraryRepositoryContext,
} from "../context/repository.ts";
import { IconDiscord } from "./icons/discord.tsx";
import { IconGithub } from "./icons/github.tsx";
import { StarIcon } from "./icons/star.tsx";
import { Navburger } from "./navburger.tsx";
import { SearchInput } from "./search-input.tsx";

const colorful = css`
  background-image: linear-gradient(45deg, #f74d7b -20%, #8c7db3 95%);
  &:hover {
    background-image: linear-gradient(45deg, #8c7db3 -20%, #f74d7b 95%);
  }
`;

export interface HeaderProps {
  hasLeftSidebar?: boolean;
}

export function* Header(props?: HeaderProps) {
  let library = yield* LibraryRepositoryContext.expect();
  let contrib = yield* ContribRepositoryContext.expect();
  let contribMain = yield* contrib.loadRef();
  let workspaces = yield* contribMain.loadWorkspaces();

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
        </div>
        <nav aria-label="Site Nav" class="grow text-sm font-bold">
          <>
            <ul class="grid grid-flow-col auto-col-auto float-right place-items-end items-center gap-3 md:gap-7 lg:gap-12 md:ml-5">
              <li>
                <a href="/guides/v3">Guides</a>
              </li>
              <li>
                <a href="/api">API</a>
              </li>
              <li class="hidden md:flex">
                <a class="flex flex-row space-x-1" href="/x">
                  <span>Contrib</span>
                  <span>({workspaces.length})</span>
                </a>
              </li>
              <li class="hidden md:flex">
                <a
                  class={`flex flex-row ${colorful} p-1 rounded`}
                  href="https://github.com/thefrontside/effection"
                >
                  <span class="flex items-center">
                    <IconGithub />
                  </span>
                  <span class="flex flex-row items-center pl-1 text-white">
                    <StarIcon class="pr-0.5" />
                    <span>{yield* library.starCount()}</span>
                    <span class="font-black">+</span>
                  </span>
                </a>
              </li>
              <li class="hidden md:flex">
                <a
                  class="flex flex-row items-center space-x-1"
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
          </>
        </nav>
      </div>
    </header>
  );
}
