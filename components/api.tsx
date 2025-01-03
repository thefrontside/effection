import { call, type Operation } from "effection";
import type { JSXElement } from "revolution";
import type {
  ClassDef,
  InterfaceDef,
  ParamDef,
  TsTypeDef,
  TsTypeParamDef,
  TsTypeRefDef,
  VariableDef,
} from "https://deno.land/x/deno_doc@0.125.0/types.d.ts";
import {
  Builtin,
  ClassName,
  Keyword,
  Operator,
  Optional,
  Punctuation,
} from "./tokens.tsx";
import { useMDX } from "../hooks/use-mdx.tsx";
import { useMarkdown } from "../hooks/use-markdown.tsx";
import { Package } from "../resources/package.ts";
import { DocNode } from "../hooks/use-deno-doc.ts";

export function* API(pkg: Package): Operation<JSXElement> {
  const elements: JSXElement[] = [];
  const docs = yield* pkg.docs();

  for (const exportName of Object.keys(docs)) {
    const nodes = docs[exportName];
    for (const node of nodes) {
      const { MDXDoc = () => <></> } = node;

      elements.push(
        <section id={node.id}>
          {yield* Type({ node })}
          <div class="pl-2 -mt-5">
            <MDXDoc />
          </div>
        </section>,
      );
    }
  }

  return <>{elements}</>;
}

interface TypeProps {
  node: DocNode;
}

export function* Type({ node }: TypeProps): Operation<JSXElement> {
  switch (node.kind) {
    case "function":
      return (
        <header>
          <h3 class="inline-block">
            <span class="language-ts code-highlight">
              {node.functionDef.isAsync
                ? <Punctuation>{"async "}</Punctuation>
                : <></>}
              <Keyword>{node.kind}</Keyword>
              {node.functionDef.isGenerator
                ? <Punctuation>*</Punctuation>
                : <></>} <span class="token function">{node.name}</span>
              <Punctuation>(</Punctuation>
              <FunctionParams params={node.functionDef.params} />
              <Punctuation>)</Punctuation>: {node.functionDef.returnType
                ? <TypeDef typeDef={node.functionDef.returnType} />
                : <></>}
            </span>
          </h3>
        </header>
      );
    case "class":
      return (
        <header class="mb-10">
          <h3 class="inline-block mb-0">
            <Keyword>{node.kind}</Keyword> <ClassName>{node.name}</ClassName>
            {node.classDef.extends
              ? (
                <>
                  <Keyword>{" extends "}</Keyword>
                  <ClassName>{node.classDef.extends}</ClassName>
                </>
              )
              : <></>}
            {node.classDef.implements
              ? (
                <>
                  <Keyword>{" implements "}</Keyword>
                  <>
                    {node.classDef.implements
                      .flatMap((
                        typeDef,
                      ) => [<TypeDef typeDef={typeDef} />, ", "])
                      .slice(0, -1)}
                  </>
                </>
              )
              : <></>}
            <Punctuation classes="text-lg">
              {" {"}
            </Punctuation>
          </h3>
          {yield* TSClassDef({ classDef: node.classDef })}
          <Punctuation classes="text-lg">{"}"}</Punctuation>
        </header>
      );
    case "interface":
      return (
        <header class="mb-10">
          <h3 class="inline-block mb-0">
            <Keyword>{node.kind}</Keyword> <ClassName>{node.name}</ClassName>
            {node.interfaceDef.typeParams.length > 0
              ? (
                <InterfaceTypeParams
                  typeParams={node.interfaceDef.typeParams}
                />
              )
              : <></>}
            {node.interfaceDef.extends.length > 0
              ? (
                <>
                  <Keyword>{" extends "}</Keyword>
                  <>
                    {node.interfaceDef.extends
                      .flatMap((
                        typeDef,
                      ) => [<TypeDef typeDef={typeDef} />, ", "])
                      .slice(0, -1)}
                  </>
                </>
              )
              : <></>}
            <Punctuation classes="text-lg">
              {" {"}
            </Punctuation>
          </h3>
          {yield* TSInterfaceDef({ interfaceDef: node.interfaceDef })}
          <Punctuation classes="text-lg">{"}"}</Punctuation>
        </header>
      );
    case "variable":
      return (
        <header>
          <h3 class="inline-block">
            <TSVariableDef variableDef={node.variableDef} name={node.name} />
          </h3>
        </header>
      );
    case "typeAlias":
      return (
        <header>
          <h3 class="inline-block">
            <Keyword>{"type "}</Keyword>
            {node.name}
            <Operator>{" = "}</Operator>
            <TypeDef typeDef={node.typeAliasDef.tsType} />
          </h3>
        </header>
      );
    default:
      return (
        <header>
          <h3 class="inline-block">
            <Keyword>{node.kind}</Keyword> {node.name}
          </h3>
        </header>
      );
  }
}

