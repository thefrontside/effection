import { Operation } from "effection";

export function* replaceAll(
  input: string,
  regex: RegExp,
  replacement: (match: RegExpMatchArray) => Operation<string>,
): Operation<string> {
  // replace all implies global, so append if it is missing
  const addGlobal = !regex.flags.includes("g")
  let flags = regex.flags
  if (addGlobal) flags += "g"

  // get matches
  let matcher = new RegExp(regex.source, flags)
  const matches = Array.from(input.matchAll(matcher))

  if (matches.length == 0) return input

  // construct all replacements
  let replacements: Array<string>
  replacements = new Array<string>()
  for (let m of matches) {
    let r = yield* replacement(m)
    replacements.push(r)
  }

  // change capturing groups into non-capturing groups for split
  // (because capturing groups are added to the parts array
  let source = regex.source.replace(/(?<!\\)\((?!\?:)/g, "(?:")
  let splitter = new RegExp(source, flags)

  const parts = input.split(splitter)

  // stitch everything back together
  let result = parts[0]
  for (let i = 0; i < replacements.length; i++) {
    result += replacements[i] + parts[i + 1]
  }

  return result;
}