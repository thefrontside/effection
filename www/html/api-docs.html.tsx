import type { Operation } from "effection";
import type { APIDocs } from "../docs/docs.ts";

export default function*(apidocs: APIDocs): Operation<JSX.Element> {
  return (
    <main>
      <h1>API Documentation</h1>
      <details open>
        <summary>Types</summary>
          <ul>
            {[...apidocs.getTypes()].map(node => (
              <li>{node.name}</li>
            ))}
          </ul>
      </details>
      <details open>
        <summary>Functions</summary>
        <ul>
          {[...apidocs.getFunctions()].map(node => (
            <li>{node.name}</li>
          ))}
        </ul>
      </details>
    </main>
  );
}
