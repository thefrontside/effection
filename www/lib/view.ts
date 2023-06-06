import type { Operation } from "effection";

import { createContext } from "./context.ts";

export const Outlet = createContext<Operation<JSX.Element>>("outlet");

export const outlet: Operation<JSX.Element> = {
  *[Symbol.iterator]() {
    let reify = yield* Outlet.expect();
    return yield* reify;
  },
};
