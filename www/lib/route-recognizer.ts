import { default as _RouteRecognizer } from "npm:route-recognizer";

export interface RouteRecognizer {
  add(segments: Pattern[]): void;
  recognize(uri: string): Segment[];
}

export interface Pattern {
  path: string;
  handler: unknown;
}

export interface Segment {
  handler: unknown;
  params: Record<string, string>;
}

export function createRouteRecognizer(): RouteRecognizer {
  //@ts-expect-error this library is completely untyped;
  return new _RouteRecognizer();
}
