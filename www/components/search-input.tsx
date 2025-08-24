import { SearchIcon } from "./icons/search.tsx";

export function SearchInput() {
  return (
    <form method="get" action="/search">
      <label class="h-9 w-[90px] relative block">
        <input
          id="search"
          type="search"
          name="q"
          placeholder="⌘K"
          class="relative block h-full w-full bg-slate-100 dark:bg-gray-800 rounded-full text-slate-800 dark:text-gray-200 transition-all text-lg pl-3 focus:outline-none focus:bg-white dark:focus:bg-gray-900 focus:border-slate-500 dark:focus:border-blue-secondary focus:ring-slate-500 dark:focus:ring-blue-secondary focus:ring-2 focus:pl-4 focus:w-[220px] focus:-ml-[130px] focus:z-10"
        />
        <button
          type="submit"
          class="absolute inset-y-0 right-0 flex items-center pr-2"
          title="Search"
        >
          <SearchIcon class="w-6 mr-2 text-slate-400 dark:text-gray-400" />
        </button>
      </label>
    </form>
  );
}
