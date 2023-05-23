import type { Operation } from "effection";
import type { Doc } from "../docs/docs.ts";
import { Title } from "freejack/view.ts";

export default function* (doc: Doc): Operation<JSX.Element> {
  return (
    <>
      <h1>{doc.title}</h1>
      <doc.MDXContent/>
    </>
  );
}
