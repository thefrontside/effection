// @ts-nocheck Property 'role' does not exist on type 'HTMLElement'.deno-ts(2322)
import { JSXChild } from "revolution/jsx-runtime";

const ALERT_LEVELS = {
  warning:
    "bg-orange-100 border-orange-500 text-orange-700 dark:bg-orange-900 dark:border-orange-300 dark:text-orange-200",
  error:
    "bg-red-100 border-red-400 text-red-700 dark:bg-red-900 dark:border-red-300 dark:text-red-200",
  info:
    "bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-900 dark:border-blue-300 dark:text-blue-200",
} as const;

export function Alert({
  title,
  children,
  class: className,
  level,
}: {
  title?: string;
  level: "info" | "warning" | "error";
  children: JSXChild;
  class?: string;
}) {
  return (
    <div
      class={`${className ?? ""} ${
        ALERT_LEVELS[level]
      } border-l-4 p-4 [&>p]:my-1`}
      role="alert"
    >
      {title ? <p class="font-bold">{title}</p> : <></>}
      {children}
    </div>
  );
}
