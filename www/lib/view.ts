import { createContext, type Operation } from "effection";

export const Outlet = createContext<Operation<JSX.Element>>("outlet");

export const outlet: Operation<JSX.Element> = {
  *[Symbol.iterator]() {
    let reify = yield* Outlet;
    return yield* reify;
  },
};
