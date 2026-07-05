export function Icon(props: { kind: string; class?: string }) {
  switch (props.kind) {
    case "function":
      return (
        <span
          class={`${
            props.class ? props.class : ""
          } rounded-full bg-sky-100 dark:text-black inline-block w-6 h-6 mr-1 text-center`}
        >
          f
        </span>
      );
    case "interface":
      return (
        <span
          class={`${
            props.class ? props.class : ""
          } rounded-full bg-orange-50 text-orange-600 inline-block w-6 h-6 mr-1 text-center`}
        >
          I
        </span>
      );
    case "typeAlias":
      return (
        <span
          class={`${
            props.class ? props.class : ""
          } rounded-full bg-red-50 text-red-600 inline-block w-6 h-6 mr-1 text-center`}
        >
          T
        </span>
      );
    case "variable": {
      return (
        <span
          class={`${
            props.class ? props.class : ""
          } rounded-full bg-purple-200 text-violet-600 inline-block w-6 h-6 mr-1 text-center`}
        >
          v
        </span>
      );
    }
  }
  return <></>;
}

/**
 * A small pill marking a symbol that is exported from the package's
 * `./experimental` entrypoint. Rendered inline next to a symbol's name.
 */
export function ExperimentalBadge(props: { class?: string }) {
  return (
    <span
      class={`${
        props.class ? props.class : ""
      } inline-block align-middle rounded bg-amber-100 dark:bg-amber-900 px-1.5 text-xs font-medium text-amber-800 dark:text-amber-200`}
      title="Experimental API — may change or be removed in a future release"
    >
      experimental
    </span>
  );
}