function TSVariableDef({
  variableDef,
  name,
}: {
  variableDef: VariableDef;
  name: string;
}) {
  return (
    <>
      <Keyword>{variableDef.kind}</Keyword> {name}
      <Operator>:</Operator>{" "}
      {variableDef.tsType ? <TypeDef typeDef={variableDef.tsType} /> : <></>}
    </>
  );
}

function* TSClassDef({
  classDef,
}: { classDef: ClassDef }) {
  const elements: JSXElement[] = [];

  for (const property of classDef.properties) {
    const jsDoc = property.jsDoc?.doc
      ? yield* useMarkdown(property.jsDoc?.doc)
      : undefined;
    elements.push(
      <li class={`text-base ${jsDoc ? "my-0 border-l-2 first:-mt-5" : "my-1"}`}>
        {jsDoc ? <div class="-mb-5">{jsDoc}</div> : <></>}
        {property.name}
        <Optional optional={property.optional} />
        <Operator>{": "}</Operator>
        {property.tsType ? <TypeDef typeDef={property.tsType} /> : <></>}
        <Punctuation>{";"}</Punctuation>
      </li>,
    );
  }

  for (const method of classDef.methods) {
    const jsDoc = yield* call(function* (): Operation<JSXElement | undefined> {
      if (method.jsDoc?.doc) {
        const mod = yield* useMDX(method.jsDoc?.doc);
        return mod.default();
      }
    });
    elements.push(
      <li class={`${jsDoc ? "my-0 border-l-2 first:-mt-5" : "my-1"}`}>
        {jsDoc ? <div>{jsDoc}</div> : <></>}
        <span class="font-bold">{method.name}</span>
        <Optional optional={method.optional} />
        <Punctuation>(</Punctuation>
        <FunctionParams params={method.functionDef.params} />
        <Punctuation>)</Punctuation>
        <Operator>{": "}</Operator>
        {method.functionDef.returnType
          ? <TypeDef typeDef={method.functionDef.returnType} />
          : <></>}
        <Punctuation>{";"}</Punctuation>
      </li>,
    );
  }

  return <ul class="my-0 list-none pl-1">{elements}</ul>;
}

function* TSInterfaceDef({
  interfaceDef,
}: {
  interfaceDef: InterfaceDef;
}): Operation<JSXElement> {
  const elements: JSXElement[] = [];
  for (const property of interfaceDef.properties) {
    const jsDoc = property.jsDoc?.doc
      ? yield* useMarkdown(property.jsDoc?.doc)
      : undefined;
    elements.push(
      <li class={`${jsDoc ? "my-0 border-l-2 first:-mt-5" : "my-1"}`}>
        {jsDoc ? <div class="-mb-5">{jsDoc}</div> : <></>}
        {property.name}
        <Optional optional={property.optional} />
        <Operator>{": "}</Operator>
        {property.tsType ? <TypeDef typeDef={property.tsType} /> : <></>}
        <Punctuation>{";"}</Punctuation>
      </li>,
    );
  }

  for (const method of interfaceDef.methods) {
    const jsDoc = yield* call(function* (): Operation<JSXElement | undefined> {
      if (method.jsDoc?.doc) {
        const mod = yield* useMDX(method.jsDoc?.doc);
        return mod.default();
      }
    });
    elements.push(
      <li class={`${jsDoc ? "my-0 border-l-2 first:-mt-5" : "my-1"}`}>
        {jsDoc ? <div class="-mb-5">{jsDoc}</div> : <></>}
        {method.name}
        <Optional optional={method.optional} />
        <Punctuation>(</Punctuation>
        <FunctionParams params={method.params} />
        <Punctuation>)</Punctuation>
        <Operator>{": "}</Operator>
        {method.returnType ? <TypeDef typeDef={method.returnType} /> : <></>}
        <Punctuation>{";"}</Punctuation>
      </li>,
    );
  }

  return <ul class="my-0 list-none pl-1">{elements}</ul>;
}

