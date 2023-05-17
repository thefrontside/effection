import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "html/jsx-runtime";
const frontmatter = {
  "id": "processes",
  "title": "Spawning processes"
};
function _createMdxContent(props) {
  const _components = Object.assign({
    nav: "nav",
    ol: "ol",
    li: "li",
    a: "a",
    p: "p",
    code: "code",
    h2: "h2",
    span: "span",
    pre: "pre",
    blockquote: "blockquote",
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
            href: "#exec",
            children: "Exec"
          })
        }), _jsx(_components.li, {
          className: "toc-item toc-item-h2",
          children: _jsx(_components.a, {
            className: "toc-link toc-link-h2",
            href: "#short-lived-processes",
            children: "Short lived processes"
          })
        }), _jsx(_components.li, {
          className: "toc-item toc-item-h2",
          children: _jsx(_components.a, {
            className: "toc-link toc-link-h2",
            href: "#daemon",
            children: "Daemon"
          })
        })]
      })
    }), "\n", _jsx(_components.p, {
      children: "Effection simplifies the process of managing any kind of resource, and we've\ntaken great care to provide a good experience when you want to spawn external\nprocesses."
    }), "\n", _jsxs(_components.p, {
      children: ["Processes are managed via the separate ", _jsx(_components.code, {
        children: "@effection/process"
      }), " package, which\ncurrently only works in node."]
    }), "\n", _jsxs(_components.h2, {
      id: "exec",
      className: "group",
      children: ["Exec", _jsx(_components.a, {
        className: "opacity-0 group-hover:opacity-100 after:content-['#']",
        href: "#exec",
        children: _jsx(_components.span, {
          className: "icon icon-link"
        })
      })]
    }), "\n", _jsxs(_components.p, {
      children: ["The main way of starting a process is using the ", _jsx(_components.code, {
        children: "exec"
      }), " operation. ", _jsx(_components.code, {
        children: "exec"
      }), " spawns\na process and returns a handle to this process:"]
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
          }), " spawn ", _jsx(_components.span, {
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
          }), " exec ", _jsx(_components.span, {
            className: "token punctuation",
            children: "}"
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "from"
          }), " ", _jsx(_components.span, {
            className: "token string",
            children: "'@effection/process'"
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
          }), " myProcess ", _jsx(_components.span, {
            className: "token operator",
            children: "="
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "yield"
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "exec"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token string",
            children: "'npm start'"
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
            className: "token keyword",
            children: "yield"
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "spawn"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), "myProcess", _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), "stdout", _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token function",
            children: "forEach"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), "text", _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), " ", _jsx(_components.span, {
            className: "token operator",
            children: "=>"
          }), " ", _jsx(_components.span, {
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
          }), "text", _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
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
        }), _jsx(_components.span, {
          className: "code-line",
          children: "\n"
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
          }), " myProcess", _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token function",
            children: "join"
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
          }), _jsxs(_components.span, {
            className: "token template-string",
            children: [_jsx(_components.span, {
              className: "token template-punctuation string",
              children: "`"
            }), _jsx(_components.span, {
              className: "token string",
              children: "terminated with exit code "
            }), _jsxs(_components.span, {
              className: "token interpolation",
              children: [_jsx(_components.span, {
                className: "token interpolation-punctuation punctuation",
                children: "${"
              }), "result", _jsx(_components.span, {
                className: "token punctuation",
                children: "."
              }), "code", _jsx(_components.span, {
                className: "token interpolation-punctuation punctuation",
                children: "}"
              })]
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
    }), "\n", _jsxs(_components.blockquote, {
      children: ["\n", _jsxs(_components.p, {
        children: ["Note: every process has ", _jsx(_components.code, {
          children: "stdout"
        }), " and ", _jsx(_components.code, {
          children: "stderr"
        }), "  properties which can be consumed as ", _jsx(_components.a, {
          href: "./collections",
          children: "effection streams"
        })]
      }), "\n"]
    }), "\n", _jsx(_components.p, {
      children: "Processes are automatically terminated when the operation in which they were\ncreated completed:"
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
          }), " exec ", _jsx(_components.span, {
            className: "token punctuation",
            children: "}"
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "from"
          }), " ", _jsx(_components.span, {
            className: "token string",
            children: "'@effection/process'"
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
            className: "token operator",
            children: "*"
          }), _jsx(_components.span, {
            className: "token function",
            children: "runNpm"
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
            children: "exec"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token string",
            children: "'npm start'"
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
            className: "token comment",
            children: "// npm is terminated at the end of this operation"
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
            children: "yield"
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "runNpm"
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
            className: "token comment",
            children: "// npm has already been terminated here"
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
      children: [_jsx(_components.code, {
        children: "exec"
      }), " returns a ", _jsx(_components.a, {
        href: "/docs/guides/resources",
        children: "resource"
      }), " which means that if you want to create an object\nwhich uses an external process internally, you will have to create it as a\nresource as well."]
    }), "\n", _jsxs(_components.p, {
      children: [_jsx(_components.code, {
        children: "exec"
      }), " gives you a lot of control, including the ability to work with the\ninput and output streams of an external process, and to block and wait for\nthe process to complete using ", _jsx(_components.code, {
        children: "myProcess.join()"
      }), "."]
    }), "\n", _jsxs(_components.p, {
      children: ["Often we expect the process to complete in an orderly fashion with an exit code of ", _jsx(_components.code, {
        children: "0"
      }), "\nand we don't want to have to add any error handling in case the process\nexits with a non-zero error code. ", _jsx(_components.code, {
        children: "expect()"
      }), " is a convenient operation\nwhich blocks just like ", _jsx(_components.code, {
        children: "join()"
      }), " but throws an error on any non-zero exit code."]
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
          }), " spawn ", _jsx(_components.span, {
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
          }), " exec ", _jsx(_components.span, {
            className: "token punctuation",
            children: "}"
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "from"
          }), " ", _jsx(_components.span, {
            className: "token string",
            children: "'@effection/process'"
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
          }), " myProcess ", _jsx(_components.span, {
            className: "token operator",
            children: "="
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "yield"
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "exec"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token string",
            children: "'npm start'"
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
            className: "token keyword",
            children: "yield"
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "spawn"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), "myProcess", _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), "stdout", _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token function",
            children: "forEach"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), "text", _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), " ", _jsx(_components.span, {
            className: "token operator",
            children: "=>"
          }), " ", _jsx(_components.span, {
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
          }), "text", _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
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
        }), _jsx(_components.span, {
          className: "code-line",
          children: "\n"
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
          }), " myProcess", _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token function",
            children: "expect"
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
    }), "\n", _jsxs(_components.h2, {
      id: "short-lived-processes",
      className: "group",
      children: ["Short lived processes", _jsx(_components.a, {
        className: "opacity-0 group-hover:opacity-100 after:content-['#']",
        href: "#short-lived-processes",
        children: _jsx(_components.span, {
          className: "icon icon-link"
        })
      })]
    }), "\n", _jsxs(_components.p, {
      children: ["We have seen how we can use ", _jsx(_components.code, {
        children: "exec"
      }), " to manage processes which run for a while,\nbut sometimes we just want to run a process which completes quickly. For these\ncases there are shortcuts for both ", _jsx(_components.code, {
        children: "join"
      }), " and ", _jsx(_components.code, {
        children: "expect"
      }), ", so you don't have to\ndeal with a process object:"]
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
          }), " exec ", _jsx(_components.span, {
            className: "token punctuation",
            children: "}"
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "from"
          }), " ", _jsx(_components.span, {
            className: "token string",
            children: "'@effection/process'"
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
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "{"
          }), " stdout ", _jsx(_components.span, {
            className: "token punctuation",
            children: "}"
          }), " ", _jsx(_components.span, {
            className: "token operator",
            children: "="
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "yield"
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "exec"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token string",
            children: "'whois frontside.com'"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token function",
            children: "join"
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
          }), "stdout", _jsx(_components.span, {
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
      children: ["As you can see, when using this shorthand form, both ", _jsx(_components.code, {
        children: "stdout"
      }), " and ", _jsx(_components.code, {
        children: "stderr"
      }), " are\nstrings containing the full output of the program."]
    }), "\n", _jsxs(_components.p, {
      children: ["The same shortcut is available for ", _jsx(_components.code, {
        children: "expect"
      }), ":"]
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
          }), " exec ", _jsx(_components.span, {
            className: "token punctuation",
            children: "}"
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "from"
          }), " ", _jsx(_components.span, {
            className: "token string",
            children: "'@effection/process'"
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
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "{"
          }), " stdout ", _jsx(_components.span, {
            className: "token punctuation",
            children: "}"
          }), " ", _jsx(_components.span, {
            className: "token operator",
            children: "="
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "yield"
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "exec"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token string",
            children: "'whois frontside.com'"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token function",
            children: "expect"
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
          }), "stdout", _jsx(_components.span, {
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
    }), "\n", _jsxs(_components.h2, {
      id: "daemon",
      className: "group",
      children: ["Daemon", _jsx(_components.a, {
        className: "opacity-0 group-hover:opacity-100 after:content-['#']",
        href: "#daemon",
        children: _jsx(_components.span, {
          className: "icon icon-link"
        })
      })]
    }), "\n", _jsxs(_components.p, {
      children: ["A common problem with processes is what to do if they exit too early. Often we\nwant a process to live for the entire duration of the program, or in the case\nof effection for the entire duration of an operation. When using ", _jsx(_components.code, {
        children: "exec"
      }), ",\neffection ensures that the process cannot live ", _jsx(_components.em, {
        children: "longer"
      }), " than the operation, but\nit does not ensure that the process cannot live ", _jsx(_components.em, {
        children: "shorter"
      }), " than the operation."]
    }), "\n", _jsxs(_components.p, {
      children: ["An example of this might be spawning a server which must keep running so that\nwe can send requests to it. If the server exists for any reason, even if it\nexits successfully with an exit code of ", _jsx(_components.code, {
        children: "0"
      }), ", that is an unexpected condition,\nand we need to throw an error."]
    }), "\n", _jsxs(_components.p, {
      children: ["This is where ", _jsx(_components.code, {
        children: "daemon"
      }), " comes in. When using ", _jsx(_components.code, {
        children: "daemon"
      }), ", if the process finishes\nbefore the operation is complete, even if it finishes with an exit code of ", _jsx(_components.code, {
        children: "0"
      }), ",\nan error is thrown."]
    }), "\n", _jsxs(_components.p, {
      children: ["Here is an example of using ", _jsx(_components.code, {
        children: "daemon"
      }), " to spawn a server process in the\nbackground:"]
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
          }), " spawn", _jsx(_components.span, {
            className: "token punctuation",
            children: ","
          }), " fetch ", _jsx(_components.span, {
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
          }), " daemon ", _jsx(_components.span, {
            className: "token punctuation",
            children: "}"
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "from"
          }), " ", _jsx(_components.span, {
            className: "token string",
            children: "'@effection/process'"
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
          }), " myProcess ", _jsx(_components.span, {
            className: "token operator",
            children: "="
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "yield"
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "daemon"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token string",
            children: "'my-server --port 3000'"
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
            className: "token keyword",
            children: "yield"
          }), " myProcess", _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), "stdout", _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token function",
            children: "filter"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), "chunk", _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), " ", _jsx(_components.span, {
            className: "token operator",
            children: "=>"
          }), " chunk", _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token function",
            children: "includes"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token string",
            children: '"ready"'
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token function",
            children: "expect"
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
        }), _jsx(_components.span, {
          className: "code-line",
          children: "\n"
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
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "fetch"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token string",
            children: "'http://localhost:3000'"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), _jsx(_components.span, {
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
            children: "'got result:'"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ","
          }), " result", _jsx(_components.span, {
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
      children: ["Since we're sending a request to the server using ", _jsx(_components.code, {
        children: "fetch"
      }), ", the server must be\nkept running. If it ever stops, then the operation will not be able to do its job, and so it will fail immediately."]
    })]
  });
}
function MDXContent(props = {}) {
  const { wrapper: MDXLayout } = props.components || {};
  return MDXLayout ? _jsx(MDXLayout, Object.assign({}, props, {
    children: _jsx(_createMdxContent, props)
  })) : _createMdxContent(props);
}
var processes_default = MDXContent;
export {
  processes_default as default,
  frontmatter
};
