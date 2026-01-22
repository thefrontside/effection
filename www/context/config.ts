import { createContext, type Operation } from "effection";

export interface SiteConfig<T extends string = string> {
  series: T[];
  current: NoInfer<T>;
}

const ConfigContext = createContext<SiteConfig>("site-config", {
  series: ["v3", "v4"],
  current: "v4",
});

export function* initConfig<T extends string>(
  config: SiteConfig<T>,
): Operation<void> {
  yield* ConfigContext.set(config);
}

export function* useConfig(): Operation<SiteConfig> {
  return yield* ConfigContext.expect();
}
