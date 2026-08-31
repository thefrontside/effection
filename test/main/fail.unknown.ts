import { main } from "../../mod.ts";

await main(function* () {
  throw false;
});
