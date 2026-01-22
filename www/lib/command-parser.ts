/**
 * Parses a command string into arguments and options
 * Modern JavaScript version of minimist-string without external dependencies
 */
export interface ParsedCommand {
  _: string[];
  [key: string]: string | true | string[];
}

/**
 * Splits a command string into an array of arguments, preserving quoted strings
 * @param input The command string to split
 * @returns Array of command arguments
 */
export function splitCommand(input: string): string[] {
  if (!input.includes('"') && !input.includes("'")) {
    return input.trim().split(/\s+/);
  }

  let wrongPieces = input.split(" ");
  let goodPieces = solveQuotes(wrongPieces, '"');
  goodPieces = solveQuotes(goodPieces, "'");

  // Remove outer quotes but preserve escaped quotes
  let regexQuotes = /["']/g;
  for (let i = 0; i < goodPieces.length; i++) {
    goodPieces[i] = goodPieces[i].replace(/(\\\')/g, "%%%SINGLEQUOTE%%%");
    goodPieces[i] = goodPieces[i].replace(/(\\\")/g, "%%%DOUBLEQUOTE%%%");
    goodPieces[i] = goodPieces[i].replace(regexQuotes, "");
    goodPieces[i] = goodPieces[i].replace(/(%%%SINGLEQUOTE%%%)/g, "'");
    goodPieces[i] = goodPieces[i].replace(/(%%%DOUBLEQUOTE%%%)/g, '"');
  }

  return goodPieces;
}

/**
 * Parses a command string into arguments and options
 * @param input The command string to parse
 * @returns Parsed command with arguments and options
 */
export function parseCommand(input: string): ParsedCommand {
  if (!input.includes('"') && !input.includes("'")) {
    // Simple case - no quotes, just split by spaces
    return parseSimple(input);
  }

  // Complex case - handle quotes
  return parseWithQuotes(input);
}

function parseSimple(input: string): ParsedCommand {
  let pieces = input.trim().split(/\s+/);
  return parseTokens(pieces);
}

function parseWithQuotes(input: string): ParsedCommand {
  let wrongPieces = input.split(" ");

  let goodPieces = solveQuotes(wrongPieces, '"');
  goodPieces = solveQuotes(goodPieces, "'");

  // Remove outer quotes but preserve escaped quotes
  let regexQuotes = /["']/g;
  for (let i = 0; i < goodPieces.length; i++) {
    goodPieces[i] = goodPieces[i].replace(/(\\\')/g, "%%%SINGLEQUOTE%%%");
    goodPieces[i] = goodPieces[i].replace(/(\\\")/g, "%%%DOUBLEQUOTE%%%");
    goodPieces[i] = goodPieces[i].replace(regexQuotes, "");
    goodPieces[i] = goodPieces[i].replace(/(%%%SINGLEQUOTE%%%)/g, "'");
    goodPieces[i] = goodPieces[i].replace(/(%%%DOUBLEQUOTE%%%)/g, '"');
  }

  return parseTokens(goodPieces);
}

function countQuotes(piece: string, quoteChar: string): number {
  let regex = new RegExp(`[^${quoteChar}\\\\]`, "g");
  let replaced = piece.replace(regex, "");
  return replaced
    .replace(new RegExp(`(\\\\${quoteChar})`, "g"), "")
    .replace(/\\/g, "").length;
}

function hasQuote(piece: string, quoteChar: string): boolean {
  return countQuotes(piece, quoteChar) > 0;
}

function getFirstQuote(piece: string, quoteChar: string, position = 0): number {
  let i = position - 1;
  do {
    i = piece.indexOf(quoteChar, i + 1);
  } while (piece.charAt(i - 1) === "\\");
  return i;
}

function splitPiece(piece: string, quoteChar: string): [string, string] {
  let firstQIndex = getFirstQuote(piece, quoteChar);
  let secondQIndex = getFirstQuote(piece, quoteChar, firstQIndex + 1);

  let firstPart = piece.substring(0, secondQIndex + 1);
  let secondPart = piece.substring(secondQIndex + 1);

  return [firstPart, secondPart];
}

function solveQuotes(pieces: string[], quoteChar: string): string[] {
  let unclosedQuote = false;
  let result: string[] = [];

  for (let i = 0; i < pieces.length; i++) {
    if (unclosedQuote) {
      if (hasQuote(pieces[i], quoteChar)) {
        let qIndex = getFirstQuote(pieces[i], quoteChar);
        if (qIndex !== pieces[i].length - 1) {
          // Closing quote is not the last character
          pieces[i + 1] = pieces[i].substring(qIndex + 1) +
            (pieces[i + 1] !== undefined ? pieces[i + 1] : "");
          pieces[i] = pieces[i].substring(0, qIndex + 1);
        }

        result[result.length - 1] = result[result.length - 1] + " " + pieces[i];
        unclosedQuote = false;
      } else {
        result[result.length - 1] = result[result.length - 1] + " " + pieces[i];
      }
    } else {
      if (hasQuote(pieces[i], quoteChar)) {
        let quoteCount = countQuotes(pieces[i], quoteChar);

        if (quoteCount === 1) {
          result.push(pieces[i]);
          unclosedQuote = true;
        } else if (quoteCount === 2) {
          let split = splitPiece(pieces[i], quoteChar);
          result.push(split[0]);
          if (split[1] !== "") result.push(split[1]);
        } else {
          let next = pieces[i];
          do {
            let split = splitPiece(next, quoteChar);
            result.push(split[0]);
            next = split[1];
          } while (countQuotes(next, quoteChar) > 2);

          if (countQuotes(next, quoteChar) === 1) {
            result.push(next);
            unclosedQuote = true;
          } else if (countQuotes(next, quoteChar) === 2) {
            result.push(next);
          } else {
            throw new Error(
              "Unexpected behavior in command parsing. Please report this bug.",
            );
          }
        }
      } else {
        result.push(pieces[i]);
      }
    }
  }
  return result;
}

function parseTokens(tokens: string[]): ParsedCommand {
  let result: ParsedCommand = { _: [] };

  for (let i = 0; i < tokens.length; i++) {
    let token = tokens[i];

    if (token.startsWith("--")) {
      // Long option
      let equalIndex = token.indexOf("=");
      if (equalIndex !== -1) {
        let key = token.substring(2, equalIndex);
        let value = token.substring(equalIndex + 1);
        result[key] = value;
      } else {
        let key = token.substring(2);
        // Check if next token is a value
        if (i + 1 < tokens.length && !tokens[i + 1].startsWith("-")) {
          result[key] = tokens[++i];
        } else {
          result[key] = true;
        }
      }
    } else if (token.startsWith("-") && token.length > 1) {
      // Short option(s)
      let flags = token.substring(1);

      for (let j = 0; j < flags.length; j++) {
        let flag = flags[j];

        if (j === flags.length - 1) {
          // Last flag - might have a value
          if (i + 1 < tokens.length && !tokens[i + 1].startsWith("-")) {
            result[flag] = tokens[++i];
          } else {
            result[flag] = true;
          }
        } else {
          result[flag] = true;
        }
      }
    } else {
      // Regular argument
      result._.push(token);
    }
  }

  return result;
}
