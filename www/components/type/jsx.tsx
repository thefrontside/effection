import { JSXElement } from "revolution/jsx-runtime";
import { type Operation } from "effection";
import type {
  Declaration,
  ParamDef,
  TsTypeDef,
  TsTypeParamDef,
  TsTypeRefDef,
  VariableDef,
} from "@deno/doc";
import type { SymbolInfo } from "../../hooks/use-deno-doc.tsx";
import {
  Builtin,
  ClassName,
  Keyword,
  Operator,
  Optional,
  Punctuation,
} from "./tokens.tsx";

interface TypeProps {
  declaration: Declaration;
  symbol: SymbolInfo;
}

export function* Type(props: TypeProps): Operation<JSXElement> {
  // `node` aliases the declaration; `symbol` supplies the name.
  let { declaration: node, symbol } = props;

  switch (node.kind) {
    case "function": {
      let typeParams = node.def.typeParams ?? [];
      return (
        <span class="language-ts code-highlight inline-block">
          {node.def.isAsync ? <Punctuation>{"async "}</Punctuation> : <></>}
          <Keyword>{node.kind}</Keyword>
          {node.def.isGenerator ? <Punctuation>*</Punctuation> : <></>}{" "}
          <span class="token function">{symbol.name}</span>
          {typeParams.length > 0
            ? <InterfaceTypeParams typeParams={typeParams} />
            : <></>}
          <Punctuation>(</Punctuation>
          <FunctionParams params={node.def.params} />
          <Punctuation>)</Punctuation>: {node.def.returnType
            ? <TypeDef typeDef={node.def.returnType} />
            : <></>}
        </span>
      );
    }
    case "class": {
      let impl /* implements */ = node.def.implements ?? [];
      return (
        <span class="language-ts code-highlight inline-block">
          <Keyword>{node.kind}</Keyword> <ClassName>{symbol.name}</ClassName>
          {node.def.extends
            ? (
              <>
                <Keyword>{" extends "}</Keyword>
                <ClassName>{node.def.extends}</ClassName>
              </>
            )
            : <></>}
          {impl.length > 0
            ? (
              <>
                <Keyword>{" implements "}</Keyword>
                <>
                  {impl
                    .flatMap((typeDef) => [<TypeDef typeDef={typeDef} />, ", "])
                    .slice(0, -1)}
                </>
              </>
            )
            : <></>}
        </span>
      );
    }
    case "interface": {
      let typeParams = node.def.typeParams ?? [];
      let ext = node.def.extends ?? [];
      return (
        <span class="language-ts code-highlight inline-block">
          <Keyword>{node.kind}</Keyword> <ClassName>{symbol.name}</ClassName>
          {typeParams.length > 0
            ? <InterfaceTypeParams typeParams={typeParams} />
            : <></>}
          {ext.length > 0
            ? (
              <>
                <Keyword>{" extends "}</Keyword>
                <>
                  {ext
                    .flatMap((typeDef) => [<TypeDef typeDef={typeDef} />, ", "])
                    .slice(0, -1)}
                </>
              </>
            )
            : <></>}
        </span>
      );
    }
    case "variable":
      return (
        <span class="inline-block">
          <TSVariableDef variableDef={node.def} name={symbol.name} />
        </span>
      );
    case "typeAlias":
      return (
        <span class="inline-block">
          <Keyword>{"type "}</Keyword>
          {symbol.name}
          <Operator>{" = "}</Operator>
          <TypeDef typeDef={node.def.tsType} />
        </span>
      );
    case "enum":
    case "namespace":
    default:
      console.log("<Type> unimplemented", node.kind);
      return (
        <span class="inline-block">
          <Keyword>{node.kind}</Keyword> {symbol.name}
        </span>
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
  switch (param.kind) {
    case "identifier": {
      return (
        <>
          {param.name}
          <Optional optional={param.optional} />
          <Operator>{": "}</Operator>
          {param.tsType ? <TypeDef typeDef={param.tsType} /> : <></>}
        </>
      );
    }
    case "rest": {
      return (
        <>
          <Operator>&hellip;</Operator>
          <TSParam param={param.arg} />
          {param.tsType ? <TypeDef typeDef={param.tsType} /> : <></>}
        </>
      );
    }
    case "assign": {
      return (
        <>
          <TSParam param={param.left} />
          <Operator>{" = "}</Operator>
          {param.tsType ? <TypeDef typeDef={param.tsType} /> : <></>}
          {param.right === "[UNSUPPORTED]" ? "{}" : <></>}
        </>
      );
    }
    default:
      console.log("<TSParam> unimplemented:", param);
  }
  return <></>;
}

export function TypeDef({ typeDef }: { typeDef: TsTypeDef }) {
  switch (typeDef.kind) {
    case "literal":
      switch (typeDef.value.kind) {
        case "string":
          return <span class="token string">"{typeDef.repr ?? ""}"</span>;
        case "number":
          return <span class="token number">{typeDef.repr ?? ""}</span>;
        case "boolean":
          return <span class="token boolean">{typeDef.repr ?? ""}</span>;
        case "bigInt":
          return <span class="token number">{typeDef.repr ?? ""}</span>;
        default:
          // TODO(taras): implement template
          return <></>;
      }
    case "keyword":
      if (["number", "string", "boolean", "bigint"].includes(typeDef.value)) {
        return <Builtin>{typeDef.value}</Builtin>;
      } else {
        return <Keyword>{typeDef.value}</Keyword>;
      }
    case "typeRef":
      return <TypeRef typeRef={typeDef.value} />;
    case "union":
      return <TypeDefUnion union={typeDef.value} />;
    case "fnOrConstructor":
      if (typeDef.value.constructor) {
        console.log(`<TypeDef> unimplemeneted`, typeDef.value);
        // TODO(taras): implement
        return <></>;
      } else {
        return (
          <>
            <Punctuation>(</Punctuation>
            <FunctionParams params={typeDef.value.params} />
            <Punctuation>)</Punctuation>
            <Operator>{" => "}</Operator>
            <TypeDef typeDef={typeDef.value.tsType} />
          </>
        );
      }
    case "indexedAccess":
      return (
        <>
          <TypeDef typeDef={typeDef.value.objType} />
          <Punctuation>[</Punctuation>
          <TypeDef typeDef={typeDef.value.indexType} />
          <Punctuation>]</Punctuation>
        </>
      );
    case "tuple":
      return (
        <>
          <Punctuation>[</Punctuation>
          <>
            {typeDef.value
              .flatMap((tp) => [<TypeDef typeDef={tp} />, ", "])
              .slice(0, -1)}
          </>
          <Punctuation>]</Punctuation>
        </>
      );
    case "array":
      return (
        <>
          <TypeDef typeDef={typeDef.value} />
          <Punctuation>[]</Punctuation>
        </>
      );
    case "typeOperator":
      return (
        <>
          <Keyword>{typeDef.value.operator}</Keyword>{" "}
          <TypeDef typeDef={typeDef.value.tsType} />
        </>
      );
    case "parenthesized": {
      return (
        <>
          <Punctuation>(</Punctuation>
          <TypeDef typeDef={typeDef.value} />
          <Punctuation>)</Punctuation>
        </>
      );
    }
    case "intersection": {
      return (
        <>
          {typeDef.value
            .flatMap((tp) => [
              <TypeDef typeDef={tp} />,
              <Operator>{" & "}</Operator>,
            ])
            .slice(0, -1)}
        </>
      );
    }
    case "typeLiteral": {
      // todo(taras): this is incomplete
      return (
        <>
          <Punctuation>&#123;</Punctuation>
          <Punctuation>&#125;</Punctuation>
        </>
      );
    }
    case "conditional": {
      return (
        <>
          <TypeDef typeDef={typeDef.value.checkType} />
          <Keyword>{" extends "}</Keyword>
          <TypeDef typeDef={typeDef.value.extendsType} />
          <Operator>{" ? "}</Operator>
          <TypeDef typeDef={typeDef.value.trueType} />
          <Operator>{" : "}</Operator>
          <TypeDef typeDef={typeDef.value.falseType} />
        </>
      );
    }
    case "infer": {
      return (
        <>
          <Keyword>{"infer "}</Keyword>
          {typeDef.value.typeParam.name}
        </>
      );
    }
    case "mapped":
      return (
        <>
          <Punctuation>[</Punctuation>
          {typeDef.value.typeParam.name}
          <Keyword>{` in `}</Keyword>
          {typeDef.value.typeParam.constraint
            ? <TypeDef typeDef={typeDef.value.typeParam.constraint} />
            : <></>}
          <Punctuation>]</Punctuation>
          <Operator>{" : "}</Operator>
          {typeDef.value.tsType
            ? <TypeDef typeDef={typeDef.value.tsType} />
            : <></>}
        </>
      );
    case "importType":
    case "optional":
    case "rest":
    case "this":
    case "typePredicate":
    case "typeQuery":
      console.log("<TypeDef> unimplemented", typeDef);
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
                {param.constraint
                  ? (
                    <>
                      <Keyword>{" extends "}</Keyword>
                      <TypeDef typeDef={param.constraint} />
                    </>
                  )
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
