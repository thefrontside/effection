import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "html/jsx-runtime";
const frontmatter = {
  "id": "tasks",
  "title": "Tasks and Operations"
};
function _createMdxContent(props) {
  const _components = Object.assign({
    nav: "nav",
    ol: "ol",
    li: "li",
    a: "a",
    p: "p",
    code: "code",
    pre: "pre",
    span: "span",
    h3: "h3",
    ul: "ul"
  }, props.components);
  return _jsxs(_Fragment, {
    children: [_jsx(_components.nav, {
      className: "fixed top-0 right-0",
      children: _jsxs(_components.ol, {
        className: "toc-level toc-level-1",
        children: [_jsx(_components.li, {
          className: "toc-item toc-item-h3",
          children: _jsx(_components.a, {
            className: "toc-link toc-link-h3",
            href: "#tasks",
            children: "Tasks"
          })
        }), _jsx(_components.li, {
          className: "toc-item toc-item-h3",
          children: _jsx(_components.a, {
            className: "toc-link toc-link-h3",
            href: "#operations",
            children: "Operations"
          })
        }), _jsx(_components.li, {
          className: "toc-item toc-item-h3",
          children: _jsx(_components.a, {
            className: "toc-link toc-link-h3",
            href: "#yield",
            children: "Yield"
          })
        })]
      })
    }), "\n", _jsxs(_components.p, {
      children: ["In the introduction, we saw how we can replace ", _jsx(_components.code, {
        children: "async/await"
      }), " with Effection.\nLet's break down a bit further what is going on!"]
    }), "\n", _jsxs(_components.p, {
      children: ["When you have an ", _jsx(_components.a, {
        href: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function",
        children: "async function"
      }), ", and you call this function, you get back a\n", _jsx(_components.a, {
        href: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise",
        children: "Promise"
      }), ". When you call a ", _jsx(_components.a, {
        href: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*",
        children: "Generator function"
      }), " you get back a ", _jsx(_components.a, {
        href: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator",
        children: "Generator"
      }), ". This\nis slightly different in that a Generator needs to be iterated in order to actually\ndo anything, while a Promise will make progress on its own."]
    }), "\n", _jsxs(_components.p, {
      children: ["If you run the following, it will print ", _jsx(_components.code, {
        children: "Hello World!"
      }), " to the console:"]
    }), "\n", _jsx(_components.pre, {
      className: "language-javascript",
      children: _jsxs(_components.code, {
        className: "language-javascript code-highlight",
        children: [_jsxs(_components.span, {
          className: "code-line",
          children: [_jsx(_components.span, {
            className: "token keyword",
            children: "async"
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "function"
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "sayHello"
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
            className: "token console class-name",
            children: "console"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token method function property-access",
            children: "log"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token string",
            children: '"Hello World!"'
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
            children: "sayHello"
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
        })]
      })
    }), "\n", _jsx(_components.p, {
      children: "But this will not print anything:"
    }), "\n", _jsx(_components.pre, {
      className: "language-javascript",
      children: _jsxs(_components.code, {
        className: "language-javascript code-highlight",
        children: [_jsxs(_components.span, {
          className: "code-line",
          children: [_jsx(_components.span, {
            className: "token keyword",
            children: "function"
          }), " ", _jsx(_components.span, {
            className: "token operator",
            children: "*"
          }), _jsx(_components.span, {
            className: "token function",
            children: "sayHello"
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
            className: "token console class-name",
            children: "console"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token method function property-access",
            children: "log"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token string",
            children: '"Hello World!"'
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
            children: "sayHello"
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
        })]
      })
    }), "\n", _jsxs(_components.h3, {
      id: "tasks",
      className: "group",
      children: ["Tasks", _jsx(_components.a, {
        className: "opacity-0 group-hover:opacity-100 after:content-['#']",
        href: "#tasks",
        children: _jsx(_components.span, {
          className: "icon icon-link"
        })
      })]
    }), "\n", _jsxs(_components.p, {
      children: ['We need something to "drive" the iteration of the Generator, and in Effection this is\na ', _jsx(_components.a, {
        href: "https://frontside.com/effection/api",
        children: _jsx(_components.code, {
          children: "Task"
        })
      }), ". Tasks have other responsibilities as well, as we'll see when we talk about\n", _jsx(_components.a, {
        href: "/docs/guides/spawn",
        children: _jsx(_components.code, {
          children: "spawn"
        })
      }), "."]
    }), "\n", _jsxs(_components.p, {
      children: ["We can use the ", _jsx(_components.a, {
        href: "https://frontside.com/effection/api",
        children: _jsx(_components.code, {
          children: "run"
        })
      }), " function from Effection which takes a generator function\nand returns a ", _jsx(_components.a, {
        href: "https://frontside.com/effection/api",
        children: _jsx(_components.code, {
          children: "Task"
        })
      }), "."]
    }), "\n", _jsx(_components.pre, {
      className: "language-javascript",
      children: _jsxs(_components.code, {
        className: "language-javascript code-highlight",
        children: [_jsxs(_components.span, {
          className: "code-line",
          children: [_jsx(_components.span, {
            className: "token keyword module",
            children: "import"
          }), " ", _jsxs(_components.span, {
            className: "token imports",
            children: [_jsx(_components.span, {
              className: "token punctuation",
              children: "{"
            }), " run ", _jsx(_components.span, {
              className: "token punctuation",
              children: "}"
            })]
          }), " ", _jsx(_components.span, {
            className: "token keyword module",
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
          children: ["  ", _jsx(_components.span, {
            className: "token console class-name",
            children: "console"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token method function property-access",
            children: "log"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token string",
            children: '"Hello World!"'
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
      children: ["You should see this print ", _jsx(_components.code, {
        children: "Hello World!"
      }), " to the console, as you'd expect."]
    }), "\n", _jsxs(_components.p, {
      children: ["The return value we get from ", _jsx(_components.code, {
        children: "run"
      }), " is a ", _jsx(_components.code, {
        children: "Task"
      }), ". A ", _jsx(_components.code, {
        children: "Task"
      }), " can act like a ", _jsx(_components.code, {
        children: "Promise"
      }), ", so\nwe can use it with ", _jsx(_components.code, {
        children: "await"
      }), ", to integrate Effection into existing ", _jsx(_components.code, {
        children: "async/await"
      }), " code,\nand we can also use ", _jsx(_components.code, {
        children: "catch"
      }), " to catch any errors the occurred in the task. There are\nalso some other things that tasks can do, for example they can spawn other tasks."]
    }), "\n", _jsx(_components.pre, {
      className: "language-javascript",
      children: _jsxs(_components.code, {
        className: "language-javascript code-highlight",
        children: [_jsxs(_components.span, {
          className: "code-line",
          children: [_jsx(_components.span, {
            className: "token keyword module",
            children: "import"
          }), " ", _jsxs(_components.span, {
            className: "token imports",
            children: [_jsx(_components.span, {
              className: "token punctuation",
              children: "{"
            }), " run ", _jsx(_components.span, {
              className: "token punctuation",
              children: "}"
            })]
          }), " ", _jsx(_components.span, {
            className: "token keyword module",
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
            className: "token keyword control-flow",
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
            children: "'oh no!'"
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
          children: ["task", _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token keyword control-flow",
            children: "catch"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token parameter",
            children: "error"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), " ", _jsx(_components.span, {
            className: "token arrow operator",
            children: "=>"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "{"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["  ", _jsx(_components.span, {
            className: "token console class-name",
            children: "console"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token method function property-access",
            children: "error"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), "error", _jsx(_components.span, {
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
          children: [_jsx(_components.span, {
            className: "token console class-name",
            children: "console"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token method function property-access",
            children: "log"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token string",
            children: "'running task'"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ","
          }), " task", _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token property-access",
            children: "id"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), " ", _jsx(_components.span, {
            className: "token comment",
            children: "// tasks have a unique ID"
          }), "\n"]
        })]
      })
    }), "\n", _jsxs(_components.p, {
      children: ["We have already met the function ", _jsx(_components.code, {
        children: "main"
      }), ", which is very similar to ", _jsx(_components.code, {
        children: "run"
      }), ". ", _jsx(_components.code, {
        children: "main"
      }), "\ntakes care of a few things for you, like cleaning up when the process shuts\ndown, and printing errors to the console in case anything goes wrong. If you're\nwriting a program with Effection from scratch, you should normally use ", _jsx(_components.code, {
        children: "main"
      }), "\nas the entry point for your program. ", _jsx(_components.code, {
        children: "run"
      }), " is a bit more low-level and can be\nuseful when you're integrating Effection into an existing codebase."]
    }), "\n", _jsxs(_components.p, {
      children: ["Using ", _jsx(_components.code, {
        children: "main"
      }), " our example looks like this:"]
    }), "\n", _jsx(_components.pre, {
      className: "language-javascript",
      children: _jsxs(_components.code, {
        className: "language-javascript code-highlight",
        children: [_jsxs(_components.span, {
          className: "code-line",
          children: [_jsx(_components.span, {
            className: "token keyword module",
            children: "import"
          }), " ", _jsxs(_components.span, {
            className: "token imports",
            children: [_jsx(_components.span, {
              className: "token punctuation",
              children: "{"
            }), " main ", _jsx(_components.span, {
              className: "token punctuation",
              children: "}"
            })]
          }), " ", _jsx(_components.span, {
            className: "token keyword module",
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
            className: "token keyword control-flow",
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
            children: "'oh no!'"
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
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ";"
          }), "\n"]
        })]
      })
    }), "\n", _jsx(_components.p, {
      children: "You should see this print an error with nice formatting."
    }), "\n", _jsxs(_components.h3, {
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
      children: ["As we saw, we can pass a generator function as an argument to ", _jsx(_components.code, {
        children: "run"
      }), " and ", _jsx(_components.code, {
        children: "main"
      }), ", but these\nfunctions are actually a bit more general than that. In Effection we call the type of the\nargument an ", _jsx(_components.code, {
        children: "Operation"
      }), ". An ", _jsx(_components.code, {
        children: "Operation"
      }), " can be any of:"]
    }), "\n", _jsxs(_components.ul, {
      children: ["\n", _jsxs(_components.li, {
        children: ["A ", _jsx(_components.a, {
          href: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*",
          children: "Generator function"
        }), " \u2013 as we've seen"]
      }), "\n", _jsxs(_components.li, {
        children: ["A ", _jsx(_components.a, {
          href: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator",
          children: "Generator"
        })]
      }), "\n", _jsxs(_components.li, {
        children: ["An ", _jsx(_components.a, {
          href: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function",
          children: "async function"
        })]
      }), "\n", _jsxs(_components.li, {
        children: ["A ", _jsx(_components.a, {
          href: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise",
          children: "Promise"
        })]
      }), "\n", _jsxs(_components.li, {
        children: ["Another ", _jsx(_components.a, {
          href: "https://frontside.com/effection/api",
          children: _jsx(_components.code, {
            children: "Task"
          })
        })]
      }), "\n", _jsxs(_components.li, {
        children: ["A ", _jsx(_components.a, {
          href: "/docs/guides/futures",
          children: _jsx(_components.code, {
            children: "Future"
          })
        }), " \u2013 a sort of synchronous Promise, we will cover this in a later guide"]
      }), "\n", _jsxs(_components.li, {
        children: ["A ", _jsx(_components.a, {
          href: "/docs/guides/resources",
          children: _jsx(_components.code, {
            children: "Resource"
          })
        }), " \u2013 an advanced concept that enables interaction with long-running processes"]
      }), "\n"]
    }), "\n", _jsxs(_components.p, {
      children: ["Additionally you can also call ", _jsx(_components.code, {
        children: "run"
      }), " and ", _jsx(_components.code, {
        children: "main"
      }), " without any argument, this will\nsuspend indefinitely."]
    }), "\n", _jsxs(_components.h3, {
      id: "yield",
      className: "group",
      children: ["Yield", _jsx(_components.a, {
        className: "opacity-0 group-hover:opacity-100 after:content-['#']",
        href: "#yield",
        children: _jsx(_components.span, {
          className: "icon icon-link"
        })
      })]
    }), "\n", _jsxs(_components.p, {
      children: ["We have seen that we can use ", _jsx(_components.code, {
        children: "yield"
      }), " inside of a generator function to call other generator\nfunctions. In fact, we can use ", _jsx(_components.code, {
        children: "yield"
      }), " to call any other operation!"]
    }), "\n", _jsxs(_components.p, {
      children: ["For example we can use ", _jsx(_components.code, {
        children: "yield"
      }), " to wait for a Promise to resolve:"]
    }), "\n", _jsx(_components.pre, {
      className: "language-javascript",
      children: _jsxs(_components.code, {
        className: "language-javascript code-highlight",
        children: [_jsxs(_components.span, {
          className: "code-line",
          children: [_jsx(_components.span, {
            className: "token keyword module",
            children: "import"
          }), " ", _jsxs(_components.span, {
            className: "token imports",
            children: [_jsx(_components.span, {
              className: "token punctuation",
              children: "{"
            }), " main ", _jsx(_components.span, {
              className: "token punctuation",
              children: "}"
            })]
          }), " ", _jsx(_components.span, {
            className: "token keyword module",
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
          }), " text ", _jsx(_components.span, {
            className: "token operator",
            children: "="
          }), " ", _jsx(_components.span, {
            className: "token keyword control-flow",
            children: "yield"
          }), " ", _jsx(_components.span, {
            className: "token known-class-name class-name",
            children: "Promise"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token method function property-access",
            children: "resolve"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token string",
            children: '"Hello World!"'
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
            className: "token console class-name",
            children: "console"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token method function property-access",
            children: "log"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), "text", _jsx(_components.span, {
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
      children: ["We can also use ", _jsx(_components.code, {
        children: "yield"
      }), " with another generator function:"]
    }), "\n", _jsx(_components.pre, {
      className: "language-javascript",
      children: _jsxs(_components.code, {
        className: "language-javascript code-highlight",
        children: [_jsxs(_components.span, {
          className: "code-line",
          children: [_jsx(_components.span, {
            className: "token keyword module",
            children: "import"
          }), " ", _jsxs(_components.span, {
            className: "token imports",
            children: [_jsx(_components.span, {
              className: "token punctuation",
              children: "{"
            }), " main", _jsx(_components.span, {
              className: "token punctuation",
              children: ","
            }), " sleep ", _jsx(_components.span, {
              className: "token punctuation",
              children: "}"
            })]
          }), " ", _jsx(_components.span, {
            className: "token keyword module",
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
          }), " text ", _jsx(_components.span, {
            className: "token operator",
            children: "="
          }), " ", _jsx(_components.span, {
            className: "token keyword control-flow",
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
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["    ", _jsx(_components.span, {
            className: "token keyword control-flow",
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
            className: "token keyword control-flow",
            children: "return"
          }), " ", _jsx(_components.span, {
            className: "token string",
            children: '"Hello World!"'
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
          children: ["  ", _jsx(_components.span, {
            className: "token console class-name",
            children: "console"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token method function property-access",
            children: "log"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), "text", _jsx(_components.span, {
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
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ";"
          }), "\n"]
        })]
      })
    }), "\n", _jsx(_components.p, {
      children: "Or with a generator:"
    }), "\n", _jsx(_components.pre, {
      className: "language-javascript",
      children: _jsxs(_components.code, {
        className: "language-javascript code-highlight",
        children: [_jsxs(_components.span, {
          className: "code-line",
          children: [_jsx(_components.span, {
            className: "token keyword module",
            children: "import"
          }), " ", _jsxs(_components.span, {
            className: "token imports",
            children: [_jsx(_components.span, {
              className: "token punctuation",
              children: "{"
            }), " main", _jsx(_components.span, {
              className: "token punctuation",
              children: ","
            }), " sleep ", _jsx(_components.span, {
              className: "token punctuation",
              children: "}"
            })]
          }), " ", _jsx(_components.span, {
            className: "token keyword module",
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
            children: "makeSlow"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token parameter",
            children: "value"
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
            className: "token keyword control-flow",
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
            className: "token keyword control-flow",
            children: "return"
          }), " value", _jsx(_components.span, {
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
            children: "let"
          }), " text ", _jsx(_components.span, {
            className: "token operator",
            children: "="
          }), " ", _jsx(_components.span, {
            className: "token keyword control-flow",
            children: "yield"
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "makeSlow"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token string",
            children: "'Hello World!'"
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
            className: "token console class-name",
            children: "console"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token method function property-access",
            children: "log"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), "text", _jsx(_components.span, {
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
      children: ["Finally, if we use ", _jsx(_components.code, {
        children: "yield"
      }), " without an argument, it will suspend indefinitely:"]
    }), "\n", _jsx(_components.pre, {
      className: "language-javascript",
      children: _jsxs(_components.code, {
        className: "language-javascript code-highlight",
        children: [_jsxs(_components.span, {
          className: "code-line",
          children: [_jsx(_components.span, {
            className: "token keyword module",
            children: "import"
          }), " ", _jsxs(_components.span, {
            className: "token imports",
            children: [_jsx(_components.span, {
              className: "token punctuation",
              children: "{"
            }), " main ", _jsx(_components.span, {
              className: "token punctuation",
              children: "}"
            })]
          }), " ", _jsx(_components.span, {
            className: "token keyword module",
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
            className: "token keyword control-flow",
            children: "yield"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ";"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["  ", _jsx(_components.span, {
            className: "token console class-name",
            children: "console"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token method function property-access",
            children: "log"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token string",
            children: "'We will never get here!'"
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
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ";"
          }), "\n"]
        })]
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
var tasks_default = MDXContent;
export {
  tasks_default as default,
  frontmatter
};
