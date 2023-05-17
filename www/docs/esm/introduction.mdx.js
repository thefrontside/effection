import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "html/jsx-runtime";
const frontmatter = {
  "id": "introduction",
  "title": "Introduction"
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
    ul: "ul",
    strong: "strong",
    pre: "pre"
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
            href: "#why-use-effection",
            children: "Why use Effection?"
          })
        }), _jsx(_components.li, {
          className: "toc-item toc-item-h2",
          children: _jsx(_components.a, {
            className: "toc-link toc-link-h2",
            href: "#replacing-asyncawait",
            children: "Replacing async/await"
          })
        }), _jsx(_components.li, {
          className: "toc-item toc-item-h2",
          children: _jsx(_components.a, {
            className: "toc-link toc-link-h2",
            href: "#your-first-effection-program",
            children: "Your first Effection program"
          })
        }), _jsx(_components.li, {
          className: "toc-item toc-item-h2",
          children: _jsx(_components.a, {
            className: "toc-link toc-link-h2",
            href: "#discover-more",
            children: "Discover more"
          })
        })]
      })
    }), "\n", _jsx(_components.p, {
      children: "Effection is a structured concurrency and effects framework for JavaScript."
    }), "\n", _jsxs(_components.h2, {
      id: "why-use-effection",
      className: "group",
      children: ["Why use Effection?", _jsx(_components.a, {
        className: "opacity-0 group-hover:opacity-100 after:content-['#']",
        href: "#why-use-effection",
        children: _jsx(_components.span, {
          className: "icon icon-link"
        })
      })]
    }), "\n", _jsxs(_components.p, {
      children: ["Using Effection provides many benefits over using plain Promises and\n", _jsx(_components.code, {
        children: "async/await"
      }), " code:"]
    }), "\n", _jsxs(_components.ul, {
      children: ["\n", _jsxs(_components.li, {
        children: [_jsx(_components.strong, {
          children: "Cleanup:"
        }), " Effection code cleans up after itself, and that means never having\nto remember to manually close a resource or detach a listener."]
      }), "\n", _jsxs(_components.li, {
        children: [_jsx(_components.strong, {
          children: "Cancellation:"
        }), " Any Effection task can be cancelled, which will completely\nstop that task, as well as stopping any other tasks it has started."]
      }), "\n", _jsxs(_components.li, {
        children: [_jsx(_components.strong, {
          children: "Synchronicity:"
        }), " Unlike Promises and ", _jsx(_components.code, {
          children: "async/await"
        }), ", Effection is fundamentally\nsynchronous in nature, this means you have full control over the event loop\nand operations requiring synchronous setup remain race condition free."]
      }), "\n", _jsxs(_components.li, {
        children: [_jsx(_components.strong, {
          children: "Composition:"
        }), " Since all Effection code is well behaved, it\ncomposes easily, and there  are no nasty surprises when trying to\nfit different pieces together."]
      }), "\n"]
    }), "\n", _jsxs(_components.p, {
      children: ["JavaScript has gone through multiple evolutionary steps in how to deal\nwith concurrency: from callbacks and events, to promises, and then\nfinally to ", _jsx(_components.code, {
        children: "async/await"
      }), ". Yet it can still be difficult to write\nconcurrent code which is both correct and composable, and unless\nyou're very careful, it is still easy to leak resources. Also, most\nJavaScript code and libraries do not handle cancellation very well,\nand failure conditions can easily lead to dangling promises and other\nunexpected behavior."]
    }), "\n", _jsxs(_components.p, {
      children: ["Effection leverages the idea of ", _jsx(_components.a, {
        href: "https://vorpus.org/blog/notes-on-structured-concurrency-or-go-statement-considered-harmful/",
        children: "structured concurrency"
      }), "\nto ensure that you don't leak any resources, and that cancellation is\nproperly handled. It helps you build concurrent code that feels rock\nsolid and behaves well under all failure conditions. In essence,\nEffection allows you to compose concurrent code so that you can reason\nabout its behavior."]
    }), "\n", _jsxs(_components.h2, {
      id: "replacing-asyncawait",
      className: "group",
      children: ["Replacing async/await", _jsx(_components.a, {
        className: "opacity-0 group-hover:opacity-100 after:content-['#']",
        href: "#replacing-asyncawait",
        children: _jsx(_components.span, {
          className: "icon icon-link"
        })
      })]
    }), "\n", _jsxs(_components.p, {
      children: ["If you know how to use ", _jsx(_components.code, {
        children: "async/await"
      }), ", then you're already familiar with most of\nwhat you need to know to use Effection. The only difference is that instead\nof ", _jsx(_components.a, {
        href: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function",
        children: "async functions"
      }), ", you use ", _jsx(_components.a, {
        href: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*",
        children: "generator functions"
      }), ". Generator functions are\nsimilar to async functions but they allow Effection to take greater control over\nthe execution of your code."]
    }), "\n", _jsx(_components.p, {
      children: "To switch from async functions to generator functions, you can replace:"
    }), "\n", _jsxs(_components.ol, {
      children: ["\n", _jsxs(_components.li, {
        children: [_jsx(_components.code, {
          children: "await"
        }), " with ", _jsx(_components.code, {
          children: "yield"
        })]
      }), "\n", _jsxs(_components.li, {
        children: [_jsx(_components.code, {
          children: "async function()"
        }), " with ", _jsx(_components.code, {
          children: "function*()"
        })]
      }), "\n"]
    }), "\n", _jsxs(_components.p, {
      children: ["For example, using ", _jsx(_components.code, {
        children: "async/await"
      }), " we could write something like this:"]
    }), "\n", _jsx(_components.pre, {
      className: "language-javascript",
      children: _jsxs(_components.code, {
        className: "language-javascript code-highlight",
        children: [_jsxs(_components.span, {
          className: "code-line line-number highlight-line",
          line: "1",
          children: [_jsx(_components.span, {
            className: "token keyword module",
            children: "import"
          }), " ", _jsxs(_components.span, {
            className: "token imports",
            children: [_jsx(_components.span, {
              className: "token punctuation",
              children: "{"
            }), " fetch ", _jsx(_components.span, {
              className: "token punctuation",
              children: "}"
            })]
          }), " ", _jsx(_components.span, {
            className: "token keyword module",
            children: "from"
          }), " ", _jsx(_components.span, {
            className: "token string",
            children: "'isomorphic-fetch'"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ";"
          }), "\n"]
        }), _jsx(_components.span, {
          className: "code-line line-number",
          line: "2",
          children: "\n"
        }), _jsxs(_components.span, {
          className: "code-line line-number highlight-line",
          line: "3",
          children: [_jsx(_components.span, {
            className: "token keyword module",
            children: "export"
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "async"
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "function"
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "fetchWeekDay"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token parameter",
            children: "timezone"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "{"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line line-number highlight-line",
          line: "4",
          children: ["  ", _jsx(_components.span, {
            className: "token keyword",
            children: "let"
          }), " response ", _jsx(_components.span, {
            className: "token operator",
            children: "="
          }), " ", _jsx(_components.span, {
            className: "token keyword control-flow",
            children: "await"
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "fetch"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsxs(_components.span, {
            className: "token template-string",
            children: [_jsx(_components.span, {
              className: "token template-punctuation string",
              children: "`"
            }), _jsx(_components.span, {
              className: "token string",
              children: "http://worldclockapi.com/api/json/"
            }), _jsxs(_components.span, {
              className: "token interpolation",
              children: [_jsx(_components.span, {
                className: "token interpolation-punctuation punctuation",
                children: "${"
              }), "timezone", _jsx(_components.span, {
                className: "token interpolation-punctuation punctuation",
                children: "}"
              })]
            }), _jsx(_components.span, {
              className: "token string",
              children: "/now"
            }), _jsx(_components.span, {
              className: "token template-punctuation string",
              children: "`"
            })]
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ";"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line line-number",
          line: "5",
          children: ["  ", _jsx(_components.span, {
            className: "token keyword",
            children: "let"
          }), " time ", _jsx(_components.span, {
            className: "token operator",
            children: "="
          }), " ", _jsx(_components.span, {
            className: "token keyword control-flow",
            children: "await"
          }), " response", _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token method function property-access",
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
          className: "code-line line-number",
          line: "6",
          children: ["  ", _jsx(_components.span, {
            className: "token keyword control-flow",
            children: "return"
          }), " time", _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token property-access",
            children: "dayOfTheWeek"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ";"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line line-number",
          line: "7",
          children: [_jsx(_components.span, {
            className: "token punctuation",
            children: "}"
          }), "\n"]
        })]
      })
    }), "\n", _jsx(_components.p, {
      children: "The same code using Effection looks like this:"
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
            }), " fetch ", _jsx(_components.span, {
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
            className: "token keyword module",
            children: "export"
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "function"
          }), " ", _jsx(_components.span, {
            className: "token operator",
            children: "*"
          }), _jsx(_components.span, {
            className: "token function",
            children: "fetchWeekDay"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token parameter",
            children: "timezone"
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
            className: "token keyword control-flow",
            children: "yield"
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "fetch"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsxs(_components.span, {
            className: "token template-string",
            children: [_jsx(_components.span, {
              className: "token template-punctuation string",
              children: "`"
            }), _jsx(_components.span, {
              className: "token string",
              children: "http://worldclockapi.com/api/json/"
            }), _jsxs(_components.span, {
              className: "token interpolation",
              children: [_jsx(_components.span, {
                className: "token interpolation-punctuation punctuation",
                children: "${"
              }), "timezone", _jsx(_components.span, {
                className: "token interpolation-punctuation punctuation",
                children: "}"
              })]
            }), _jsx(_components.span, {
              className: "token string",
              children: "/now"
            }), _jsx(_components.span, {
              className: "token template-punctuation string",
              children: "`"
            })]
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
            children: "let"
          }), " time ", _jsx(_components.span, {
            className: "token operator",
            children: "="
          }), " ", _jsx(_components.span, {
            className: "token keyword control-flow",
            children: "yield"
          }), " response", _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token method function property-access",
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
          children: ["  ", _jsx(_components.span, {
            className: "token keyword control-flow",
            children: "return"
          }), " time", _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token property-access",
            children: "dayOfTheWeek"
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
    }), "\n", _jsxs(_components.h2, {
      id: "your-first-effection-program",
      className: "group",
      children: ["Your first Effection program", _jsx(_components.a, {
        className: "opacity-0 group-hover:opacity-100 after:content-['#']",
        href: "#your-first-effection-program",
        children: _jsx(_components.span, {
          className: "icon icon-link"
        })
      })]
    }), "\n", _jsxs(_components.p, {
      children: ["To start using Effection, use the ", _jsx(_components.code, {
        children: "main"
      }), " function as an entry\npoint. In this example, we'll use the previously defined\n", _jsx(_components.code, {
        children: "fetchWeekDay"
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
        }), _jsxs(_components.span, {
          className: "code-line",
          children: [_jsx(_components.span, {
            className: "token keyword module",
            children: "import"
          }), " ", _jsxs(_components.span, {
            className: "token imports",
            children: [_jsx(_components.span, {
              className: "token punctuation",
              children: "{"
            }), " fetchWeekDay ", _jsx(_components.span, {
              className: "token punctuation",
              children: "}"
            })]
          }), " ", _jsx(_components.span, {
            className: "token keyword module",
            children: "from"
          }), " ", _jsx(_components.span, {
            className: "token string",
            children: "'./fetch-week-day'"
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
          }), " dayOfTheWeek ", _jsx(_components.span, {
            className: "token operator",
            children: "="
          }), " ", _jsx(_components.span, {
            className: "token keyword control-flow",
            children: "yield"
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "fetchWeekDay"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token string",
            children: "'est'"
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
          }), _jsxs(_components.span, {
            className: "token template-string",
            children: [_jsx(_components.span, {
              className: "token template-punctuation string",
              children: "`"
            }), _jsx(_components.span, {
              className: "token string",
              children: "It is "
            }), _jsxs(_components.span, {
              className: "token interpolation",
              children: [_jsx(_components.span, {
                className: "token interpolation-punctuation punctuation",
                children: "${"
              }), "dayOfTheWeek", _jsx(_components.span, {
                className: "token interpolation-punctuation punctuation",
                children: "}"
              })]
            }), _jsx(_components.span, {
              className: "token string",
              children: ", my friends!"
            }), _jsx(_components.span, {
              className: "token template-punctuation string",
              children: "`"
            })]
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
      children: ["Even with such a simple program, Effection is still providing critical\npower-ups to you behind the scenes that you don't get with callbacks,\npromises, or ", _jsx(_components.code, {
        children: "async/await"
      }), ". For example, if you run the above in\nNodeJS and hit ", _jsx(_components.code, {
        children: "CTRL-C"
      }), " while the request to ", _jsx(_components.code, {
        children: "http://worldclockapi.com"
      }), " is\nstill in progress, it will properly cancel the in-flight request\nas a well-behaved HTTP client should. All without you ever having to\nthink about it. This is because every Effection operation contains\nthe information on how to dispose of itself, and so the actual act of\ncancellation can be automated."]
    }), "\n", _jsxs(_components.p, {
      children: ["This has powerful consequences when it comes to composing new\noperations out of existing ones. For example, we can add a time out of\n1000 milliseconds to our ", _jsx(_components.code, {
        children: "fetchWeekDay"
      }), " operation (or any operation\nfor that matter) by wrapping it with the ", _jsx(_components.code, {
        children: "withTimeout"
      }), " operation from\nthe standard ", _jsx(_components.code, {
        children: "effection"
      }), " module."]
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
            }), " withTimeout ", _jsx(_components.span, {
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
        }), _jsxs(_components.span, {
          className: "code-line",
          children: [_jsx(_components.span, {
            className: "token keyword module",
            children: "import"
          }), " ", _jsxs(_components.span, {
            className: "token imports",
            children: [_jsx(_components.span, {
              className: "token punctuation",
              children: "{"
            }), " fetchWeekDay ", _jsx(_components.span, {
              className: "token punctuation",
              children: "}"
            })]
          }), " ", _jsx(_components.span, {
            className: "token keyword module",
            children: "from"
          }), " ", _jsx(_components.span, {
            className: "token string",
            children: "'./fetch-week-day'"
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
          }), " dayOfTheWeek ", _jsx(_components.span, {
            className: "token operator",
            children: "="
          }), " ", _jsx(_components.span, {
            className: "token keyword control-flow",
            children: "yield"
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "withTimeout"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token function",
            children: "fetchWeekDay"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token string",
            children: "'est'"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ","
          }), " ", _jsx(_components.span, {
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
          }), _jsxs(_components.span, {
            className: "token template-string",
            children: [_jsx(_components.span, {
              className: "token template-punctuation string",
              children: "`"
            }), _jsx(_components.span, {
              className: "token string",
              children: "It is "
            }), _jsxs(_components.span, {
              className: "token interpolation",
              children: [_jsx(_components.span, {
                className: "token interpolation-punctuation punctuation",
                children: "${"
              }), "dayOfTheWeek", _jsx(_components.span, {
                className: "token interpolation-punctuation punctuation",
                children: "}"
              })]
            }), _jsx(_components.span, {
              className: "token string",
              children: ", my friends!"
            }), _jsx(_components.span, {
              className: "token template-punctuation string",
              children: "`"
            })]
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
      children: ["If more than 1000 milliseconds passes before the ", _jsx(_components.code, {
        children: "fetchWeekDay()"
      }), "\noperation completes, then an error will be raised."]
    }), "\n", _jsxs(_components.p, {
      children: ["What's important to note however, is that when we actually defined our\n", _jsx(_components.code, {
        children: "fetchWeekDay()"
      }), " operation, we never once had to worry about timeouts,\nor request cancellation. And in order to achieve both we didn't have\nto gum up our API by passing around cancellation tokens or ", _jsx(_components.a, {
        href: "https://developer.mozilla.org/en-US/docs/Web/API/AbortController",
        children: "abort\ncontrollers"
      }), ". We just got it all for free."]
    }), "\n", _jsxs(_components.h2, {
      id: "discover-more",
      className: "group",
      children: ["Discover more", _jsx(_components.a, {
        className: "opacity-0 group-hover:opacity-100 after:content-['#']",
        href: "#discover-more",
        children: _jsx(_components.span, {
          className: "icon icon-link"
        })
      })]
    }), "\n", _jsxs(_components.p, {
      children: ["This is just the tip of the iceberg when it comes to the seemingly complex\nthings that Effection can make simple. To find out more, jump\ninto the conversation ", _jsx(_components.a, {
        href: "https://discord.gg/Ug5nWH8",
        children: "in our discord server"
      }), ". We're really\nexcited about the things that Effection has enabled us to accomplish,\nand we'd love to hear your thoughts on it, and how you might see\nit working for you."]
    })]
  });
}
function MDXContent(props = {}) {
  const { wrapper: MDXLayout } = props.components || {};
  return MDXLayout ? _jsx(MDXLayout, Object.assign({}, props, {
    children: _jsx(_createMdxContent, props)
  })) : _createMdxContent(props);
}
var introduction_default = MDXContent;
export {
  introduction_default as default,
  frontmatter
};
