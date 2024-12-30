
export function ensureTrailingSlash(url: URL) {
  const isFile = url.pathname.split("/").at(-1)?.includes(".");
  if (isFile || url.pathname.endsWith("/")) {
    return url;
  }
  return new URL(`${url.toString()}/`);
}
