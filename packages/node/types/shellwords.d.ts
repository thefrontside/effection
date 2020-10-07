declare module "shellwords" {
  export function split(expression: string): string[];
  export function escape(expression: string): string;
  export = { split, escape };
}
