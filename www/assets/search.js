import {
  all,
  createChannel,
  each,
  main,
  on,
  resource,
  sleep,
  spawn,
  // deno-lint-ignore no-import-prefix
} from "https://esm.sh/effection@4.0.0-beta.3";

await main(function* () {
  let input = document.getElementById("search");
  if (!input) {
    console.log(`Search could not be setup because input was not found.`);
    return;
  }

  let label = input.closest("label");
  if (!label) {
    console.log(
      `Search could not be setup because label element was not found.`,
    );
    return;
  }

  let button = input.nextElementSibling;
  if (!button) {
    console.log(
      `Search could not be setup because button element was not found.`,
    );
    return;
  }

  let events = yield* join([
    on(input, "focus"),
    on(button, "focus"),
    on(input, "blur"),
    on(button, "blur"),
  ]);

  /** @type {Task<void>} */
  let lastBlur;
  yield* spawn(function* () {
    for (let event of yield* each(events)) {
      if (event.type === "blur") {
        lastBlur = yield* spawn(function* () {
          yield* sleep(15);
          input.value = "";
          input.setAttribute("placeholder", "⌘K");
          input.classList.remove("focused");
        });
      } else {
        if (lastBlur) {
          yield* lastBlur.halt();
        }
        input.removeAttribute("placeholder");
        input.classList.add("focused");
      }
      yield* each.next();
    }
  });

  for (let event of yield* each(on(document, "keydown"))) {
    if (event.metaKey && event.key === "k") {
      event.preventDefault();
      input.focus();
    }
    if (event.key === "Escape") {
      input.blur();
    }
    yield* each.next();
  }
});

/**
 * Combine multiple streams into a single stream
 * @template {T}
 * @param {Stream<T>[]} streams
 * @returns {Operation<Stream<T>>}
 */
function join(streams) {
  return resource(function* (provide) {
    let channel = createChannel();

    yield* spawn(function* () {
      yield* all(streams.map(function* (stream) {
        for (let event of yield* each(stream)) {
          yield* channel.send(event);
          yield* each.next();
        }
      }));
    });

    yield* provide(channel);
  });
}
