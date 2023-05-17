import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "html/jsx-runtime";
const frontmatter = {
  "id": "errors",
  "title": "Errors"
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
    pre: "pre",
    em: "em",
    img: "img"
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
            href: "#tasks-as-promises",
            children: "Tasks as Promises"
          })
        }), _jsx(_components.li, {
          className: "toc-item toc-item-h2",
          children: _jsx(_components.a, {
            className: "toc-link toc-link-h2",
            href: "#error-propagation",
            children: "Error propagation"
          })
        }), _jsx(_components.li, {
          className: "toc-item toc-item-h2",
          children: _jsx(_components.a, {
            className: "toc-link toc-link-h2",
            href: "#error-boundary",
            children: "Error boundary"
          })
        }), _jsx(_components.li, {
          className: "toc-item toc-item-h2",
          children: _jsx(_components.a, {
            className: "toc-link toc-link-h2",
            href: "#stack-traces",
            children: "Stack traces"
          })
        }), _jsx(_components.li, {
          className: "toc-item toc-item-h2",
          children: _jsx(_components.a, {
            className: "toc-link toc-link-h2",
            href: "#mainerror",
            children: "MainError"
          })
        })]
      })
    }), "\n", _jsx(_components.p, {
      children: "We have previously discussed how correctness and proper handling of failure\ncases is why we wrote Effection in the first place. In this chapter we will\ntake a more in-depth look at how Effection handles failures and how you can\nreact to failure conditions."
    }), "\n", _jsxs(_components.h2, {
      id: "tasks-as-promises",
      className: "group",
      children: ["Tasks as Promises", _jsx(_components.a, {
        className: "opacity-0 group-hover:opacity-100 after:content-['#']",
        href: "#tasks-as-promises",
        children: _jsx(_components.span, {
          className: "icon icon-link"
        })
      })]
    }), "\n", _jsxs(_components.p, {
      children: ["Every Effection operation runs within a Task, when you call ", _jsx(_components.code, {
        children: "run"
      }), " or use the\n", _jsx(_components.code, {
        children: "spawn"
      }), " operation, you create a task. For each ", _jsx(_components.code, {
        children: "yield"
      }), " point, Effecion creates\na task for you. Every Task evaluates to one of three possible states, the task\ncan either become ", _jsx(_components.code, {
        children: "completed"
      }), ", meaning it finished normally, or it can become\n", _jsx(_components.code, {
        children: "errored"
      }), " meaning the task itself or one of its descendants had an error\nthrown, or it can become ", _jsx(_components.code, {
        children: "halted"
      }), ", meaning that the evalutation of the task was\nstopped before it finished."]
    }), "\n", _jsxs(_components.p, {
      children: ["We have seen that tasks can act like a ", _jsx(_components.code, {
        children: "Promise"
      }), " and that this interface can\nbe used to integrate Effection code into promise based or async/await code:"]
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
            className: "token punctuation",
            children: "{"
          }), " run ", _jsx(_components.span, {
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
            children: "async"
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "function"
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "runExample"
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
          }), " value ", _jsx(_components.span, {
            className: "token operator",
            children: "="
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "await"
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "run"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
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
          children: ["    ", _jsx(_components.span, {
            className: "token keyword",
            children: "yield"
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "sleep"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token number",
            children: "1000"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ";"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["    ", _jsx(_components.span, {
            className: "token keyword",
            children: "return"
          }), " ", _jsx(_components.span, {
            className: "token string",
            children: '"world!"'
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ";"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["  ", _jsx(_components.span, {
            className: "token punctuation",
            children: "}"
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
            className: "token builtin",
            children: "console"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token function",
            children: "log"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token string",
            children: '"hello"'
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ","
          }), " value", _jsx(_components.span, {
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
    }), "\n", _jsxs(_components.p, {
      children: ["Tasks can also act like a ", _jsx(_components.a, {
        href: "/docs/guides/futures",
        children: "Future"
      }), ", which can be useful sometimes."]
    }), "\n", _jsx(_components.p, {
      children: "Of course if we throw an error inside of the task, then the task's promise\nalso becomes rejected:"
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
            className: "token punctuation",
            children: "{"
          }), " run ", _jsx(_components.span, {
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
            children: "async"
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "function"
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "runExample"
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
            children: "try"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "{"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["    ", _jsx(_components.span, {
            className: "token keyword",
            children: "await"
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "run"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
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
          children: ["      ", _jsx(_components.span, {
            className: "token keyword",
            children: "throw"
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "new"
          }), " ", _jsx(_components.span, {
            className: "token class-name",
            children: "Error"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token string",
            children: "'boom'"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ";"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["    ", _jsx(_components.span, {
            className: "token punctuation",
            children: "}"
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
            className: "token punctuation",
            children: "}"
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "catch"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), "err", _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "{"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["    ", _jsx(_components.span, {
            className: "token builtin",
            children: "console"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token function",
            children: "log"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token string",
            children: '"got error"'
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ","
          }), " err", _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), "message", _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), " ", _jsx(_components.span, {
            className: "token comment",
            children: '// => "got error boom"'
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
    }), "\n", _jsx(_components.p, {
      children: "When treating a task as a promise, if the task becomes halted, the promise is\nrejected with a special halt error:"
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
            className: "token punctuation",
            children: "{"
          }), " run ", _jsx(_components.span, {
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
            children: "async"
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "function"
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "runExample"
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
            children: "try"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "{"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["    ", _jsx(_components.span, {
            className: "token keyword",
            children: "let"
          }), " task ", _jsx(_components.span, {
            className: "token operator",
            children: "="
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "run"
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
          children: ["    task", _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token function",
            children: "halt"
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
          children: ["    ", _jsx(_components.span, {
            className: "token keyword",
            children: "await"
          }), " task", _jsx(_components.span, {
            className: "token punctuation",
            children: ";"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["  ", _jsx(_components.span, {
            className: "token punctuation",
            children: "}"
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "catch"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), "err", _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "{"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["    ", _jsx(_components.span, {
            className: "token builtin",
            children: "console"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token function",
            children: "log"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token string",
            children: '"got error"'
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ","
          }), " err", _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), "message", _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), " ", _jsx(_components.span, {
            className: "token comment",
            children: '// => "got error halted"'
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
      id: "error-propagation",
      className: "group",
      children: ["Error propagation", _jsx(_components.a, {
        className: "opacity-0 group-hover:opacity-100 after:content-['#']",
        href: "#error-propagation",
        children: _jsx(_components.span, {
          className: "icon icon-link"
        })
      })]
    }), "\n", _jsxs(_components.p, {
      children: ["One of the key principles of structured concurrency is that when a child fails,\nthe parent should fail as well. In Effection, when we spawn a task, that task\nbecomes linked to its parent. When the child task becomes ", _jsx(_components.code, {
        children: "errored"
      }), ", it will\nalso cause its parent to become ", _jsx(_components.code, {
        children: "errored"
      }), "."]
    }), "\n", _jsx(_components.p, {
      children: "This is similar to the intuition you've built up about how synchronous code\nworks: if an error is thrown in a function, that error propagates up the stack\nand causes the entire stack to fail, until someone catches the error."
    }), "\n", _jsxs(_components.p, {
      children: ["One of the innovations of async/await code over plain promises and callbacks,\nis that you can use regular error handling with ", _jsx(_components.code, {
        children: "try/catch"
      }), ", instead of using special\nerror handling constructs. This makes asynchronous code look and feel more like\nregular synchronous codes. The same is true in Effection, we can use ", _jsx(_components.code, {
        children: "try/catch"
      }), "\nto deal with errors."]
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
            className: "token punctuation",
            children: "{"
          }), " main", _jsx(_components.span, {
            className: "token punctuation",
            children: ","
          }), " sleep ", _jsx(_components.span, {
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
            children: "function"
          }), _jsx(_components.span, {
            className: "token operator",
            children: "*"
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "tickingBomb"
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
            children: "yield"
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "sleep"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token number",
            children: "1000"
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
            children: "throw"
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "new"
          }), " ", _jsx(_components.span, {
            className: "token class-name",
            children: "Error"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token string",
            children: "'boom'"
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
            className: "token function",
            children: "main"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
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
            children: "try"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "{"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["    ", _jsx(_components.span, {
            className: "token keyword",
            children: "yield"
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "tickingBomb"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["  ", _jsx(_components.span, {
            className: "token punctuation",
            children: "}"
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "catch"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), "err", _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "{"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["    ", _jsx(_components.span, {
            className: "token builtin",
            children: "console"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token function",
            children: "log"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token string",
            children: '"it blew up:"'
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ","
          }), " err", _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), "message", _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ";"
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
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ";"
          }), "\n"]
        })]
      })
    }), "\n", _jsxs(_components.p, {
      children: ["However, note that something interesting happens when we instead ", _jsx(_components.code, {
        children: "spawn"
      }), " the\n", _jsx(_components.code, {
        children: "tickingBomb"
      }), " operation:"]
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
            className: "token punctuation",
            children: "{"
          }), " main ", _jsx(_components.span, {
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
        }), _jsxs(_components.span, {
          className: "code-line",
          children: [_jsx(_components.span, {
            className: "token keyword",
            children: "import"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "{"
          }), " tickingBomb ", _jsx(_components.span, {
            className: "token punctuation",
            children: "}"
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "from"
          }), " ", _jsx(_components.span, {
            className: "token string",
            children: "'./ticking-bomb'"
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
            className: "token function",
            children: "main"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
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
            children: "yield"
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "spawn"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token function",
            children: "tickingBomb"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
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
            children: "try"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "{"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["    ", _jsx(_components.span, {
            className: "token keyword",
            children: "yield"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ";"
          }), " ", _jsx(_components.span, {
            className: "token comment",
            children: "// sleep forever"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["  ", _jsx(_components.span, {
            className: "token punctuation",
            children: "}"
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "catch"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), "err", _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "{"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["    ", _jsx(_components.span, {
            className: "token builtin",
            children: "console"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token function",
            children: "log"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token string",
            children: '"it blew up:"'
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ","
          }), " err", _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), "message", _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ";"
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
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ";"
          }), "\n"]
        })]
      })
    }), "\n", _jsxs(_components.p, {
      children: ["You might be surprised that we do ", _jsx(_components.em, {
        children: "not"
      }), " enter the catch handler here! Instead,\nour entire main task just fails. This is by design! We are only allowed to\ncatch errors thrown by whatever we yield to directly, not by any spawned\nchildren or resources running in the background. This makes error handling more\npredictable, since our catch block will not receive errors from any background\ntask, we're better able to specify which errors we actually want to deal with."]
    }), "\n", _jsxs(_components.h2, {
      id: "error-boundary",
      className: "group",
      children: ["Error boundary", _jsx(_components.a, {
        className: "opacity-0 group-hover:opacity-100 after:content-['#']",
        href: "#error-boundary",
        children: _jsx(_components.span, {
          className: "icon icon-link"
        })
      })]
    }), "\n", _jsxs(_components.p, {
      children: ["If we do want to catch an error from a spawned task (or from a ", _jsx(_components.a, {
        href: "/docs/guides/resources",
        children: "Resource"
      }), ') then\nwe need to introduce an intermediate task which allows us to bring the error into\nthe foreground. We call this pattern an "error boundary":']
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
            className: "token punctuation",
            children: "{"
          }), " main ", _jsx(_components.span, {
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
        }), _jsxs(_components.span, {
          className: "code-line",
          children: [_jsx(_components.span, {
            className: "token keyword",
            children: "import"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "{"
          }), " tickingBomb ", _jsx(_components.span, {
            className: "token punctuation",
            children: "}"
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "from"
          }), " ", _jsx(_components.span, {
            className: "token string",
            children: "'./ticking-bomb'"
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
            className: "token function",
            children: "main"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
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
            children: "try"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "{"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["    ", _jsx(_components.span, {
            className: "token keyword",
            children: "yield"
          }), " ", _jsx(_components.span, {
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
          }), " ", _jsx(_components.span, {
            className: "token comment",
            children: "// error boundary"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["      ", _jsx(_components.span, {
            className: "token keyword",
            children: "yield"
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "spawn"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token function",
            children: "tickingBomb"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ";"
          }), " ", _jsx(_components.span, {
            className: "token comment",
            children: "// will blow up in the background"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["      ", _jsx(_components.span, {
            className: "token keyword",
            children: "yield"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ";"
          }), " ", _jsx(_components.span, {
            className: "token comment",
            children: "// sleep forever"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["    ", _jsx(_components.span, {
            className: "token punctuation",
            children: "}"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["  ", _jsx(_components.span, {
            className: "token punctuation",
            children: "}"
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "catch"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), "err", _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "{"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["    ", _jsx(_components.span, {
            className: "token builtin",
            children: "console"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token function",
            children: "log"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token string",
            children: '"it blew up:"'
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ","
          }), " err", _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), "message", _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ";"
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
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ";"
          }), "\n"]
        })]
      })
    }), "\n", _jsxs(_components.h2, {
      id: "stack-traces",
      className: "group",
      children: ["Stack traces", _jsx(_components.a, {
        className: "opacity-0 group-hover:opacity-100 after:content-['#']",
        href: "#stack-traces",
        children: _jsx(_components.span, {
          className: "icon icon-link"
        })
      })]
    }), "\n", _jsxs(_components.p, {
      children: ["We have already seen using the ", _jsx(_components.code, {
        children: "main"
      }), " entry point to run our code when we build\nour entire application using Effection. One advantage of ", _jsx(_components.code, {
        children: "main"
      }), " over ", _jsx(_components.code, {
        children: "run"
      }), " is that\nwhen our operation fails, we exit the program with a proper failure exit code. Additionally\n", _jsx(_components.code, {
        children: "main"
      }), " prints a nicely formatted stack trace for us on failure:"]
    }), "\n", _jsx(_components.p, {
      children: _jsx(_components.img, {
        src: "/images/no-main-error.png",
        alt: "Error when using main"
      })
    }), "\n", _jsxs(_components.p, {
      children: ['We can see that in addition to the regular stack trace of our program, we also\nreceive an "Effection trace". This gives some context on where the error\noccurred within the structure of our Effection code. To make this as useful as\npossible, you can apply ', _jsx(_components.a, {
        href: "/docs/guides/labels",
        children: "Labels"
      }), " to your operations, which will be shown in\nthis trace."]
    }), "\n", _jsxs(_components.h2, {
      id: "mainerror",
      className: "group",
      children: ["MainError", _jsx(_components.a, {
        className: "opacity-0 group-hover:opacity-100 after:content-['#']",
        href: "#mainerror",
        children: _jsx(_components.span, {
          className: "icon icon-link"
        })
      })]
    }), "\n", _jsx(_components.p, {
      children: "There are cases where we want the program to exit, but it might be due to user\nerror, rather than an internal failure. In this case we might not want to print\na stack trace. For example, if we're building a CLI which reads a file, and the\nfile that the user has specified does not exist, then we might want to show a\nmessage to the user, but there is no need to show a stack trace. Additonally,\nwe might want to set a specific exit code."
    }), "\n", _jsxs(_components.p, {
      children: ["Effection ships with a special error type, ", _jsx(_components.code, {
        children: "MainError"
      }), ", which works together\nwith ", _jsx(_components.code, {
        children: "main"
      }), " for these types of situations:"]
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
            className: "token punctuation",
            children: "{"
          }), " main", _jsx(_components.span, {
            className: "token punctuation",
            children: ","
          }), " MainError ", _jsx(_components.span, {
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
        }), _jsxs(_components.span, {
          className: "code-line",
          children: [_jsx(_components.span, {
            className: "token keyword",
            children: "import"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "{"
          }), " promises ", _jsx(_components.span, {
            className: "token keyword",
            children: "as"
          }), " fs ", _jsx(_components.span, {
            className: "token punctuation",
            children: "}"
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "from"
          }), " ", _jsx(_components.span, {
            className: "token string",
            children: "'fs'"
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
            children: "const"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "{"
          }), " readFile ", _jsx(_components.span, {
            className: "token punctuation",
            children: "}"
          }), " ", _jsx(_components.span, {
            className: "token operator",
            children: "="
          }), " fs", _jsx(_components.span, {
            className: "token punctuation",
            children: ";"
          }), "\n"]
        }), _jsx(_components.span, {
          className: "code-line",
          children: "\n"
        }), _jsxs(_components.span, {
          className: "code-line",
          children: [_jsx(_components.span, {
            className: "token function",
            children: "main"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
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
          }), " fileName ", _jsx(_components.span, {
            className: "token operator",
            children: "="
          }), " process", _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), "argv", _jsx(_components.span, {
            className: "token punctuation",
            children: "["
          }), _jsx(_components.span, {
            className: "token number",
            children: "2"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "]"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ";"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["  ", _jsx(_components.span, {
            className: "token keyword",
            children: "try"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "{"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["    ", _jsx(_components.span, {
            className: "token keyword",
            children: "let"
          }), " content ", _jsx(_components.span, {
            className: "token operator",
            children: "="
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "yield"
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "readFile"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), "fileName", _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ";"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["    ", _jsx(_components.span, {
            className: "token builtin",
            children: "console"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token function",
            children: "log"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), "content", _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token function",
            children: "reverse"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token function",
            children: "toString"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
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
            className: "token punctuation",
            children: "}"
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "catch"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), "err", _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "{"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["    ", _jsx(_components.span, {
            className: "token keyword",
            children: "throw"
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "new"
          }), " ", _jsx(_components.span, {
            className: "token class-name",
            children: "MainError"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "{"
          }), " message", _jsx(_components.span, {
            className: "token operator",
            children: ":"
          }), " ", _jsxs(_components.span, {
            className: "token template-string",
            children: [_jsx(_components.span, {
              className: "token template-punctuation string",
              children: "`"
            }), _jsx(_components.span, {
              className: "token string",
              children: "no such file "
            }), _jsxs(_components.span, {
              className: "token interpolation",
              children: [_jsx(_components.span, {
                className: "token interpolation-punctuation punctuation",
                children: "${"
              }), "fileName", _jsx(_components.span, {
                className: "token interpolation-punctuation punctuation",
                children: "}"
              })]
            }), _jsx(_components.span, {
              className: "token template-punctuation string",
              children: "`"
            })]
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ","
          }), " exitCode", _jsx(_components.span, {
            className: "token operator",
            children: ":"
          }), " ", _jsx(_components.span, {
            className: "token number",
            children: "200"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "}"
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
            className: "token punctuation",
            children: "}"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: [_jsx(_components.span, {
            className: "token punctuation",
            children: "}"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ";"
          }), "\n"]
        })]
      })
    }), "\n", _jsxs(_components.p, {
      children: ["When using ", _jsx(_components.code, {
        children: "MainError"
      }), " the stack trace will not be printed and the exit code\nspecified in the error will be used. This is what it looks like when we try to\nread a file which does not exist:"]
    }), "\n", _jsx(_components.p, {
      children: _jsx(_components.img, {
        src: "/images/main-error.png",
        alt: "Using main error"
      })
    })]
  });
}
function MDXContent(props = {}) {
  const { wrapper: MDXLayout } = props.components || {};
  return MDXLayout ? _jsx(MDXLayout, Object.assign({}, props, {
    children: _jsx(_createMdxContent, props)
  })) : _createMdxContent(props);
}
var errors_default = MDXContent;
export {
  errors_default as default,
  frontmatter
};
