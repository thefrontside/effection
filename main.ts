import { main, suspend } from "effection";
import { createRevolution, ServerInfo } from "revolution";
import { initDenoDeploy } from "jsr:@effection-contrib/deno-deploy@0.1.0";

import { config } from "./tailwind.config.ts";
import { route, sitemapPlugin } from "./plugins/sitemap.ts";
import { twindPlugin } from "./plugins/twind.ts";
import { etagPlugin } from "./plugins/etag.ts";
import { rebasePlugin } from "./plugins/rebase.ts";

import { assetsRoute } from "./routes/assets-route.ts";
import { indexRoute } from "./routes/index.tsx";
import { packageRoute } from "./routes/package.tsx";
import { initJSRClient } from "./hooks/use-jsr-client.ts";
import { initRepositoryContext } from "./hooks/use-repository.ts";

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  await main(function* () {
    const denoDeploy = yield* initDenoDeploy();

    if (denoDeploy.isDenoDeploy) {
      patchDenoPermissionsQuerySync();
    }

    const token = Deno.env.get("JSR_API") ?? "";
    if (token === "") {
      console.log("Missing JSR API token; expect score card not to load.");
    }

    yield* initJSRClient({
      token,
    });

    yield* initRepositoryContext({
      name: `thefrontside/effection-contrib`,
      location: new URL("./../", import.meta.url),
      defaultBranch: "main",
    });

    let revolution = createRevolution({
      app: [
        route("/", indexRoute()),
        route("/:workspace", packageRoute()),
        route("/assets(.*)", assetsRoute("assets")),
      ],
      plugins: [
        twindPlugin({ config }),
        etagPlugin(),
        rebasePlugin(),
        sitemapPlugin(),
      ],
    });

    let server = yield* revolution.start();
    console.log(`www -> ${urlFromServer(server)}`);

    yield* suspend();
  });
}

function urlFromServer(server: ServerInfo) {
  return new URL(
    "/",
    `http://${
      server.hostname === "0.0.0.0" ? "localhost" : server.hostname
    }:${server.port}`,
  );
}

/** see https://github.com/denoland/deploy_feedback/issues/527#issuecomment-2510631720 */
function patchDenoPermissionsQuerySync() {
  const permissions = {
    run: "denied",
    read: "granted",
    write: "denied",
    net: "granted",
    env: "granted",
    sys: "denied",
    ffi: "denied",
  } as const;

  Deno.permissions.querySync ??= ({ name }) => {
    return {
      state: permissions[name],
      onchange: null,
      partial: false,
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {
        return false;
      },
    };
  };
}
