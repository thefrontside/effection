import {
  main,
  on,
  each,
  spawn,
  suspend,
  resource,
  createChannel,
  sleep,
} from "https://esm.sh/effection@4.0.0-alpha.5";

await main(function* () {
  const input = document.getElementById("search");
  if (!input) {
    console.log(`Search could not be setup because input was not found.`);
    return;
  }

  const label = input.closest("label");
  if (!label) {
    console.log(
      `Search could not be setup because label element was not found.`,
    );
    return;
  }

  const button = input.nextElementSibling;
  if (!button) {
    console.log(
      `Search could not be setup because button element was not found.`,
    );
    return;
  }

  let lastBlur;
  yield* forEach(
    yield* join([
      on(input, "focus"),
      on(button, "focus"),
      on(input, "blur"),
      on(button, "blur"),
    ]),
    function* (event) {
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
    },
  );

  yield* forEach(on(document, "keydown"), function* (event) {
    if (event.metaKey && event.key === "k") {
      event.preventDefault();
      input.focus();
    }
    if (event.key === "Escape") {
      input.blur();
    }
  });

  yield* suspend();
});

/**
 * @param {Stream<Event, void>} stream
 * @param {(event: Event) => Operation<void>} op
 * @returns
 */
function forEach(stream, op) {
  return spawn(function* () {
    for (const event of yield* each(stream)) {
      yield* op(event);
      yield* each.next();
    }
    yield* suspend();
  });
}

/**
 * @template {T}
 * @param {Stream<T>[]} streams
 * @returns {Operation<Stream<T>>}
 */
function join(streams) {
  return resource(function* (provide) {
    const channel = createChannel();
    yield* spawn(function* () {
      for (const stream of streams) {
        yield* forEach(stream, function* (event) {
          yield* channel.send(event);
        });
      }
      yield* suspend();
    });
    yield* provide(channel);
  });
}