function FunctionParams({ params }: { params: ParamDef[] }) {
  return (
    <>
      {params
        .flatMap((param) => [<TSParam param={param} />, ", "])
        .slice(0, -1)}
    </>
  );
}

function TSParam({ param }: { param: ParamDef }) {
  if (param.kind === "identifier") {
    return (
      <>
        {param.name}
        <Optional optional={param.optional} />
        <Operator>{": "}</Operator>
        {param.tsType ? <TypeDef typeDef={param.tsType} /> : <></>}
      </>
    );
  }
  return <></>;
}

export function TypeDef({ typeDef }: { typeDef: TsTypeDef }) {
  switch (typeDef.kind) {
    case "literal":
      switch (typeDef.literal.kind) {
        case "string":
          return <span class="token string">"{typeDef.repr}"</span>;
        case "number":
          return <span class="token number">{typeDef.repr}</span>;
        case "boolean":
          return <span class="token boolean">{typeDef.repr}</span>;
        case "bigInt":
          return <span class="token number">{typeDef.repr}</span>;
        default:
          // TODO(taras): implement template
          return <></>;
      }
    case "keyword":
      if (["number", "string", "boolean", "bigint"].includes(typeDef.keyword)) {
        return <Builtin>{typeDef.keyword}</Builtin>;
      } else {
        return <Keyword>{typeDef.keyword}</Keyword>;
      }
    case "typeRef":
      return <TypeRef typeRef={typeDef.typeRef} />;
    case "union":
      return <TypeDefUnion union={typeDef.union} />;
    case "fnOrConstructor":
      if (typeDef.fnOrConstructor.constructor) {
        // TODO(taras): implement
        return <></>;
      } else {
        return (
          <>
            <Punctuation>(</Punctuation>
            <FunctionParams params={typeDef.fnOrConstructor.params} />
            <Punctuation>)</Punctuation>
            <Operator>{" => "}</Operator>
            <TypeDef typeDef={typeDef.fnOrConstructor.tsType} />
          </>
        );
      }
    case "indexedAccess":
      return (
        <>
          <TypeDef typeDef={typeDef.indexedAccess.objType} />
          <Punctuation>[</Punctuation>
          <TypeDef typeDef={typeDef.indexedAccess.indexType} />
          <Punctuation>]</Punctuation>
        </>
      );
    case "tuple":
      return <span class="token">[]</span>;
    case "array":
      return (
        <>
          <TypeDef typeDef={typeDef.array} />
          []
        </>
      );
  }
  return <></>;
}

function TypeDefUnion({ union }: { union: TsTypeDef[] }) {
  return (
    <>
      {union.flatMap((typeDef, index) => (
        <>
          <TypeDef typeDef={typeDef} />
          {index + 1 < union.length ? <Operator>{" | "}</Operator> : <></>}
        </>
      ))}
    </>
  );
}

function TypeRef({ typeRef }: { typeRef: TsTypeRefDef }) {
  return (
    <>
      {typeRef.typeName}
      {typeRef.typeParams
        ? (
          <>
            <Operator>{"<"}</Operator>
            <>
              {typeRef.typeParams
                .flatMap((tp) => [<TypeDef typeDef={tp} />, ", "])
                .slice(0, -1)}
            </>
            <Operator>{">"}</Operator>
          </>
        )
        : <></>}
    </>
  );
}

function InterfaceTypeParams({
  typeParams,
}: {
  typeParams: TsTypeParamDef[];
}): JSXElement {
  return (
    <>
      <Operator>{"<"}</Operator>
      <>
        {typeParams
          .flatMap((param) => {
            return [
              <>
                {param.name}
                <Keyword>{" extends "}</Keyword>
                {param.constraint
                  ? <TypeDef typeDef={param.constraint} />
                  : <></>}
                {param.default
                  ? (
                    <>
                      <Keyword>{" = "}</Keyword>
                      <TypeDef typeDef={param.default} />
                    </>
                  )
                  : <></>}
              </>,
              ", ",
            ];
          })
          .slice(0, -1)}
      </>
      <Operator>{">"}</Operator>
    </>
  );
}
