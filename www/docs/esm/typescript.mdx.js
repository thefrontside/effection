import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "html/jsx-runtime";
const frontmatter = {
  "id": "typescript",
  "title": "TypeScript"
};
function _createMdxContent(props) {
  const _components = Object.assign({
    nav: "nav",
    ol: "ol",
    li: "li",
    a: "a",
    p: "p",
    h2: "h2",
    span: "span",
    code: "code",
    strong: "strong",
    pre: "pre",
    h3: "h3",
    em: "em",
    blockquote: "blockquote"
  }, props.components);
  return _jsxs(_Fragment, {
    children: [_jsx(_components.nav, {
      className: "fixed top-0 right-0",
      children: _jsxs(_components.ol, {
        className: "toc-level toc-level-1",
        children: [_jsx(_components.li, {
          className: "toc-item toc-item-h2",
          children: _jsx(_components.a, {
            className: "toc-link toc-link-h2",
            href: "#operations",
            children: "Operations"
          })
        }), _jsxs(_components.li, {
          className: "toc-item toc-item-h2",
          children: [_jsx(_components.a, {
            className: "toc-link toc-link-h2",
            href: "#generators",
            children: "Generators"
          }), _jsxs(_components.ol, {
            className: "toc-level toc-level-2",
            children: [_jsx(_components.li, {
              className: "toc-item toc-item-h3",
              children: _jsx(_components.a, {
                className: "toc-link toc-link-h3",
                href: "#manual-annotation",
                children: "Manual Annotation"
              })
            }), _jsx(_components.li, {
              className: "toc-item toc-item-h3",
              children: _jsx(_components.a, {
                className: "toc-link toc-link-h3",
                href: "#wrapper-functions",
                children: "Wrapper Functions"
              })
            }), _jsx(_components.li, {
              className: "toc-item toc-item-h3",
              children: _jsx(_components.a, {
                className: "toc-link toc-link-h3",
                href: "#summary",
                children: "Summary"
              })
            })]
          })]
        })]
      })
    }), "\n", _jsx(_components.p, {
      children: "Effection is written in TypeScript and comes bundled with its own type\ndefinitions. Effection doesn't require any special setup to use in a\nTypeScript project, but there are some TypeScript specific\nidiosyncrasies to keep in mind. This section describes these\nidiosyncrasies and what you can do to make development experience of\nusing Effection in your TypeScript project as painless as possible."
    }), "\n", _jsxs(_components.h2, {
      id: "operations",
      className: "group",
      children: ["Operations", _jsx(_components.a, {
        className: "opacity-0 group-hover:opacity-100 after:content-['#']",
        href: "#operations",
        children: _jsx(_components.span, {
          className: "icon icon-link"
        })
      })]
    }), "\n", _jsxs(_components.p, {
      children: ["There are [many different kinds of operations][operations] in\nEffection, but wherever possible, you should just refer to the\n", _jsx(_components.code, {
        children: "Operation"
      }), " type which encompasses them all. After all, the point of\nan operation is to produce a value. How it produces that value is\nreally an implementation detail that consuming code should not be\nconcerned with. Note in particular that the return type of a generator\nfunction whose result is of type ", _jsx(_components.code, {
        children: "T"
      }), " should be ", _jsx(_components.code, {
        children: "Operation<T>"
      }), "."]
    }), "\n", _jsx(_components.p, {
      children: _jsx(_components.strong, {
        children: "Good"
      })
    }), "\n", _jsx(_components.pre, {
      className: "language-ts",
      children: _jsxs(_components.code, {
        className: "language-ts code-highlight",
        children: [_jsxs(_components.span, {
          className: "code-line",
          children: [_jsx(_components.span, {
            className: "token keyword",
            children: "import"
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "type"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "{"
          }), " Operation ", _jsx(_components.span, {
            className: "token punctuation",
            children: "}"
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "from"
          }), " ", _jsx(_components.span, {
            className: "token string",
            children: "'effection'"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ";"
          }), "\n"]
        }), _jsx(_components.span, {
          className: "code-line",
          children: "\n"
        }), _jsxs(_components.span, {
          className: "code-line",
          children: [_jsx(_components.span, {
            className: "token keyword",
            children: "export"
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "function"
          }), _jsx(_components.span, {
            className: "token operator",
            children: "*"
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "generator"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), _jsx(_components.span, {
            className: "token operator",
            children: ":"
          }), " Operation", _jsx(_components.span, {
            className: "token operator",
            children: "<"
          }), _jsx(_components.span, {
            className: "token builtin",
            children: "boolean"
          }), _jsx(_components.span, {
            className: "token operator",
            children: ">"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "{"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: [" ", _jsx(_components.span, {
            className: "token keyword",
            children: "return"
          }), " ", _jsx(_components.span, {
            className: "token boolean",
            children: "true"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ";"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: [_jsx(_components.span, {
            className: "token punctuation",
            children: "}"
          }), "\n"]
        }), _jsx(_components.span, {
          className: "code-line",
          children: "\n"
        }), _jsxs(_components.span, {
          className: "code-line",
          children: [_jsx(_components.span, {
            className: "token keyword",
            children: "export"
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "function"
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "future"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), _jsx(_components.span, {
            className: "token operator",
            children: ":"
          }), " Operation", _jsx(_components.span, {
            className: "token operator",
            children: "<"
          }), _jsx(_components.span, {
            className: "token builtin",
            children: "boolean"
          }), _jsx(_components.span, {
            className: "token operator",
            children: ">"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "{"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["  ", _jsx(_components.span, {
            className: "token keyword",
            children: "return"
          }), " Future", _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token function",
            children: "resolve"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token boolean",
            children: "true"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ";"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: [_jsx(_components.span, {
            className: "token punctuation",
            children: "}"
          }), "\n"]
        }), _jsx(_components.span, {
          className: "code-line",
          children: "\n"
        }), _jsxs(_components.span, {
          className: "code-line",
          children: [_jsx(_components.span, {
            className: "token keyword",
            children: "export"
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "async"
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "function"
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "promise"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), _jsx(_components.span, {
            className: "token operator",
            children: ":"
          }), " Operation", _jsx(_components.span, {
            className: "token operator",
            children: "<"
          }), _jsx(_components.span, {
            className: "token builtin",
            children: "string"
          }), _jsx(_components.span, {
            className: "token operator",
            children: ">"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "{"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["  ", _jsx(_components.span, {
            className: "token keyword",
            children: "return"
          }), " ", _jsx(_components.span, {
            className: "token string",
            children: '"hello"'
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ";"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: [_jsx(_components.span, {
            className: "token punctuation",
            children: "}"
          }), "\n"]
        }), _jsx(_components.span, {
          className: "code-line",
          children: "\n"
        }), _jsxs(_components.span, {
          className: "code-line",
          children: [_jsx(_components.span, {
            className: "token keyword",
            children: "export"
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "function"
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "resource"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), _jsx(_components.span, {
            className: "token operator",
            children: ":"
          }), " Operation", _jsx(_components.span, {
            className: "token operator",
            children: "<"
          }), _jsx(_components.span, {
            className: "token builtin",
            children: "number"
          }), _jsx(_components.span, {
            className: "token operator",
            children: ">"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "{"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["  ", _jsx(_components.span, {
            className: "token keyword",
            children: "return"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "{"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["    name", _jsx(_components.span, {
            className: "token operator",
            children: ":"
          }), " ", _jsx(_components.span, {
            className: "token string",
            children: '"true"'
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ","
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["    ", _jsx(_components.span, {
            className: "token operator",
            children: "*"
          }), _jsx(_components.span, {
            className: "token function",
            children: "init"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "{"
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "return"
          }), " ", _jsx(_components.span, {
            className: "token number",
            children: "42"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ";"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "}"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["  ", _jsx(_components.span, {
            className: "token punctuation",
            children: "}"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: [_jsx(_components.span, {
            className: "token punctuation",
            children: "}"
          }), "\n"]
        })]
      })
    }), "\n", _jsxs(_components.p, {
      children: [`However, often your IDE will suggest or autocomplete a type for your
operation that is more "raw" or low level, and while that may satisfy the
minum requirement for typechecking, It's best to correct them to the simple
`, _jsx(_components.code, {
        children: "Operation<T>"
      }), " type which will work in all cases, and will be forwards\ncompatible should you decide to change the implementation of your operation\nin the future."]
    }), "\n", _jsx(_components.p, {
      children: _jsx(_components.strong, {
        children: "Bad"
      })
    }), "\n", _jsx(_components.pre, {
      className: "language-typescript",
      children: _jsxs(_components.code, {
        className: "language-typescript code-highlight",
        children: [_jsxs(_components.span, {
          className: "code-line",
          children: [_jsx(_components.span, {
            className: "token keyword",
            children: "import"
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "type"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "{"
          }), " OperationIterator", _jsx(_components.span, {
            className: "token punctuation",
            children: ","
          }), " Resource", _jsx(_components.span, {
            className: "token punctuation",
            children: ","
          }), " Future ", _jsx(_components.span, {
            className: "token punctuation",
            children: "}"
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "from"
          }), " ", _jsx(_components.span, {
            className: "token string",
            children: "'effection'"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ";"
          }), "\n"]
        }), _jsx(_components.span, {
          className: "code-line",
          children: "\n"
        }), _jsxs(_components.span, {
          className: "code-line",
          children: [_jsx(_components.span, {
            className: "token keyword",
            children: "export"
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "function"
          }), _jsx(_components.span, {
            className: "token operator",
            children: "*"
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "iterator"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), _jsx(_components.span, {
            className: "token operator",
            children: ":"
          }), " OperationIterator", _jsx(_components.span, {
            className: "token operator",
            children: "<"
          }), _jsx(_components.span, {
            className: "token builtin",
            children: "boolean"
          }), _jsx(_components.span, {
            className: "token operator",
            children: ">"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "{"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["  ", _jsx(_components.span, {
            className: "token keyword",
            children: "return"
          }), " ", _jsx(_components.span, {
            className: "token boolean",
            children: "true"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ";"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: [_jsx(_components.span, {
            className: "token punctuation",
            children: "}"
          }), "\n"]
        }), _jsx(_components.span, {
          className: "code-line",
          children: "\n"
        }), _jsxs(_components.span, {
          className: "code-line",
          children: [_jsx(_components.span, {
            className: "token keyword",
            children: "export"
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "function"
          }), _jsx(_components.span, {
            className: "token operator",
            children: "*"
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "generator"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), _jsx(_components.span, {
            className: "token operator",
            children: ":"
          }), " Generator", _jsx(_components.span, {
            className: "token operator",
            children: "<"
          }), _jsx(_components.span, {
            className: "token builtin",
            children: "any"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ","
          }), " ", _jsx(_components.span, {
            className: "token builtin",
            children: "boolean"
          }), _jsx(_components.span, {
            className: "token operator",
            children: ">"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "{"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["  ", _jsx(_components.span, {
            className: "token keyword",
            children: "return"
          }), " ", _jsx(_components.span, {
            className: "token boolean",
            children: "true"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ";"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: [_jsx(_components.span, {
            className: "token punctuation",
            children: "}"
          }), "\n"]
        }), _jsx(_components.span, {
          className: "code-line",
          children: "\n"
        }), _jsxs(_components.span, {
          className: "code-line",
          children: [_jsx(_components.span, {
            className: "token keyword",
            children: "export"
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "function"
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "future"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), _jsx(_components.span, {
            className: "token operator",
            children: ":"
          }), " Future", _jsx(_components.span, {
            className: "token operator",
            children: "<"
          }), _jsx(_components.span, {
            className: "token builtin",
            children: "boolean"
          }), _jsx(_components.span, {
            className: "token operator",
            children: ">"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "{"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["  ", _jsx(_components.span, {
            className: "token keyword",
            children: "return"
          }), " Future", _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token function",
            children: "resolve"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token boolean",
            children: "true"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ";"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: [_jsx(_components.span, {
            className: "token punctuation",
            children: "}"
          }), "\n"]
        }), _jsx(_components.span, {
          className: "code-line",
          children: "\n"
        }), _jsxs(_components.span, {
          className: "code-line",
          children: [_jsx(_components.span, {
            className: "token keyword",
            children: "export"
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "function"
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "resource"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), _jsx(_components.span, {
            className: "token operator",
            children: ":"
          }), " Resource", _jsx(_components.span, {
            className: "token operator",
            children: "<"
          }), _jsx(_components.span, {
            className: "token builtin",
            children: "number"
          }), _jsx(_components.span, {
            className: "token operator",
            children: ">"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "{"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["  ", _jsx(_components.span, {
            className: "token keyword",
            children: "return"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "{"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["    name", _jsx(_components.span, {
            className: "token operator",
            children: ":"
          }), " ", _jsx(_components.span, {
            className: "token string",
            children: '"Life the Universe and Everything"'
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ","
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["    ", _jsx(_components.span, {
            className: "token operator",
            children: "*"
          }), _jsx(_components.span, {
            className: "token function",
            children: "init"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "{"
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "return"
          }), " ", _jsx(_components.span, {
            className: "token number",
            children: "42"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ";"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "}"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["  ", _jsx(_components.span, {
            className: "token punctuation",
            children: "}"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: [_jsx(_components.span, {
            className: "token punctuation",
            children: "}"
          }), "\n"]
        })]
      })
    }), "\n", _jsxs(_components.h2, {
      id: "generators",
      className: "group",
      children: ["Generators", _jsx(_components.a, {
        className: "opacity-0 group-hover:opacity-100 after:content-['#']",
        href: "#generators",
        children: _jsx(_components.span, {
          className: "icon icon-link"
        })
      })]
    }), "\n", _jsx(_components.p, {
      children: "Most Effection operations are written using JavaScript [generators][].\nHowever, because of [limitations in the way TypeScript understands\nthem][1], it is not currently possible for the type system to express\nthe relationship between the left and right hand side of a yield\nexpression."
    }), "\n", _jsx(_components.pre, {
      className: "language-typescript",
      children: _jsxs(_components.code, {
        className: "language-typescript code-highlight",
        children: [_jsxs(_components.span, {
          className: "code-line",
          children: [_jsx(_components.span, {
            className: "token keyword",
            children: "function"
          }), _jsx(_components.span, {
            className: "token operator",
            children: "*"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "{"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["  ", _jsx(_components.span, {
            className: "token comment",
            children: "// response is of type `any`"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["  ", _jsx(_components.span, {
            className: "token keyword",
            children: "let"
          }), " response ", _jsx(_components.span, {
            className: "token operator",
            children: "="
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "yield"
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "fetch"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token string",
            children: "'some.json'"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ";"
          }), "\n"]
        }), _jsx(_components.span, {
          className: "code-line",
          children: "\n"
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["  ", _jsx(_components.span, {
            className: "token comment",
            children: "// the generator return type is `any`"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["  ", _jsx(_components.span, {
            className: "token keyword",
            children: "return"
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "yield"
          }), " response", _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token function",
            children: "json"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ";"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: [_jsx(_components.span, {
            className: "token punctuation",
            children: "}"
          }), "\n"]
        })]
      })
    }), "\n", _jsx(_components.p, {
      children: "There are two ways to cope with this: manual type annotations, or wrapper\nfunctions."
    }), "\n", _jsxs(_components.h3, {
      id: "manual-annotation",
      className: "group",
      children: ["Manual Annotation", _jsx(_components.a, {
        className: "opacity-0 group-hover:opacity-100 after:content-['#']",
        href: "#manual-annotation",
        children: _jsx(_components.span, {
          className: "icon icon-link"
        })
      })]
    }), "\n", _jsx(_components.p, {
      children: "You can explicitly mark the type of the left hand side with its expected type.\nThis will let you work with intermediate values according to their type, so that\nif you try to call a method that does not exist, you will get a type error."
    }), "\n", _jsx(_components.pre, {
      className: "language-typescript",
      children: _jsxs(_components.code, {
        className: "language-typescript code-highlight",
        children: [_jsxs(_components.span, {
          className: "code-line",
          children: [_jsx(_components.span, {
            className: "token keyword",
            children: "function"
          }), _jsx(_components.span, {
            className: "token operator",
            children: "*"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "{"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["  ", _jsx(_components.span, {
            className: "token keyword",
            children: "let"
          }), " response", _jsx(_components.span, {
            className: "token operator",
            children: ":"
          }), " Response ", _jsx(_components.span, {
            className: "token operator",
            children: "="
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "yield"
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "fetch"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token string",
            children: "'some.json'"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ";"
          }), "\n"]
        }), _jsx(_components.span, {
          className: "code-line",
          children: "\n"
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["  ", _jsx(_components.span, {
            className: "token comment",
            children: "// type checking will fail unless `response` has"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["  ", _jsx(_components.span, {
            className: "token comment",
            children: "// a `.json()`. The inferred type of the operation"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["  ", _jsx(_components.span, {
            className: "token comment",
            children: "// is JSON"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["  ", _jsx(_components.span, {
            className: "token keyword",
            children: "return"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token keyword",
            children: "yield"
          }), " response", _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token function",
            children: "json"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "as"
          }), " ", _jsx(_components.span, {
            className: "token constant",
            children: "JSON"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: [_jsx(_components.span, {
            className: "token punctuation",
            children: "}"
          }), "\n"]
        })]
      })
    }), "\n", _jsx(_components.p, {
      children: "Of course, the compiler will happily accept whatever manual type you choose,\nand so you should take care to make certain that it is correct. The following\nwill result in an error at runtime."
    }), "\n", _jsx(_components.pre, {
      className: "language-typescript",
      children: _jsxs(_components.code, {
        className: "language-typescript code-highlight",
        children: [_jsxs(_components.span, {
          className: "code-line",
          children: [_jsx(_components.span, {
            className: "token keyword",
            children: "function"
          }), _jsx(_components.span, {
            className: "token operator",
            children: "*"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "{"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["  ", _jsx(_components.span, {
            className: "token keyword",
            children: "let"
          }), " response", _jsx(_components.span, {
            className: "token operator",
            children: ":"
          }), " Response ", _jsx(_components.span, {
            className: "token operator",
            children: "="
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "yield"
          }), " ", _jsx(_components.span, {
            className: "token builtin",
            children: "Promise"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token function",
            children: "resolve"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token string",
            children: '"wat"'
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ";"
          }), "\n"]
        }), _jsx(_components.span, {
          className: "code-line",
          children: "\n"
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["  ", _jsx(_components.span, {
            className: "token comment",
            children: '// TypeError: "wat".json is not a function'
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["  ", _jsx(_components.span, {
            className: "token keyword",
            children: "return"
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "yield"
          }), " response", _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token function",
            children: "json"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ";"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: [_jsx(_components.span, {
            className: "token punctuation",
            children: "}"
          }), "\n"]
        })]
      })
    }), "\n", _jsxs(_components.h3, {
      id: "wrapper-functions",
      className: "group",
      children: ["Wrapper Functions", _jsx(_components.a, {
        className: "opacity-0 group-hover:opacity-100 after:content-['#']",
        href: "#wrapper-functions",
        children: _jsx(_components.span, {
          className: "icon icon-link"
        })
      })]
    }), "\n", _jsxs(_components.p, {
      children: ["Another alternative is to consume each operation by delegating to a generator\nwhose only job is to produce the return value. You can then delegate to that\ngenerator using the [", _jsx(_components.code, {
        children: "yield*"
      }), "][yield*] syntax. For example, we can define an\n", _jsx(_components.code, {
        children: "unwrap()"
      }), " function like so:"]
    }), "\n", _jsx(_components.pre, {
      className: "language-typescript",
      children: _jsxs(_components.code, {
        className: "language-typescript code-highlight",
        children: [_jsxs(_components.span, {
          className: "code-line",
          children: [_jsx(_components.span, {
            className: "token keyword",
            children: "interface"
          }), " ", _jsxs(_components.span, {
            className: "token class-name",
            children: ["Unwrap", _jsx(_components.span, {
              className: "token operator",
              children: "<"
            }), _jsx(_components.span, {
              className: "token constant",
              children: "T"
            }), _jsx(_components.span, {
              className: "token operator",
              children: ">"
            })]
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "{"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["  ", _jsx(_components.span, {
            className: "token punctuation",
            children: "["
          }), "Symbol", _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), "iterator", _jsx(_components.span, {
            className: "token punctuation",
            children: "]"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), _jsx(_components.span, {
            className: "token operator",
            children: ":"
          }), " Iterator", _jsx(_components.span, {
            className: "token operator",
            children: "<"
          }), "Operation", _jsx(_components.span, {
            className: "token operator",
            children: "<"
          }), _jsx(_components.span, {
            className: "token constant",
            children: "T"
          }), _jsx(_components.span, {
            className: "token operator",
            children: ">"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ","
          }), " ", _jsx(_components.span, {
            className: "token constant",
            children: "T"
          }), _jsx(_components.span, {
            className: "token operator",
            children: ">>"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: [_jsx(_components.span, {
            className: "token punctuation",
            children: "}"
          }), "\n"]
        }), _jsx(_components.span, {
          className: "code-line",
          children: "\n"
        }), _jsxs(_components.span, {
          className: "code-line",
          children: [_jsx(_components.span, {
            className: "token keyword",
            children: "function"
          }), _jsx(_components.span, {
            className: "token operator",
            children: "*"
          }), " ", _jsxs(_components.span, {
            className: "token generic-function",
            children: [_jsx(_components.span, {
              className: "token function",
              children: "unwrap"
            }), _jsxs(_components.span, {
              className: "token generic class-name",
              children: [_jsx(_components.span, {
                className: "token operator",
                children: "<"
              }), _jsx(_components.span, {
                className: "token constant",
                children: "T"
              }), _jsx(_components.span, {
                className: "token operator",
                children: ">"
              })]
            })]
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), "operation", _jsx(_components.span, {
            className: "token operator",
            children: ":"
          }), " Operation", _jsx(_components.span, {
            className: "token operator",
            children: "<"
          }), _jsx(_components.span, {
            className: "token constant",
            children: "T"
          }), _jsx(_components.span, {
            className: "token operator",
            children: ">"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), _jsx(_components.span, {
            className: "token operator",
            children: ":"
          }), " Unwrap", _jsx(_components.span, {
            className: "token operator",
            children: "<"
          }), _jsx(_components.span, {
            className: "token constant",
            children: "T"
          }), _jsx(_components.span, {
            className: "token operator",
            children: ">"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "{"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["  ", _jsx(_components.span, {
            className: "token keyword",
            children: "let"
          }), " result ", _jsx(_components.span, {
            className: "token operator",
            children: "="
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "yield"
          }), " operation", _jsx(_components.span, {
            className: "token punctuation",
            children: ";"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["  ", _jsx(_components.span, {
            className: "token keyword",
            children: "return"
          }), " result ", _jsx(_components.span, {
            className: "token keyword",
            children: "as"
          }), " ", _jsx(_components.span, {
            className: "token constant",
            children: "T"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ";"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: [_jsx(_components.span, {
            className: "token punctuation",
            children: "}"
          }), "\n"]
        })]
      })
    }), "\n", _jsxs(_components.p, {
      children: ["Now we can use this ", _jsx(_components.code, {
        children: "unwrap()"
      }), " function to consume the value of the wrapped\noperation as a return value which TypeScript ", _jsx(_components.em, {
        children: "does"
      }), " understand. In the following\nexample, the static type of the ", _jsx(_components.code, {
        children: "response"
      }), " variable as well as the return type\nof the generator function are correctly inferred."]
    }), "\n", _jsx(_components.pre, {
      className: "language-typescript",
      children: _jsxs(_components.code, {
        className: "language-typescript code-highlight",
        children: [_jsxs(_components.span, {
          className: "code-line",
          children: [_jsx(_components.span, {
            className: "token keyword",
            children: "function"
          }), _jsx(_components.span, {
            className: "token operator",
            children: "*"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "{"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["  ", _jsx(_components.span, {
            className: "token keyword",
            children: "let"
          }), " response ", _jsx(_components.span, {
            className: "token operator",
            children: "="
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "yield"
          }), _jsx(_components.span, {
            className: "token operator",
            children: "*"
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "unwrap"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token function",
            children: "fetch"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token string",
            children: "'some.json'"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ";"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["  ", _jsx(_components.span, {
            className: "token keyword",
            children: "return"
          }), " response", _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token function",
            children: "json"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ";"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: [_jsx(_components.span, {
            className: "token punctuation",
            children: "}"
          }), "\n"]
        })]
      })
    }), "\n", _jsxs(_components.h3, {
      id: "summary",
      className: "group",
      children: ["Summary", _jsx(_components.a, {
        className: "opacity-0 group-hover:opacity-100 after:content-['#']",
        href: "#summary",
        children: _jsx(_components.span, {
          className: "icon icon-link"
        })
      })]
    }), "\n", _jsxs(_components.p, {
      children: ["Which strategy you choose is up to you as each comes with its own pros\nand cons. Manual Annotation is easy and works most of the time, but\ndoes suffer from the possibility of successfully type-checking code\nthat actually fails at runtime.  On the other hand, Wrapper Functions\ngive you 100% type correctness, but require the ceremony of wrapping\nevery single operation as well as requiring the use of the very\nesoteric [", _jsx(_components.code, {
        children: "yield*"
      }), "][yield*] syntax."]
    }), "\n", _jsx(_components.p, {
      children: "Of course, it's not ideal that these kind of trade-offs are required,\nbut we can surely hope that the TypeScript team will find a way to\nmake them a thing of the past. You can help bring this about sooner by taking\nto github and voicing your support for resolving [the primary issue][1], or\nupvoting one of the [proposed solutions][2]. It doesn't have to be an essay,\njust a simple, true statement like the following to let them know you're out\nthere:"
    }), "\n", _jsxs(_components.blockquote, {
      children: ["\n", _jsx(_components.p, {
        children: "I use JavaScript generators a lot to write more powerful code than would be possible otherwise. It would be amazing if TypeScript were able to typecheck programs like mine in a 100% hassle-free way."
      }), "\n"]
    }), "\n", _jsxs(_components.p, {
      children: ["You can make a difference!\n[operations]: ./tasks#operations\n[generators]: ./tasks#yield\n[yield*]: ", _jsx(_components.a, {
        href: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/yield",
        children: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/yield"
      }), "*\n[1]: ", _jsx(_components.a, {
        href: "https://github.com/microsoft/TypeScript/issues/32523",
        children: "https://github.com/microsoft/TypeScript/issues/32523"
      }), "\n[2]: ", _jsx(_components.a, {
        href: "https://github.com/microsoft/TypeScript/issues/43632",
        children: "https://github.com/microsoft/TypeScript/issues/43632"
      })]
    })]
  });
}
function MDXContent(props = {}) {
  const { wrapper: MDXLayout } = props.components || {};
  return MDXLayout ? _jsx(MDXLayout, Object.assign({}, props, {
    children: _jsx(_createMdxContent, props)
  })) : _createMdxContent(props);
}
var typescript_default = MDXContent;
export {
  typescript_default as default,
  frontmatter
};
