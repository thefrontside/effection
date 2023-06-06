import type { Operation } from "effection";
import type { Doc } from "../docs/docs.ts";

export default function* (doc: Doc): Operation<JSX.Element> {
  return (
    <>
      <h1 class="font-bold text-2xl">{doc.title}</h1>
      <doc.MDXContent />
    </>
  );
}
