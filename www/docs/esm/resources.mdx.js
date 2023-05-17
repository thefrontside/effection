import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "html/jsx-runtime";
const frontmatter = {
  "id": "resources",
  "title": "Resources"
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
    pre: "pre",
    code: "code",
    em: "em"
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
            href: "#the-resource-criteria",
            children: "The resource criteria"
          })
        }), _jsx(_components.li, {
          className: "toc-item toc-item-h2",
          children: _jsx(_components.a, {
            className: "toc-link toc-link-h2",
            href: "#why-resources",
            children: "Why resources?"
          })
        }), _jsx(_components.li, {
          className: "toc-item toc-item-h2",
          children: _jsx(_components.a, {
            className: "toc-link toc-link-h2",
            href: "#using-resources",
            children: "Using resources"
          })
        }), _jsx(_components.li, {
          className: "toc-item toc-item-h2",
          children: _jsx(_components.a, {
            className: "toc-link toc-link-h2",
            href: "#how-resources-work",
            children: "How resources work"
          })
        }), _jsx(_components.li, {
          className: "toc-item toc-item-h2",
          children: _jsx(_components.a, {
            className: "toc-link toc-link-h2",
            href: "#nested-resources",
            children: "Nested resources"
          })
        })]
      })
    }), "\n", _jsxs(_components.p, {
      children: ["As we discussed in the chapter on ", _jsx(_components.a, {
        href: "/docs/guides/tasks",
        children: "tasks"
      }), ", an ", _jsx(_components.a, {
        href: "https://frontside.com/effection/api",
        children: "Operation"
      }), " can be one of\nseveral things, one of which is a ", _jsx(_components.a, {
        href: "https://frontside.com/effection/api",
        children: "Resource"
      }), ". In this chapter we will explain\nwhat a resource is and why you might want to use one."]
    }), "\n", _jsxs(_components.h2, {
      id: "the-resource-criteria",
      className: "group",
      children: ["The resource criteria", _jsx(_components.a, {
        className: "opacity-0 group-hover:opacity-100 after:content-['#']",
        href: "#the-resource-criteria",
        children: _jsx(_components.span, {
          className: "icon icon-link"
        })
      })]
    }), "\n", _jsx(_components.p, {
      children: "Resources can seem a little complicated, but the reason for their existence is\nrather simple. Sometimes there are operations which meet the following criteria:"
    }), "\n", _jsxs(_components.ol, {
      children: ["\n", _jsx(_components.li, {
        children: "They are long running"
      }), "\n", _jsx(_components.li, {
        children: "We want to be able to interact with them while they are running"
      }), "\n"]
    }), "\n", _jsxs(_components.h2, {
      id: "why-resources",
      className: "group",
      children: ["Why resources?", _jsx(_components.a, {
        className: "opacity-0 group-hover:opacity-100 after:content-['#']",
        href: "#why-resources",
        children: _jsx(_components.span, {
          className: "icon icon-link"
        })
      })]
    }), "\n", _jsx(_components.p, {
      children: "As an example, let's consider that our program opens a Socket, and we want to be\nable to send messages to this socket while it is open. This is fairly simple\nto write using regular operations like this:"
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
            }), " ", _jsx(_components.span, {
              className: "token maybe-class-name",
              children: "Socket"
            }), " ", _jsx(_components.span, {
              className: "token punctuation",
              children: "}"
            })]
          }), " ", _jsx(_components.span, {
            className: "token keyword module",
            children: "from"
          }), " ", _jsx(_components.span, {
            className: "token string",
            children: "'net'"
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
          }), " socket ", _jsx(_components.span, {
            className: "token operator",
            children: "="
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "new"
          }), " ", _jsx(_components.span, {
            className: "token class-name",
            children: "Socket"
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
          children: ["  socket", _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token method function property-access",
            children: "connect"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token number",
            children: "1337"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ","
          }), " ", _jsx(_components.span, {
            className: "token string",
            children: "'127.0.0.1'"
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
            className: "token keyword control-flow",
            children: "yield"
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "once"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), "socket", _jsx(_components.span, {
            className: "token punctuation",
            children: ","
          }), " ", _jsx(_components.span, {
            className: "token string",
            children: "'connect'"
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
          children: ["  socket", _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token method function property-access",
            children: "write"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token string",
            children: "'hello'"
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
          children: ["  socket", _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token method function property-access",
            children: "close"
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
      children: "This works, but there are a lot of details we need to remember to use the socket\nsafely. It would be nice if we could create a friendly abstraction that we could\nreuse in all of our code that uses socket."
    }), "\n", _jsx(_components.p, {
      children: "We know we want to close this socket once we're done, so our first attempt might\nlook something like this:"
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
            }), " once ", _jsx(_components.span, {
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
            children: "createSocket"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsxs(_components.span, {
            className: "token parameter",
            children: ["port", _jsx(_components.span, {
              className: "token punctuation",
              children: ","
            }), " host"]
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
          }), " socket ", _jsx(_components.span, {
            className: "token operator",
            children: "="
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "new"
          }), " ", _jsx(_components.span, {
            className: "token class-name",
            children: "Socket"
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
          children: ["  socket", _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token method function property-access",
            children: "connect"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), "port", _jsx(_components.span, {
            className: "token punctuation",
            children: ","
          }), " host", _jsx(_components.span, {
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
            className: "token keyword control-flow",
            children: "yield"
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "once"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), "socket", _jsx(_components.span, {
            className: "token punctuation",
            children: ","
          }), " ", _jsx(_components.span, {
            className: "token string",
            children: "'connect'"
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
            className: "token keyword control-flow",
            children: "try"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "{"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["    ", _jsx(_components.span, {
            className: "token keyword control-flow",
            children: "yield"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["    ", _jsx(_components.span, {
            className: "token keyword control-flow",
            children: "return"
          }), " socket", _jsx(_components.span, {
            className: "token punctuation",
            children: ";"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["  ", _jsx(_components.span, {
            className: "token punctuation",
            children: "}"
          }), " ", _jsx(_components.span, {
            className: "token keyword control-flow",
            children: "finally"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "{"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["    socket", _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token method function property-access",
            children: "close"
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
      children: ["But when we actually try to use our ", _jsx(_components.code, {
        children: "createSocket"
      }), " operation, we run into a problem:"]
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
            }), " createSocket ", _jsx(_components.span, {
              className: "token punctuation",
              children: "}"
            })]
          }), " ", _jsx(_components.span, {
            className: "token keyword module",
            children: "from"
          }), " ", _jsx(_components.span, {
            className: "token string",
            children: "'./create-socket'"
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
          }), " socket ", _jsx(_components.span, {
            className: "token operator",
            children: "="
          }), " ", _jsx(_components.span, {
            className: "token keyword control-flow",
            children: "yield"
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "createSocket"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token number",
            children: "1337"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ","
          }), " ", _jsx(_components.span, {
            className: "token string",
            children: "'127.0.0.1'"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ";"
          }), " ", _jsx(_components.span, {
            className: "token comment",
            children: "// this blocks forever"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["  socket", _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token method function property-access",
            children: "write"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token string",
            children: "'hello'"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ";"
          }), " ", _jsx(_components.span, {
            className: "token comment",
            children: "// we never get here"
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
      id: "using-resources",
      className: "group",
      children: ["Using resources", _jsx(_components.a, {
        className: "opacity-0 group-hover:opacity-100 after:content-['#']",
        href: "#using-resources",
        children: _jsx(_components.span, {
          className: "icon icon-link"
        })
      })]
    }), "\n", _jsx(_components.p, {
      children: "Remember our criteria from before:"
    }), "\n", _jsxs(_components.ol, {
      children: ["\n", _jsx(_components.li, {
        children: "Socket is a long running process"
      }), "\n", _jsx(_components.li, {
        children: "We want to interact with the socket while it is running by sending messages to it"
      }), "\n"]
    }), "\n", _jsxs(_components.p, {
      children: ["This is a good use-case for using a Resource. Let's look at how we can rewrite\n", _jsx(_components.code, {
        children: "createSocket"
      }), " using resources. Effection considers any object which has an\n", _jsx(_components.code, {
        children: "init"
      }), " function a Resource. The ", _jsx(_components.code, {
        children: "init"
      }), " function initializes the Resource, and\nan implementation of ", _jsx(_components.code, {
        children: "createSocket"
      }), " could look like this:"]
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
            }), " once", _jsx(_components.span, {
              className: "token punctuation",
              children: ","
            }), " spawn ", _jsx(_components.span, {
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
            className: "token function",
            children: "createSocket"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsxs(_components.span, {
            className: "token parameter",
            children: ["port", _jsx(_components.span, {
              className: "token punctuation",
              children: ","
            }), " host"]
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
            children: "return"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "{"
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
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["      ", _jsx(_components.span, {
            className: "token keyword",
            children: "let"
          }), " socket ", _jsx(_components.span, {
            className: "token operator",
            children: "="
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "new"
          }), " ", _jsx(_components.span, {
            className: "token class-name",
            children: "Socket"
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
          children: ["      socket", _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token method function property-access",
            children: "connect"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), "port", _jsx(_components.span, {
            className: "token punctuation",
            children: ","
          }), " host", _jsx(_components.span, {
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
          children: ["      ", _jsx(_components.span, {
            className: "token keyword control-flow",
            children: "yield"
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "spawn"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token keyword",
            children: "function"
          }), _jsx(_components.span, {
            className: "token operator",
            children: "*"
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "closeSocket"
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
          children: ["        ", _jsx(_components.span, {
            className: "token keyword control-flow",
            children: "try"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "{"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["          ", _jsx(_components.span, {
            className: "token keyword control-flow",
            children: "yield"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["        ", _jsx(_components.span, {
            className: "token punctuation",
            children: "}"
          }), " ", _jsx(_components.span, {
            className: "token keyword control-flow",
            children: "finally"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "{"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["          socket", _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token method function property-access",
            children: "close"
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
          children: ["        ", _jsx(_components.span, {
            className: "token punctuation",
            children: "}"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["      ", _jsx(_components.span, {
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
          children: ["      ", _jsx(_components.span, {
            className: "token keyword control-flow",
            children: "yield"
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "once"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), "socket", _jsx(_components.span, {
            className: "token punctuation",
            children: ","
          }), " ", _jsx(_components.span, {
            className: "token string",
            children: "'connect'"
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
          children: ["      ", _jsx(_components.span, {
            className: "token keyword control-flow",
            children: "return"
          }), " socket", _jsx(_components.span, {
            className: "token punctuation",
            children: ";"
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
      children: ["Before we unpack what's going on, let's just note that how we use ", _jsx(_components.code, {
        children: "createSocket"
      }), " has\nnot changed at all, only it now works as we expect!"]
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
            }), " createSocket ", _jsx(_components.span, {
              className: "token punctuation",
              children: "}"
            })]
          }), " ", _jsx(_components.span, {
            className: "token keyword module",
            children: "from"
          }), " ", _jsx(_components.span, {
            className: "token string",
            children: "'./create-socket'"
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
          }), " socket ", _jsx(_components.span, {
            className: "token operator",
            children: "="
          }), " ", _jsx(_components.span, {
            className: "token keyword control-flow",
            children: "yield"
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "createSocket"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token number",
            children: "1337"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ","
          }), " ", _jsx(_components.span, {
            className: "token string",
            children: "'127.0.0.1'"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ";"
          }), " ", _jsx(_components.span, {
            className: "token comment",
            children: "// waits for the socket to connect"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["  socket", _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token method function property-access",
            children: "write"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token string",
            children: "'hello'"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ";"
          }), " ", _jsx(_components.span, {
            className: "token comment",
            children: "// this works"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["  ", _jsx(_components.span, {
            className: "token comment",
            children: "// once `main` finishes, the socket is closed"
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
      id: "how-resources-work",
      className: "group",
      children: ["How resources work", _jsx(_components.a, {
        className: "opacity-0 group-hover:opacity-100 after:content-['#']",
        href: "#how-resources-work",
        children: _jsx(_components.span, {
          className: "icon icon-link"
        })
      })]
    }), "\n", _jsxs(_components.p, {
      children: ["The ", _jsx(_components.code, {
        children: "init"
      }), " function is used to ", _jsx(_components.em, {
        children: "initialize"
      }), " the resource. Once the ", _jsx(_components.code, {
        children: "init"
      }), "\nfunction is done, we can proceed past the ", _jsx(_components.code, {
        children: "yield"
      }), " point where we called\n", _jsx(_components.code, {
        children: "createSocket"
      }), " in ", _jsx(_components.code, {
        children: "main"
      }), ". You can see why we call ", _jsx(_components.code, {
        children: "once"
      }), " from ", _jsx(_components.code, {
        children: "init"
      }), ", so we\nwait for the socket to open before proceeding."]
    }), "\n", _jsxs(_components.p, {
      children: ["But what about the call to ", _jsx(_components.code, {
        children: "spawn"
      }), "? We have previously established that a\nspawned Task cannot outlive its parent, and so the Task that we spawned really\n", _jsx(_components.em, {
        children: "should"
      }), " be halted when the ", _jsx(_components.code, {
        children: "init"
      }), " function is finished. But the rules within\n", _jsx(_components.code, {
        children: "init"
      }), " are slightly different, and this is what gives resources their power. If\nwe use ", _jsx(_components.code, {
        children: "spawn"
      }), " in ", _jsx(_components.code, {
        children: "init"
      }), " then the spawned Task is actually spawned under the\nTask that created the resource, which in this case is the ", _jsx(_components.code, {
        children: "main"
      }), " task. The Task\nstill cannot outlive its parent, which is ", _jsx(_components.code, {
        children: "main"
      }), ", but its able to outlive the\n", _jsx(_components.code, {
        children: "init"
      }), " function."]
    }), "\n", _jsx(_components.p, {
      children: "You can think of this as creating a task hierarchy which looks something like this:"
    }), "\n", _jsx(_components.pre, {
      children: _jsxs(_components.code, {
        className: "code-highlight",
        children: [_jsx(_components.span, {
          className: "code-line",
          children: "+-- main\n"
        }), _jsx(_components.span, {
          className: "code-line",
          children: "  |\n"
        }), _jsx(_components.span, {
          className: "code-line",
          children: "  +-- init\n"
        }), _jsx(_components.span, {
          className: "code-line",
          children: "    |\n"
        }), _jsx(_components.span, {
          className: "code-line",
          children: "    +-- once(socket, 'connect')\n"
        }), _jsx(_components.span, {
          className: "code-line",
          children: "  |\n"
        }), _jsx(_components.span, {
          className: "code-line",
          children: "  +-- closeSocket\n"
        })]
      })
    }), "\n", _jsxs(_components.p, {
      children: ["As you can see, ", _jsx(_components.code, {
        children: "closeSocket"
      }), " and ", _jsx(_components.code, {
        children: "init"
      }), " are ", _jsx(_components.em, {
        children: "siblings"
      }), " rather than ", _jsx(_components.code, {
        children: "closeSocket"
      }), "\nbeing a child of ", _jsx(_components.code, {
        children: "init"
      }), "."]
    }), "\n", _jsxs(_components.h2, {
      id: "nested-resources",
      className: "group",
      children: ["Nested resources", _jsx(_components.a, {
        className: "opacity-0 group-hover:opacity-100 after:content-['#']",
        href: "#nested-resources",
        children: _jsx(_components.span, {
          className: "icon icon-link"
        })
      })]
    }), "\n", _jsxs(_components.p, {
      children: ["Other resources created within ", _jsx(_components.code, {
        children: "init"
      }), " behave the same way and are created as\nsiblings. We can use this to make a socket which serializes anything written\nto it as JSON:"]
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
            }), " once", _jsx(_components.span, {
              className: "token punctuation",
              children: ","
            }), " spawn ", _jsx(_components.span, {
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
            }), " createSocket ", _jsx(_components.span, {
              className: "token punctuation",
              children: "}"
            })]
          }), " ", _jsx(_components.span, {
            className: "token keyword module",
            children: "from"
          }), " ", _jsx(_components.span, {
            className: "token string",
            children: "'./create-socket'"
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
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "createJSONSocket"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsxs(_components.span, {
            className: "token parameter",
            children: ["port", _jsx(_components.span, {
              className: "token punctuation",
              children: ","
            }), " host"]
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
            children: "return"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "{"
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
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["      ", _jsx(_components.span, {
            className: "token keyword",
            children: "let"
          }), " socket ", _jsx(_components.span, {
            className: "token operator",
            children: "="
          }), " ", _jsx(_components.span, {
            className: "token keyword control-flow",
            children: "yield"
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "createSocket"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), "port", _jsx(_components.span, {
            className: "token punctuation",
            children: ","
          }), " host", _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ";"
          }), " ", _jsx(_components.span, {
            className: "token comment",
            children: "// outlives the `init` function"
          }), "\n"]
        }), _jsx(_components.span, {
          className: "code-line",
          children: "\n"
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["      ", _jsx(_components.span, {
            className: "token keyword control-flow",
            children: "return"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "{"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["        ", _jsx(_components.span, {
            className: "token function-variable function",
            children: "write"
          }), _jsx(_components.span, {
            className: "token operator",
            children: ":"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token parameter",
            children: "value"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), " ", _jsx(_components.span, {
            className: "token arrow operator",
            children: "=>"
          }), " socket", _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token method function property-access",
            children: "write"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token known-class-name class-name",
            children: "JSON"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token method function property-access",
            children: "stringify"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), "value", _jsx(_components.span, {
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
          children: ["      ", _jsx(_components.span, {
            className: "token punctuation",
            children: "}"
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
          }), " socket ", _jsx(_components.span, {
            className: "token operator",
            children: "="
          }), " ", _jsx(_components.span, {
            className: "token keyword control-flow",
            children: "yield"
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "createJSONSocket"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token number",
            children: "1337"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ","
          }), " ", _jsx(_components.span, {
            className: "token string",
            children: "'127.0.0.1'"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ";"
          }), " ", _jsx(_components.span, {
            className: "token comment",
            children: "// waits for the socket to connect"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["  socket", _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token method function property-access",
            children: "write"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "{"
          }), " ", _jsx(_components.span, {
            className: "token literal-property property",
            children: "hello"
          }), _jsx(_components.span, {
            className: "token operator",
            children: ":"
          }), " ", _jsx(_components.span, {
            className: "token string",
            children: "'world'"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "}"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ";"
          }), " ", _jsx(_components.span, {
            className: "token comment",
            children: "// this works"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["  ", _jsx(_components.span, {
            className: "token comment",
            children: "// once `main` finishes, the socket is closed"
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
      children: ["Here we're able to reuse our ", _jsx(_components.code, {
        children: "createSocket"
      }), " operation. Resources allow us\nto create powerful, reusable abstractions which are also able to clean up\nafter themselves."]
    }), "\n", _jsx(_components.p, {
      children: "If we used a regular operation here and not a Resource, the socket would be\nclosed before we could ever send a message to it."
    }), "\n", _jsx(_components.pre, {
      className: "language-javascript",
      children: _jsxs(_components.code, {
        className: "language-javascript code-highlight",
        children: [_jsxs(_components.span, {
          className: "code-line",
          children: [_jsx(_components.span, {
            className: "token comment",
            children: "// THIS DOESN'T WORK"
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
            }), " once", _jsx(_components.span, {
              className: "token punctuation",
              children: ","
            }), " spawn ", _jsx(_components.span, {
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
            }), " createSocket ", _jsx(_components.span, {
              className: "token punctuation",
              children: "}"
            })]
          }), " ", _jsx(_components.span, {
            className: "token keyword module",
            children: "from"
          }), " ", _jsx(_components.span, {
            className: "token string",
            children: "'./create-socket'"
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
            children: "createJSONSocket"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsxs(_components.span, {
            className: "token parameter",
            children: ["port", _jsx(_components.span, {
              className: "token punctuation",
              children: ","
            }), " host"]
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
          }), " socket ", _jsx(_components.span, {
            className: "token operator",
            children: "="
          }), " ", _jsx(_components.span, {
            className: "token keyword control-flow",
            children: "yield"
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "createSocket"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), "port", _jsx(_components.span, {
            className: "token punctuation",
            children: ","
          }), " host", _jsx(_components.span, {
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
            className: "token keyword control-flow",
            children: "return"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "{"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["    ", _jsx(_components.span, {
            className: "token function-variable function",
            children: "write"
          }), _jsx(_components.span, {
            className: "token operator",
            children: ":"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token parameter",
            children: "value"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), " ", _jsx(_components.span, {
            className: "token arrow operator",
            children: "=>"
          }), " socket", _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token method function property-access",
            children: "write"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token known-class-name class-name",
            children: "JSON"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token method function property-access",
            children: "stringify"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), "value", _jsx(_components.span, {
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
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["  ", _jsx(_components.span, {
            className: "token comment",
            children: "// socket gets closed here!"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: [_jsx(_components.span, {
            className: "token punctuation",
            children: "}"
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
var resources_default = MDXContent;
export {
  resources_default as default,
  frontmatter
};
