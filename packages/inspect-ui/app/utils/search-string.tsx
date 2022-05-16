import { stringify } from "query-string";
export type SearchParams = {
  [key: string]: string | boolean | number | undefined;
};

export function searchString(parts: SearchParams): string {
  // remove keys with undefined to clear query param
  // from url
  let filtered = Object.keys(parts).reduce<SearchParams>((acc, key) => {
    if (parts[key] === undefined) {
      return acc;
    } else {
      acc[key] = parts[key];
      return acc;
    }
  }, {});

  if (Object.keys(filtered).length === 0) {
    return "";
  } else {
    return `?${stringify(filtered)}`;
  }
}
