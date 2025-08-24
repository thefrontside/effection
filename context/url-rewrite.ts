import { Operation } from "effection";
import { createApi } from "./context-api.ts";

interface UrlRewrite {
  rewrite(url: URL, input: RequestInfo | URL, init?: RequestInit): Operation<URL>;
}

export const urlRewriteApi = createApi<UrlRewrite>("url-rewrite", {
  *rewrite(url) {
    return url;
  }
});

export const { rewrite } = urlRewriteApi.operations;
