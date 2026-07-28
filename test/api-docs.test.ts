import { expect, it } from "./suite.ts";

interface DocDeclaration {
  jsDoc?: {
    doc?: string;
  };
}

interface DocSymbol {
  name: string;
  declarations: DocDeclaration[];
}

it("experimental API exports retain their JSDoc", async () => {
  let specifier = new URL("../experimental.ts", import.meta.url).href;
  let command = new Deno.Command(Deno.execPath(), {
    args: ["doc", "--json", specifier],
  });
  let output = await command.output();

  if (!output.success) {
    throw new Error(new TextDecoder().decode(output.stderr));
  }

  let document = JSON.parse(new TextDecoder().decode(output.stdout)) as {
    nodes: Record<string, { symbols: DocSymbol[] }>;
  };
  let symbols = document.nodes[specifier].symbols;

  for (let name of ["createApi", "api"]) {
    let symbol = symbols.find((candidate) => candidate.name === name);
    if (!symbol) {
      throw new Error(`Could not find experimental export ${name}`);
    }
    expect(symbol.declarations).toHaveLength(1);
    expect(symbol.declarations[0].jsDoc?.doc).toBeTruthy();
  }
});
