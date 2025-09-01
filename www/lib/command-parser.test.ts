import { describe, it } from "../testing.ts";
import { expect } from "expect";
import { parseCommand, splitCommand } from "./command-parser.ts";

describe("parseCommand", () => {
  // Test cases from minimist-string README
  it("solves the main minimist-string problem", function* () {
    const result = parseCommand('foo --bar "Hello world!"');
    expect(result).toEqual({
      _: ["foo"],
      bar: "Hello world!"
    });
  });

  it("handles escaped quotes correctly", function* () {
    const result = parseCommand('foo --bar "Hello \\"world\\"!"');
    expect(result).toEqual({
      _: ["foo"],
      bar: 'Hello "world"!'
    });
  });

  it("handles simple quoted string", function* () {
    const result = parseCommand('foo --bar "Hello!"');
    expect(result).toEqual({
      _: ["foo"],
      bar: "Hello!"
    });
  });

  // Additional comprehensive tests
  it("handles simple command without quotes", function* () {
    const result = parseCommand('foo --bar hello');
    expect(result).toEqual({
      _: ["foo"],
      bar: "hello"
    });
  });

  it("handles multiple arguments", function* () {
    const result = parseCommand('command arg1 arg2 --flag --option value');
    expect(result).toEqual({
      _: ["command", "arg1", "arg2"],
      flag: true,
      option: "value"
    });
  });

  it("handles equals syntax for options", function* () {
    const result = parseCommand('command --option=value --flag');
    expect(result).toEqual({
      _: ["command"],
      option: "value",
      flag: true
    });
  });

  it("handles short flags", function* () {
    const result = parseCommand('command -f -abc value');
    expect(result).toEqual({
      _: ["command"],
      f: true,
      a: true,
      b: true,
      c: "value"
    });
  });

  it("handles mixed quotes", function* () {
    const result = parseCommand(`command --single 'Hello world' --double "Hello world"`);
    expect(result).toEqual({
      _: ["command"],
      single: "Hello world",
      double: "Hello world"
    });
  });

  it("handles complex git command", function* () {
    const result = parseCommand('git commit -m "Initial commit with spaces"');
    expect(result).toEqual({
      _: ["git", "commit"],
      m: "Initial commit with spaces"
    });
  });

  it("handles empty quotes", function* () {
    const result = parseCommand('command --empty ""');
    expect(result).toEqual({
      _: ["command"],
      empty: ""
    });
  });

  it("handles boolean flags", function* () {
    const result = parseCommand('command --verbose --quiet');
    expect(result).toEqual({
      _: ["command"],
      verbose: true,
      quiet: true
    });
  });

  it("handles hyphenated options", function* () {
    const result = parseCommand('command --dry-run --output-dir /tmp');
    expect(result).toEqual({
      _: ["command"],
      "dry-run": true,
      "output-dir": "/tmp"
    });
  });
});

describe("splitCommand", () => {
  it("splits simple command without quotes", function* () {
    const result = splitCommand('git status --porcelain');
    expect(result).toEqual(['git', 'status', '--porcelain']);
  });

  it("preserves quoted strings with spaces", function* () {
    const result = splitCommand('git commit -m "Initial commit with spaces"');
    expect(result).toEqual(['git', 'commit', '-m', 'Initial commit with spaces']);
  });

  it("handles escaped quotes", function* () {
    const result = splitCommand('echo "Hello \\"world\\""');
    expect(result).toEqual(['echo', 'Hello "world"']);
  });

  it("handles mixed quotes", function* () {
    const result = splitCommand(`command --single 'Hello world' --double "Hello world"`);
    expect(result).toEqual(['command', '--single', 'Hello world', '--double', 'Hello world']);
  });

  it("handles empty quotes", function* () {
    const result = splitCommand('command --empty ""');
    expect(result).toEqual(['command', '--empty', '']);
  });

  it("handles multiple spaces", function* () {
    const result = splitCommand('  command    arg1    arg2  ');
    expect(result).toEqual(['command', 'arg1', 'arg2']);
  });
});