import { createCommonResponse } from "https://deno.land/std@0.203.0/http/util.ts";
import {
  isRedirectStatus,
  Status,
} from "https://deno.land/std@0.203.0/http/http_status.ts";
import {
  calculate,
  ifNoneMatch,
} from "https://deno.land/std@0.203.0/http/etag.ts";
import { posixNormalize } from "https://deno.land/std@0.203.0/path/_normalize.ts";
import { extname } from "https://deno.land/std@0.203.0/path/extname.ts";
import { contentType } from "https://deno.land/std@0.203.0/media_types/content_type.ts";
import { join } from "https://deno.land/std@0.203.0/path/join.ts";
import type { TarEntry as $TarEntry } from "https://deno.land/std@0.203.0/archive/untar.ts";

export interface TarEntry extends $TarEntry {
  content: Blob;
}

export interface ServeTarOptions {
  entries: Map<string, TarEntry>;
  urlRoot?: string;
  tarRoot?: string;
  enableCors?: boolean;
  quiet?: boolean;
  headers?: string[];
  etagAlgorithm?: AlgorithmIdentifier;
  showDirListing?: boolean;
  showIndex?: boolean;
  showDotfiles?: boolean;
}

export interface ServeTarEntryOptions {
  /** The algorithm to use for generating the ETag.
   *
   * @default {"SHA-256"}
   */
  etagAlgorithm?: AlgorithmIdentifier;
}

/**
 * Returns an HTTP Response with the requested file as the body.
 * @param req The server request context used to cleanup the file handle.
 * @param filePath Path of the file to serve.
 */
export async function serveTarEntry(
  req: Request,
  entry: TarEntry,
  { etagAlgorithm: algorithm }: ServeTarEntryOptions = {},
): Promise<Response> {
  if (entry.type === "directory") {
    await req.body?.cancel();
    return createCommonResponse(Status.NotFound);
  }

  const headers = createBaseHeaders();

  // // Set date header if access timestamp is available
  // if (entry.atime) {
  //   headers.set("date", fileInfo.atime.toUTCString());
  // }

  const etag = entry.mtime
    ? await calculate({
      mtime: new Date(entry.mtime * 1000),
      size: entry.fileSize ?? 0,
    }, { algorithm })
    : await HASHED_DENO_DEPLOYMENT_ID;

  // Set last modified header if last modification timestamp is available
  if (entry.mtime) {
    headers.set("last-modified", new Date(entry.mtime * 1000).toUTCString());
  }
  if (etag) {
    headers.set("etag", etag);
  }

  if (etag || entry.mtime) {
    // If a `if-none-match` header is present and the value matches the tag or
    // if a `if-modified-since` header is present and the value is bigger than
    // the access timestamp value, then return 304
    let ifNoneMatchValue = req.headers.get("if-none-match");
    let ifModifiedSinceValue = req.headers.get("if-modified-since");
    if (
      (!ifNoneMatch(ifNoneMatchValue, etag)) ||
      (ifNoneMatchValue === null &&
        entry.mtime &&
        ifModifiedSinceValue &&
        (entry.mtime * 1000) <
          new Date(ifModifiedSinceValue).getTime() + 1000)
    ) {
      return createCommonResponse(Status.NotModified, null, { headers });
    }
  }

  // Set mime-type using the file extension in filePath
  const contentTypeValue = contentType(extname(entry.fileName));
  if (contentTypeValue) {
    headers.set("content-type", contentTypeValue);
  }

  const fileSize = entry.fileSize ?? 0;

  const rangeValue = req.headers.get("range");

  // handle range request
  // Note: Some clients add a Range header to all requests to limit the size of the response.
  // If the file is empty, ignore the range header and respond with a 200 rather than a 416.
  // https://github.com/golang/go/blob/0d347544cbca0f42b160424f6bc2458ebcc7b3fc/src/net/http/fs.go#L273-L276
  if (rangeValue && 0 < fileSize) {
    const parsed = parseRangeHeader(rangeValue, fileSize);

    // Returns 200 OK if parsing the range header fails
    if (!parsed) {
      // Set content length
      headers.set("content-length", `${fileSize}`);

      return createCommonResponse(Status.OK, entry.content, { headers });
    }

    // Return 416 Range Not Satisfiable if invalid range header value
    if (
      parsed.end < 0 ||
      parsed.end < parsed.start ||
      fileSize <= parsed.start
    ) {
      // Set the "Content-range" header
      headers.set("content-range", `bytes */${fileSize}`);

      return createCommonResponse(
        Status.RequestedRangeNotSatisfiable,
        undefined,
        { headers },
      );
    }

    // clamps the range header value
    const start = Math.max(0, parsed.start);
    const end = Math.min(parsed.end, fileSize - 1);

    // Set the "Content-range" header
    headers.set("content-range", `bytes ${start}-${end}/${fileSize}`);

    // Set content length
    const contentLength = end - start + 1;
    headers.set("content-length", `${contentLength}`);

    // Return 206 Partial Content
    let sliced = entry.content.slice(start, end);

    return createCommonResponse(Status.PartialContent, sliced, { headers });
  }

  // Set content length
  headers.set("content-length", `${fileSize}`);

  return createCommonResponse(Status.OK, readable(entry), { headers });
}

