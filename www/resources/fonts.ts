import { all, createContext, type Operation, until } from "effection";

export interface Fonts {
  buffers: Uint8Array[];
  defaultFamily: string;
  monospaceFamily: string;
}

const FontsContext = createContext<Fonts>("fonts");

export function* initFonts(): Operation<void> {
  let buffers = yield* all([
    // Proxima Nova: 400, 700, 800
    fetchFont(
      "https://use.typekit.net/af/efe4a5/00000000000000007735e609/30/l?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n4&v=3",
    ),
    fetchFont(
      "https://use.typekit.net/af/2555e1/00000000000000007735e603/30/l?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n7&v=3",
    ),
    fetchFont(
      "https://use.typekit.net/af/8738d8/00000000000000007735e611/30/l?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n8&v=3",
    ),
    // JetBrains Mono: 400, 600
    fetchFont(
      "https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxjPQ.ttf",
    ),
    fetchFont(
      "https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8FqtjPQ.ttf",
    ),
  ]);

  yield* FontsContext.set({
    buffers,
    defaultFamily: "proxima-nova",
    monospaceFamily: "JetBrains Mono",
  });
}

export function* useFonts(): Operation<Fonts> {
  return yield* FontsContext.expect();
}

function* fetchFont(url: string): Operation<Uint8Array> {
  let response = yield* until(fetch(url));
  let buffer = yield* until(response.arrayBuffer());
  return new Uint8Array(buffer);
}
