import type { Operation } from "effection";

import { createContext } from "./context.ts";

export const Outlet = createContext<JSX.Element>("outlet");

export const outlet: Operation<JSX.Element> = ({
  *[Symbol.iterator]() {
    return yield* Outlet.expect();
  }
})