export async function serveTar(
  req: Request,
  opts: ServeTarOptions,
): Promise<Response> {
  let response: Response = await createServeTarResponse(req, opts);

  // Do not update the header if the response is a 301 redirect.
  const isRedirectResponse = isRedirectStatus(response.status);

  if (opts.enableCors && !isRedirectResponse) {
    response.headers.append("access-control-allow-origin", "*");
    response.headers.append(
      "access-control-allow-headers",
      "Origin, X-Requested-With, Content-Type, Accept, Range",
    );
  }

  if (!opts.quiet) serverLog(req, response.status);

  if (opts.headers && !isRedirectResponse) {
    for (const header of opts.headers) {
      const headerSplit = header.split(":");
      const name = headerSplit[0];
      const value = headerSplit.slice(1).join(":");
      response.headers.append(name, value);
    }
  }

  return response;
}

async function createServeTarResponse(
  req: Request,
  opts: ServeTarOptions,
) {
  let target = opts.tarRoot || "";
  let urlRoot = opts.urlRoot;
  let showIndex = opts.showIndex ?? true;
  //let showDotfiles = opts.showDotfiles || false;
  let { etagAlgorithm, /* showDirListing, quiet, */ entries } = opts;

  let url = new URL(req.url);
  let decodedUrl = decodeURIComponent(url.pathname);
  let normalizedPath = posixNormalize(decodedUrl);

  if (urlRoot && !normalizedPath.startsWith("/" + urlRoot)) {
    return createCommonResponse(Status.NotFound);
  }

  // Redirect paths like `/foo////bar` and `/foo/bar/////` to normalized paths.
  if (normalizedPath !== decodedUrl) {
    url.pathname = normalizedPath;
    return Response.redirect(url, 301);
  }

  if (urlRoot) {
    normalizedPath = normalizedPath.replace(urlRoot, "");
  }

  // Remove trailing slashes to avoid ENOENT errors
  // when accessing a path to a file with a trailing slash.
  while (normalizedPath.endsWith("/")) {
    normalizedPath = normalizedPath.slice(0, -1);
  }

  let tarPath = join(target, normalizedPath);

  let entry = entries.get(tarPath);

  if (!entry) {
    return createCommonResponse(Status.NotFound);
  }

  // For files, remove the trailing slash from the path.
  if (entry.type === "file" && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.slice(0, -1);
    return Response.redirect(url, 301);
  }
  // For directories, the path must have a trailing slash.
  if (entry.type === "directory" && !url.pathname.endsWith("/")) {
    // On directory listing pages,
    // if the current URL's pathname doesn't end with a slash, any
    // relative URLs in the index file will resolve against the parent
    // directory, rather than the current directory. To prevent that, we
    // return a 301 redirect to the URL with a slash.
    url.pathname += "/";
    return Response.redirect(url, 301);
  }

  // if target is file, serve file.
  if (entry.type === "file") {
    return await serveTarEntry(req, entry, {
      etagAlgorithm,
    });
  }

  // if target is directory, serve index or dir listing.
  if (showIndex) { // serve index.html
    const indexPath = join(tarPath, "index.html");

    let indexEntry = entries.get(indexPath);
    if (indexEntry?.type === "file") {
      return await serveTarEntry(req, indexEntry, {
        etagAlgorithm,
      });
    }
  }

  // if (showDirListing) { // serve directory list
  //   return serveTarIndex(fsPath, { showDotfiles, target, quiet });
  // }

  return createCommonResponse(Status.NotFound);
}

function createBaseHeaders(): Headers {
  return new Headers({
    server: "tar",
    // Set "accept-ranges" so that the client knows it can make range requests on future requests
    "accept-ranges": "bytes",
  });
}

function serverLog(req: Request, status: number) {
  const d = new Date().toISOString();
  const dateFmt = `[${d.slice(0, 10)} ${d.slice(11, 19)}]`;
  const url = new URL(req.url);
  const s = `${dateFmt} [${req.method}] ${url.pathname}${url.search} ${status}`;
  // using console.debug instead of console.log so chrome inspect users can hide request logs
  console.debug(s);
}

const ENV_PERM_STATUS =
  Deno.permissions.querySync?.({ name: "env", variable: "DENO_DEPLOYMENT_ID" })
    .state ?? "granted"; // for deno deploy
const DENO_DEPLOYMENT_ID = ENV_PERM_STATUS === "granted"
  ? Deno.env.get("DENO_DEPLOYMENT_ID")
  : undefined;
const HASHED_DENO_DEPLOYMENT_ID = DENO_DEPLOYMENT_ID
  ? calculate(DENO_DEPLOYMENT_ID, { weak: true })
  : undefined;

/**
 * parse range header.
 *
 * ```ts ignore
 * parseRangeHeader("bytes=0-100",   500); // => { start: 0, end: 100 }
 * parseRangeHeader("bytes=0-",      500); // => { start: 0, end: 499 }
 * parseRangeHeader("bytes=-100",    500); // => { start: 400, end: 499 }
 * parseRangeHeader("bytes=invalid", 500); // => null
 * ```
 *
 * Note: Currently, no support for multiple Ranges (e.g. `bytes=0-10, 20-30`)
 */
function parseRangeHeader(rangeValue: string, fileSize: number) {
  const rangeRegex = /bytes=(?<start>\d+)?-(?<end>\d+)?$/u;
  const parsed = rangeValue.match(rangeRegex);

  if (!parsed || !parsed.groups) {
    // failed to parse range header
    return null;
  }

  const { start, end } = parsed.groups;
  if (start !== undefined) {
    if (end !== undefined) {
      return { start: +start, end: +end };
    } else {
      return { start: +start, end: fileSize - 1 };
    }
  } else {
    if (end !== undefined) {
      // example: `bytes=-100` means the last 100 bytes.
      return { start: fileSize - +end, end: fileSize - 1 };
    } else {
      // failed to parse range header
      return null;
    }
  }
}

function readable(entry: TarEntry): BodyInit {
  return entry.content;
}
