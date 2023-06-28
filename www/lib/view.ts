import { createContext, type Operation } from "effection";

const Outlet = createContext<JSX.Element>("outlet");

export const outlet: Operation<JSX.Element> = {
  *[Symbol.iterator]() {
    return yield* Outlet;
  },
};

export function* render(
  ...templates: Operation<JSX.Element>[]
): Operation<JSX.Element> {
  // won't be necessary when we migrate to HAST
  let content = null as unknown as JSX.Element;
  for (let template of templates.reverse()) {
    yield* Outlet.set(content);
    content = yield* template;
  }
  return content;
}
