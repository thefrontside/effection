import type { Operation } from "effection";
import type { APIDocs } from "../docs/api.ts";
import { outlet } from "freejack/view.ts";

export default function* (apidocs: APIDocs): Operation<JSX.Element> {
  return (
    <main class="grid grid-cols-4">
      <nav>
        <h1>API Documentation</h1>
        <details open>
          <summary>Types</summary>
          <ul>
            {[...apidocs.getTypes()].map((node) => (
              <li>
                <a href={`/api/types/${node.modname}/${node.name}`}>
                  {node.name}
                </a>
              </li>
            ))}
          </ul>
        </details>
        <details open>
          <summary>Functions</summary>
          <ul>
            {[...apidocs.getFunctions()].map((node) => (
              <li>
                <a href={`/api/functions/${node.modname}/${node.name}`}>
                  {node.name}
                </a>
              </li>
            ))}
          </ul>
        </details>
      </nav>
      <section class="col-span-3">
        {yield* outlet}
      </section>
    </main>
  );
}
