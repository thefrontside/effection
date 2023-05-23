import type { Operation } from "effection";

export default function* IndexHTML(): Operation<JSX.Element> {
  return <h1>Hello World</h1>;
}
