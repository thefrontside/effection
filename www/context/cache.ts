import { createContext } from "effection";
import { TtlCache } from "jsr:@std/cache@0.1.3";

export const CacheContext = createContext("cache", new TtlCache(3600_000));
