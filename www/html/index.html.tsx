import type { Operation } from "effection";

export default function* IndexHTML(): Operation<JSX.Element> {
  return (
    <main class="container text-center p-16 text-2xl">
      <h1>This is the index and landing page</h1>
    </main>
  );
}
