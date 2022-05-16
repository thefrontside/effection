import { useMemo, useCallback } from "react";
import { stringify, parse, ParsedQuery } from "query-string";
import { useLocation } from "react-router-dom";

type ParsedQueryParams = ParsedQuery<string | boolean | number>;

export function useQueryParams(): [
  ParsedQueryParams,
  (overrides: ParsedQueryParams) => string
] {
  let location = useLocation();

  let search: ParsedQueryParams = useMemo(
    () =>
      parse(location.search, {
        parseBooleans: true,
        parseNumbers: true,
        arrayFormat: "comma",
      }),
    [location]
  );

  let mergeSearchParams = useCallback(
    (overrides: ParsedQueryParams) =>
      '?' + stringify(
        { ...search, ...overrides },
        { skipEmptyString: true, skipNull: true, arrayFormat: "comma" }
      ),
    [search]
  );

  return [search, mergeSearchParams];
}
