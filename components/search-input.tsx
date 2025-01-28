import { css } from "npm:@twind/core@1.1.3";
import { SearchIcon } from "./icons/search.tsx";

const searchInput = css`
  input {
    @apply relative block h-full w-full bg-slate-100 rounded-full text-slate-800 transition-all text-lg pl-3;
  }

  input.focused {
    @apply outline-none bg-white border-slate-500 ring-slate-500 ring-2 pl-4 w-[220px] -ml-[130px] z-1;
  }

  input::-webkit-search-cancel-button {
    -webkit-appearance: none;
    appearance: none;
  }
`;

export function SearchInput() {
  return (
    <form method="get" action="/search">
      <label class={`${searchInput} h-9 w-[90px] relative block`}>
        <input id="search" type="search" name="q" placeholder="⌘K" />
        <button class="absolute inset-y-0 right-0 flex items-center pr-2">
          <SearchIcon class="w-6 mr-2 text-slate-400" />
        </button>
      </label>
    </form>
  );
}
