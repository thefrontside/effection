import {
  ContribRepositoryContext,
  LibraryRepositoryContext,
} from "../context/repository.ts";
import { IconDiscord } from "./icons/discord.tsx";
import { IconGithub } from "./icons/github.tsx";
import { StarIcon } from "./icons/star.tsx";
import { Navburger } from "./navburger.tsx";
import { ProjectSelect } from "./project-select.tsx";

export function* NavLinks() {
  let library = yield* LibraryRepositoryContext.expect();
  let contrib = yield* ContribRepositoryContext.expect();
  let contribMain = yield* contrib.loadRef();
  let workspaces = yield* contribMain.loadWorkspaces();

  return (
    <ul class="grid grid-flow-col auto-col-auto float-right place-items-end items-center gap-3 md:gap-7 lg:gap-12 md:ml-5">
      <li>
        <a href="/docs/installation">Guides</a>
      </li>
      <li>
        <a href="/api">API</a>
      </li>
      <li class="hidden md:flex">
        <a class="flex flex-row space-x-1" href="/contrib">
          <span>Contrib</span>
          <span>({workspaces.length})</span>
        </a>
      </li>
      <li class="hidden md:flex">
        <a
          class="flex flex-row"
          href="https://github.com/thefrontside/effection"
        >
          <span class="pr-1">
            <IconGithub />
          </span>
          <span>GitHub</span>
          <span class="flex flex-row items-center pl-1">
            <StarIcon class="text-white pr-0.5" />
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
      <li class="hidden md:flex">
        <a
          class="flex flex-row items-center space-x-1"
          href="/search"
        >
          <span>Search</span>
        </a>
      </li>
      <li>
        <ProjectSelect class="sm:hidden shrink-0" />
        <p class="flex flex-row invisible hidden">
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
  );
}
