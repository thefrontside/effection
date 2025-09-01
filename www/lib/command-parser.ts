/**
 * Parses a command string into arguments and options
 * Modern JavaScript version of minimist-string without external dependencies
 */
export interface ParsedCommand {
  _: string[];
  [key: string]: any;
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

  const wrongPieces = input.split(" ");
  let goodPieces = solveQuotes(wrongPieces, '"');
  goodPieces = solveQuotes(goodPieces, "'");

  // Remove outer quotes but preserve escaped quotes
  const regexQuotes = /["']/g;
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
  const pieces = input.trim().split(/\s+/);
  return parseTokens(pieces);
}

function parseWithQuotes(input: string): ParsedCommand {
  const wrongPieces = input.split(" ");
  
  let goodPieces = solveQuotes(wrongPieces, '"');
  goodPieces = solveQuotes(goodPieces, "'");

  // Remove outer quotes but preserve escaped quotes
  const regexQuotes = /["']/g;
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
  const regex = new RegExp(`[^${quoteChar}\\\\]`, "g");
  const replaced = piece.replace(regex, "");
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
  const firstQIndex = getFirstQuote(piece, quoteChar);
  const secondQIndex = getFirstQuote(piece, quoteChar, firstQIndex + 1);

  const firstPart = piece.substring(0, secondQIndex + 1);
  const secondPart = piece.substring(secondQIndex + 1);

  return [firstPart, secondPart];
}

function solveQuotes(pieces: string[], quoteChar: string): string[] {
  let unclosedQuote = false;
  const result: string[] = [];

  for (let i = 0; i < pieces.length; i++) {
    if (unclosedQuote) {
      if (hasQuote(pieces[i], quoteChar)) {
        const qIndex = getFirstQuote(pieces[i], quoteChar);
        if (qIndex !== pieces[i].length - 1) {
          // Closing quote is not the last character
          pieces[i + 1] =
            pieces[i].substring(qIndex + 1) +
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
        const quoteCount = countQuotes(pieces[i], quoteChar);
        
        if (quoteCount === 1) {
          result.push(pieces[i]);
          unclosedQuote = true;
        } else if (quoteCount === 2) {
          const split = splitPiece(pieces[i], quoteChar);
          result.push(split[0]);
          if (split[1] !== "") result.push(split[1]);
        } else {
          let next = pieces[i];
          do {
            const split = splitPiece(next, quoteChar);
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
              "Unexpected behavior in command parsing. Please report this bug."
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
  const result: ParsedCommand = { _: [] };
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    
    if (token.startsWith("--")) {
      // Long option
      const equalIndex = token.indexOf("=");
      if (equalIndex !== -1) {
        const key = token.substring(2, equalIndex);
        const value = token.substring(equalIndex + 1);
        result[key] = value;
      } else {
        const key = token.substring(2);
        // Check if next token is a value
        if (i + 1 < tokens.length && !tokens[i + 1].startsWith("-")) {
          result[key] = tokens[++i];
        } else {
          result[key] = true;
        }
      }
    } else if (token.startsWith("-") && token.length > 1) {
      // Short option(s)
      const flags = token.substring(1);
      
      for (let j = 0; j < flags.length; j++) {
        const flag = flags[j];
        
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