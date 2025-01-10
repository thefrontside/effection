import { JSXElement } from "revolution/jsx-runtime";
import { type Operation } from "effection";
import type {
  ClassDef,
  DocNode,
  InterfaceDef,
  ParamDef,
  TsTypeDef,
  TsTypeParamDef,
  TsTypeRefDef,
  VariableDef,
} from "jsr:@deno/doc@0.164.0/types";
import {
  Builtin,
  ClassName,
  Keyword,
  Operator,
  Optional,
  Punctuation,
} from "./tokens.tsx";
import { useMarkdown } from "../../hooks/use-markdown.tsx";

interface TypeProps {
  node: DocNode;
}

export function* Type(props: TypeProps): Operation<JSXElement> {
  const { node } = props;

  switch (node.kind) {
    case "function":
      return (
        <span class="language-ts code-highlight inline-block">
          {node.functionDef.isAsync ? (
            <Punctuation>{"async "}</Punctuation>
          ) : (
            <></>
          )}
          <Keyword>{node.kind}</Keyword>
          {node.functionDef.isGenerator ? (
            <Punctuation>*</Punctuation>
          ) : (
            <></>
          )}{" "}
          <span class="token function">{node.name}</span>
          {node.functionDef.typeParams.length > 0 ? (
            <InterfaceTypeParams typeParams={node.functionDef.typeParams} />
          ) : (
            <></>
          )}
          <Punctuation>(</Punctuation>
          <FunctionParams params={node.functionDef.params} />
          <Punctuation>)</Punctuation>:{" "}
          {node.functionDef.returnType ? (
            <TypeDef typeDef={node.functionDef.returnType} />
          ) : (
            <></>
          )}
        </span>
      );
    case "class":
      return (
        <span class="language-ts code-highlight inline-block">
          <Keyword>{node.kind}</Keyword> <ClassName>{node.name}</ClassName>
          {node.classDef.extends ? (
            <>
              <Keyword>{" extends "}</Keyword>
              <ClassName>{node.classDef.extends}</ClassName>
            </>
          ) : (
            <></>
          )}
          {node.classDef.implements ? (
            <>
              <Keyword>{" implements "}</Keyword>
              <>
                {node.classDef.implements
                  .flatMap((typeDef) => [<TypeDef typeDef={typeDef} />, ", "])
                  .slice(0, -1)}
              </>
            </>
          ) : (
            <></>
          )}
        </span>
      );
    case "interface":
      return (
        <span class="language-ts code-highlight inline-block">
          <Keyword>{node.kind}</Keyword> <ClassName>{node.name}</ClassName>
          {node.interfaceDef.typeParams.length > 0 ? (
            <InterfaceTypeParams typeParams={node.interfaceDef.typeParams} />
          ) : (
            <></>
          )}
          {node.interfaceDef.extends.length > 0 ? (
            <>
              <Keyword>{" extends "}</Keyword>
              <>
                {node.interfaceDef.extends
                  .flatMap((typeDef) => [<TypeDef typeDef={typeDef} />, ", "])
                  .slice(0, -1)}
              </>
            </>
          ) : (
            <></>
          )}
        </span>
      );
    case "variable":
      return (
        <span class="inline-block">
          <TSVariableDef variableDef={node.variableDef} name={node.name} />
        </span>
      );
    case "typeAlias":
      return (
        <span class="inline-block">
          <Keyword>{"type "}</Keyword>
          {node.name}
          <Operator>{" = "}</Operator>
          <TypeDef typeDef={node.typeAliasDef.tsType} />
        </span>
      );
    case "enum":
    case "import":
    case "moduleDoc":
    case "namespace":
    default:
      console.log("<Type> unimplemented", node.kind);
      return (
        <span class="inline-block">
          <Keyword>{node.kind}</Keyword> {node.name}
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

/**
 * This class definition that I'm no longer using in favour of definition generated
 * with markdown. I'm keeping it in case it comes in handy in the future.
 */
function* TSClassDef({ classDef }: { classDef: ClassDef }) {
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
    const jsDoc = method.jsDoc?.doc
      ? yield* useMarkdown(method.jsDoc?.doc)
      : undefined;
    elements.push(
      <li class={`${jsDoc ? "my-0 border-l-2 first:-mt-5" : "my-1"}`}>
        {jsDoc ? <div>{jsDoc}</div> : <></>}
        <span class="font-bold">{method.name}</span>
        <Optional optional={method.optional} />
        <Punctuation>(</Punctuation>
        <FunctionParams params={method.functionDef.params} />
        <Punctuation>)</Punctuation>
        <Operator>{": "}</Operator>
        {method.functionDef.returnType ? (
          <TypeDef typeDef={method.functionDef.returnType} />
        ) : (
          <></>
        )}
        <Punctuation>{";"}</Punctuation>
      </li>,
    );
  }

  return <ul class="my-0 list-none pl-1">{elements}</ul>;
}

/**
 * This interface definition that I'm no longer using in favour of definition generated
 * with markdown. I'm keeping it in case it comes in handy in the future.
 */
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
    const jsDoc = method.jsDoc?.doc
      ? yield* useMarkdown(method.jsDoc?.doc)
      : undefined;
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
    default:
      console.log("<TSParam> unimplemented:", param);
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
        console.log(`<TypeDef> unimplemeneted`, typeDef.fnOrConstructor);
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
      return (
        <>
          <Punctuation>[</Punctuation>
          <>
            {typeDef.tuple
              .flatMap((tp) => [<TypeDef typeDef={tp} />, ", "])
              .slice(0, -1)}
          </>
          <Punctuation>]</Punctuation>
        </>
      );
    case "array":
      return (
        <>
          <TypeDef typeDef={typeDef.array} />
          <Punctuation>[]</Punctuation>
        </>
      );
    case "typeOperator":
      return (
        <>
          <Keyword>{typeDef.typeOperator.operator}</Keyword>{" "}
          <TypeDef typeDef={typeDef.typeOperator.tsType} />
        </>
      );
    case "parenthesized": {
      return (
        <>
          <Punctuation>(</Punctuation>
          <TypeDef typeDef={typeDef.parenthesized} />
          <Punctuation>)</Punctuation>
        </>
      );
    }
    case "intersection": {
      return (
        <>
          {typeDef.intersection
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
          <TypeDef typeDef={typeDef.conditionalType.checkType} />
          <Keyword>{" extends "}</Keyword>
          <TypeDef typeDef={typeDef.conditionalType.extendsType} />
          <Operator>{" ? "}</Operator>
          <TypeDef typeDef={typeDef.conditionalType.trueType} />
          <Operator>{" : "}</Operator>
          <TypeDef typeDef={typeDef.conditionalType.falseType} />
        </>
      );
    }
    case "infer": {
      return (
        <>
          <Keyword>{"infer "}</Keyword>
          {typeDef.infer.typeParam.name}
        </>
      );
    }
    case "importType":
    case "mapped":
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
      {typeRef.typeParams ? (
        <>
          <Operator>{"<"}</Operator>
          <>
            {typeRef.typeParams
              .flatMap((tp) => [<TypeDef typeDef={tp} />, ", "])
              .slice(0, -1)}
          </>
          <Operator>{">"}</Operator>
        </>
      ) : (
        <></>
      )}
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
                {param.constraint ? (
                  <>
                    <Keyword>{" extends "}</Keyword>
                    <TypeDef typeDef={param.constraint} />
                  </>
                ) : (
                  <></>
                )}
                {param.default ? (
                  <>
                    <Keyword>{" = "}</Keyword>
                    <TypeDef typeDef={param.default} />
                  </>
                ) : (
                  <></>
                )}
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
