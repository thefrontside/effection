import expect from 'expect';
import path from 'path';

import { createProgram, getPreEmitDiagnostics } from 'typescript';

expect.extend({
  toCompile(received) {
    let diagnostics = compile(received);
    let pass = diagnostics.length == 0;
    if (pass) {
      return {
        pass,
        message: () =>
          `expected '${received}' to compile with errors, but it compiled cleanly`
      };
    } else {
      return {
        pass,
        message: () =>
          `expected '${received}' to compile without errors, but it failed:

${formatTypescriptDiagnostics(diagnostics)}`
      };
    }
  }
});

function formatTypescriptDiagnostic(diagnostic) {
  let { file, messageText } = diagnostic;
  if (file) {

    let { line, character } =
        file.getLineAndCharacterOfPosition(diagnostic.start);

    let { originalFileName } = file;
    return `${originalFileName}:${line + 1}:${character} ${messageText}`;
  } else {
    return messageText;
  }
}

function formatTypescriptDiagnostics(diagnostics) {
  return diagnostics.map(formatTypescriptDiagnostic).join("\n");
}


function compile(fileName) {
  let location = path.join("tests", "typescript", fileName);
  let program = createProgram(["index.d.ts", location], {
    noEmit: true
  });
  let emitResult = program.emit();
  return getPreEmitDiagnostics(program).concat(emitResult.diagnostics);
}
