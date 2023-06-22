import { default as _RouteRecognizer } from "https://esm.sh/route-recognizer@0.3.4";

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
