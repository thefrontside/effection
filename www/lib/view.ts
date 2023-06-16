import { createContext, type Operation } from "effection";

export const Outlet = createContext<JSX.Element>("outlet");

export const outlet: Operation<JSX.Element> = {
  [Symbol.iterator]: Outlet[Symbol.iterator],
};
