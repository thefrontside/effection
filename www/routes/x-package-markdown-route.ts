import type { Operation } from "effection";
import { useParams } from "revolution";

import { useWorkspaces } from "../lib/workspaces/mod.ts";
import { markdown, notFound } from "../lib/markdown-response.ts";
import type { RoutePath, SitemapRoute } from "../plugins/sitemap.ts";

/**
 * Serve a package's README.md, the source of the page at `/x/:workspacePath`.
 *
 * An agent following the package catalog in `llms.txt` wants what the package
 * says about itself, not the page it is rendered into, and it should get it
 * from the site it is already reading rather than from GitHub.
 */
export function xPackageMarkdownRoute(): SitemapRoute<Response> {
  return {
    *routemap(generate): Operation<RoutePath[]> {
      let workspaces = yield* useWorkspaces("thefrontside/effectionx");

      return (yield* workspaces.listWorkspaces()).map((workspacePath) => ({
        pathname: generate({ workspacePath }),
      }));
    },
    *handler(): Operation<Response> {
      let { workspacePath } = yield* useParams<{ workspacePath: string }>();

      let workspaces = yield* useWorkspaces("thefrontside/effectionx");
      let pkg = yield* workspaces.getWorkspace(workspacePath);

      if (!pkg) {
        return notFound(`there is no package called '${workspacePath}'`);
      }

      return markdown(
        withInstallation(yield* pkg.getReadme(), yield* pkg.getName()),
      );
    },
  };
}

/**
 * Append how to install the package from npm.
 *
 * A readme read on its own, away from the page that carries the install
 * command beside it, otherwise leaves an agent to guess the package name. The
 * readmes that already give the command are left as they are, so that the
 * document never says it twice.
 */
function withInstallation(readme: string, name: string): string {
  let command = `npm install ${name}`;

  if (readme.includes(command)) {
    return readme;
  }

  return `${readme.trimEnd()}

## Installation

\`\`\`sh
${command}
\`\`\`
`;
}
