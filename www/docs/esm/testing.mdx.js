import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "html/jsx-runtime";
const frontmatter = {
  "id": "testing",
  "title": "Testing"
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
    h3: "h3",
    pre: "pre",
    em: "em"
  }, props.components), { Tabs, TabItem } = _components;
  if (!TabItem)
    _missingMdxReference("TabItem", true);
  if (!Tabs)
    _missingMdxReference("Tabs", true);
  return _jsxs(_Fragment, {
    children: [_jsx(_components.nav, {
      className: "fixed top-0 right-0",
      children: _jsxs(_components.ol, {
        className: "toc-level toc-level-1",
        children: [_jsx(_components.li, {
          className: "toc-item toc-item-h2",
          children: _jsx(_components.a, {
            className: "toc-link toc-link-h2",
            href: "#lifecycle",
            children: "Lifecycle"
          })
        }), _jsxs(_components.li, {
          className: "toc-item toc-item-h2",
          children: [_jsx(_components.a, {
            className: "toc-link toc-link-h2",
            href: "#jest-and-mocha",
            children: "Jest and Mocha"
          }), _jsxs(_components.ol, {
            className: "toc-level toc-level-2",
            children: [_jsx(_components.li, {
              className: "toc-item toc-item-h3",
              children: _jsx(_components.a, {
                className: "toc-link toc-link-h3",
                href: "#writing-tests",
                children: "Writing Tests"
              })
            }), _jsx(_components.li, {
              className: "toc-item toc-item-h3",
              children: _jsx(_components.a, {
                className: "toc-link toc-link-h3",
                href: "#test-scope",
                children: "Test Scope"
              })
            }), _jsx(_components.li, {
              className: "toc-item toc-item-h3",
              children: _jsx(_components.a, {
                className: "toc-link toc-link-h3",
                href: "#caveats",
                children: "Caveats"
              })
            })]
          })]
        }), _jsx(_components.li, {
          className: "toc-item toc-item-h2",
          children: _jsx(_components.a, {
            className: "toc-link toc-link-h2",
            href: "#other-frameworks",
            children: "Other Frameworks"
          })
        })]
      })
    }), "\n", _jsx(_components.p, {
      children: "Effection not only simplifies the process of writing tests, but by\nmanaging all the timing complexity of your setup and teardown, it can\noften make new kinds of tests possible that beforehand may have seemed\nunachievable."
    }), "\n", _jsxs(_components.p, {
      children: ["Currently, both ", _jsx(_components.a, {
        href: "https://jestjs.io",
        children: "Jest"
      }), " and ", _jsx(_components.a, {
        href: "https://mochajs.org",
        children: "Mocha"
      }), " are supported out of the box, but\nbecause of the way Effection works, and because of the nature of task\nyou have to do while testing, it's easy to integrate it with\nany test framework you like."]
    }), "\n", _jsxs(_components.h2, {
      id: "lifecycle",
      className: "group",
      children: ["Lifecycle", _jsx(_components.a, {
        className: "opacity-0 group-hover:opacity-100 after:content-['#']",
        href: "#lifecycle",
        children: _jsx(_components.span, {
          className: "icon icon-link"
        })
      })]
    }), "\n", _jsx(_components.p, {
      children: "The reason Effection can so effectively power your tests is because the\nlife-cycle of a test mirrors that of an Effection Task almost perfectly."
    }), "\n", _jsx(_components.p, {
      children: "Consider that almost every test framework executes the following sequence of\noperations when running a test:"
    }), "\n", _jsxs(_components.ol, {
      children: ["\n", _jsx(_components.li, {
        children: "setup()"
      }), "\n", _jsx(_components.li, {
        children: "run()"
      }), "\n", _jsx(_components.li, {
        children: "teardown()"
      }), "\n"]
    }), "\n", _jsx(_components.p, {
      children: "While there are certainly different ways of expressing this\nsyntactically, it turns out that as a fundamental testing pattern, it\nis nearly universal. Notice that, like tests, the cleanup of an\neffection operation is intrinsic. We can leverage this fact to\nassociate an effection task with each test.  Then, we run any\noperation that is part of the test as a child of that task. After it\nis finished, a test's task is halted , thereby halting any sub-tasks\nthat were running as a part of it."
    }), "\n", _jsxs(_components.p, {
      children: ["This means that any resources being used by the testcase such as servers,\ndatabase connections, file handles, etc... can be automatically released without\nwriting any cleanup logic explicitly into the test itself. In essense, your\ntests are able to completely eliminate ", _jsx(_components.code, {
        children: "teardown"
      }), " altogether and become:"]
    }), "\n", _jsxs(_components.ol, {
      children: ["\n", _jsx(_components.li, {
        children: "setup()"
      }), "\n", _jsx(_components.li, {
        children: "run()"
      }), "\n"]
    }), "\n", _jsxs(_components.h2, {
      id: "jest-and-mocha",
      className: "group",
      children: ["Jest and Mocha", _jsx(_components.a, {
        className: "opacity-0 group-hover:opacity-100 after:content-['#']",
        href: "#jest-and-mocha",
        children: _jsx(_components.span, {
          className: "icon icon-link"
        })
      })]
    }), "\n", _jsxs(_components.p, {
      children: ["Effection provides packages for seamless integration between ", _jsx(_components.a, {
        href: "https://jestjs.io",
        children: "Jest"
      }), " and\n", _jsx(_components.a, {
        href: "https://mochajs.org",
        children: "Mocha"
      }), "."]
    }), "\n", _jsx(_components.p, {
      children: "To get started, install from NPM"
    }), "\n", _jsxs(_components.h3, {
      id: "writing-tests",
      className: "group",
      children: ["Writing Tests", _jsx(_components.a, {
        className: "opacity-0 group-hover:opacity-100 after:content-['#']",
        href: "#writing-tests",
        children: _jsx(_components.span, {
          className: "icon icon-link"
        })
      })]
    }), "\n", _jsx(_components.p, {
      children: "Let's say we have a test case written without the benefit of effection that\nlooks like this:"
    }), "\n", _jsx(_components.pre, {
      className: "language-javascript",
      children: _jsxs(_components.code, {
        className: "language-javascript code-highlight",
        children: [_jsxs(_components.span, {
          className: "code-line",
          children: [_jsx(_components.span, {
            className: "token function",
            children: "describe"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token string",
            children: '"a server"'
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ","
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "("
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
            className: "token keyword",
            children: "let"
          }), " ", _jsx(_components.span, {
            className: "token literal-property property",
            children: "server"
          }), _jsx(_components.span, {
            className: "token operator",
            children: ":"
          }), " ", _jsx(_components.span, {
            className: "token maybe-class-name",
            children: "Server"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ";"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["  ", _jsx(_components.span, {
            className: "token function",
            children: "beforeEach"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token keyword",
            children: "async"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "("
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
          children: ["    server ", _jsx(_components.span, {
            className: "token operator",
            children: "="
          }), " ", _jsx(_components.span, {
            className: "token keyword control-flow",
            children: "await"
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "startServer"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "{"
          }), " ", _jsx(_components.span, {
            className: "token literal-property property",
            children: "port"
          }), _jsx(_components.span, {
            className: "token operator",
            children: ":"
          }), " ", _jsx(_components.span, {
            className: "token number",
            children: "3500"
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
            className: "token function",
            children: "it"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token string",
            children: "'can be pinged'"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ","
          }), " ", _jsx(_components.span, {
            className: "token keyword",
            children: "async"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "("
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
          children: ["    ", _jsx(_components.span, {
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
          }), _jsx(_components.span, {
            className: "token string",
            children: "'http://localhost:3500/ping'"
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
            className: "token function",
            children: "expect"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), "response", _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token property-access",
            children: "ok"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token method function property-access",
            children: "toBe"
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
            className: "token function",
            children: "afterEach"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token keyword",
            children: "async"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "("
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
          children: ["    ", _jsx(_components.span, {
            className: "token keyword control-flow",
            children: "await"
          }), " server", _jsx(_components.span, {
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
      children: ":::note Cleanup"
    }), "\n", _jsxs(_components.p, {
      children: ["It is critical that we shutdown the server after each test. Otherwise, node\nwill never exit without a hard stop because it's still bound to port\n", _jsx(_components.code, {
        children: "3500"
      }), ", and worse, every subsequent time we try and run our tests they will fail\nbecause port ", _jsx(_components.code, {
        children: "3500"
      }), " is not available!\n:::"]
    }), "\n", _jsx(_components.p, {
      children: "To re-write this test case using effection, there are two superficial\ndifferences from the vanilla version of the framework."
    }), "\n", _jsxs(_components.ol, {
      children: ["\n", _jsxs(_components.li, {
        children: ["You ", _jsx(_components.code, {
          children: "import"
        }), " all of your test syntax from the effection package, and not\nfrom the global namespace."]
      }), "\n", _jsxs(_components.li, {
        children: ["You use ", _jsx(_components.a, {
          href: "/docs/guides/introduction#replacing-asyncawait",
          children: "generator functions instead of async functions"
        }), " to\nexpress all of your test operations."]
      }), "\n"]
    }), "\n", _jsx(_components.p, {
      children: "Once we make those changes, our test case now looks like this."
    }), "\n", _jsxs(Tabs, {
      groupId: "jest-and-mocha-replacement",
      defaultValue: "jest",
      values: [{
        label: "Jest",
        value: "jest"
      }, {
        label: "Mocha",
        value: "mocha"
      }],
      children: [_jsx(TabItem, {
        value: "jest",
        children: _jsx(_components.pre, {
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
                }), " beforeEach", _jsx(_components.span, {
                  className: "token punctuation",
                  children: ","
                }), " afterEach", _jsx(_components.span, {
                  className: "token punctuation",
                  children: ","
                }), " it ", _jsx(_components.span, {
                  className: "token punctuation",
                  children: "}"
                })]
              }), " ", _jsx(_components.span, {
                className: "token keyword module",
                children: "from"
              }), " ", _jsx(_components.span, {
                className: "token string",
                children: "'@effection/jest'"
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
                children: "describe"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), _jsx(_components.span, {
                className: "token string",
                children: '"a server"'
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: ","
              }), " ", _jsx(_components.span, {
                className: "token punctuation",
                children: "("
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
                className: "token keyword",
                children: "let"
              }), " ", _jsx(_components.span, {
                className: "token literal-property property",
                children: "server"
              }), _jsx(_components.span, {
                className: "token operator",
                children: ":"
              }), " ", _jsx(_components.span, {
                className: "token maybe-class-name",
                children: "Server"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: ";"
              }), "\n"]
            }), _jsxs(_components.span, {
              className: "code-line",
              children: ["  ", _jsx(_components.span, {
                className: "token function",
                children: "beforeEach"
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
              children: ["    server ", _jsx(_components.span, {
                className: "token operator",
                children: "="
              }), " ", _jsx(_components.span, {
                className: "token keyword control-flow",
                children: "yield"
              }), " ", _jsx(_components.span, {
                className: "token function",
                children: "startServer"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "{"
              }), " ", _jsx(_components.span, {
                className: "token literal-property property",
                children: "port"
              }), _jsx(_components.span, {
                className: "token operator",
                children: ":"
              }), " ", _jsx(_components.span, {
                className: "token number",
                children: "3500"
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
                className: "token function",
                children: "it"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), _jsx(_components.span, {
                className: "token string",
                children: "'can be pinged'"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: ","
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
              }), _jsx(_components.span, {
                className: "token string",
                children: "'http://localhost:3500/ping'"
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
                className: "token function",
                children: "expect"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), "response", _jsx(_components.span, {
                className: "token punctuation",
                children: "."
              }), _jsx(_components.span, {
                className: "token property-access",
                children: "ok"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: ")"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "."
              }), _jsx(_components.span, {
                className: "token method function property-access",
                children: "toBe"
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
                className: "token function",
                children: "afterEach"
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
                className: "token keyword control-flow",
                children: "yield"
              }), " server", _jsx(_components.span, {
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
        })
      }), _jsx(TabItem, {
        value: "mocha",
        children: _jsx(_components.pre, {
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
                }), " beforeEach", _jsx(_components.span, {
                  className: "token punctuation",
                  children: ","
                }), " afterEach", _jsx(_components.span, {
                  className: "token punctuation",
                  children: ","
                }), " it ", _jsx(_components.span, {
                  className: "token punctuation",
                  children: "}"
                })]
              }), " ", _jsx(_components.span, {
                className: "token keyword module",
                children: "from"
              }), " ", _jsx(_components.span, {
                className: "token string",
                children: "'@effection/mocha'"
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
                children: "describe"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), _jsx(_components.span, {
                className: "token string",
                children: '"a server"'
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: ","
              }), " ", _jsx(_components.span, {
                className: "token punctuation",
                children: "("
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
                className: "token keyword",
                children: "let"
              }), " ", _jsx(_components.span, {
                className: "token literal-property property",
                children: "server"
              }), _jsx(_components.span, {
                className: "token operator",
                children: ":"
              }), " ", _jsx(_components.span, {
                className: "token maybe-class-name",
                children: "Server"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: ";"
              }), "\n"]
            }), _jsxs(_components.span, {
              className: "code-line",
              children: ["  ", _jsx(_components.span, {
                className: "token function",
                children: "beforeEach"
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
              children: ["    server ", _jsx(_components.span, {
                className: "token operator",
                children: "="
              }), " ", _jsx(_components.span, {
                className: "token keyword control-flow",
                children: "yield"
              }), " ", _jsx(_components.span, {
                className: "token function",
                children: "startServer"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "{"
              }), " ", _jsx(_components.span, {
                className: "token literal-property property",
                children: "port"
              }), _jsx(_components.span, {
                className: "token operator",
                children: ":"
              }), " ", _jsx(_components.span, {
                className: "token number",
                children: "3500"
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
                className: "token function",
                children: "it"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), _jsx(_components.span, {
                className: "token string",
                children: "'can be pinged'"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: ","
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
              }), _jsx(_components.span, {
                className: "token string",
                children: "'http://localhost:3500/ping'"
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
                className: "token function",
                children: "expect"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), "response", _jsx(_components.span, {
                className: "token punctuation",
                children: "."
              }), _jsx(_components.span, {
                className: "token property-access",
                children: "ok"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: ")"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "."
              }), _jsx(_components.span, {
                className: "token method function property-access",
                children: "toBe"
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
                className: "token function",
                children: "afterEach"
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
                className: "token keyword control-flow",
                children: "yield"
              }), " server", _jsx(_components.span, {
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
        })
      })]
    }), "\n", _jsx(_components.p, {
      children: "But so far, we've only traded one syntax for another. Now however, we can\nbegin to leverage the power of Effection to make our test cases not only more\nconcise, but also more flexible. To do this, we use the fact that each test\ncase gets its own task that is automatically halted for us after it runs."
    }), "\n", _jsxs(_components.p, {
      children: ["So if we re-cast our server as a ", _jsx(_components.a, {
        href: "/docs/guides/resources",
        children: "resource"
      }), " that is running as a\nchild of our test-scoped task, then when the test task goes away, so\nwill our server."]
    }), "\n", _jsxs(Tabs, {
      groupId: "jest-and-mocha-resource",
      defaultValue: "jest",
      values: [{
        label: "Jest",
        value: "jest"
      }, {
        label: "Mocha",
        value: "mocha"
      }],
      children: [_jsx(TabItem, {
        value: "jest",
        children: _jsx(_components.pre, {
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
                }), " ensure ", _jsx(_components.span, {
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
                }), " beforeEach", _jsx(_components.span, {
                  className: "token punctuation",
                  children: ","
                }), " it ", _jsx(_components.span, {
                  className: "token punctuation",
                  children: "}"
                })]
              }), " ", _jsx(_components.span, {
                className: "token keyword module",
                children: "from"
              }), " ", _jsx(_components.span, {
                className: "token string",
                children: "'@effection/jest'"
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
                children: "describe"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), _jsx(_components.span, {
                className: "token string",
                children: '"a server"'
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: ","
              }), " ", _jsx(_components.span, {
                className: "token punctuation",
                children: "("
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
                className: "token function",
                children: "beforeEach"
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
                className: "token keyword control-flow",
                children: "yield"
              }), " ", _jsx(_components.span, {
                className: "token punctuation",
                children: "{"
              }), "\n"]
            }), _jsxs(_components.span, {
              className: "code-line",
              children: ["      ", _jsx(_components.span, {
                className: "token literal-property property",
                children: "name"
              }), _jsx(_components.span, {
                className: "token operator",
                children: ":"
              }), " ", _jsx(_components.span, {
                className: "token string",
                children: "'ping server'"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: ","
              }), "\n"]
            }), _jsxs(_components.span, {
              className: "code-line",
              children: ["      ", _jsx(_components.span, {
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
              children: ["        ", _jsx(_components.span, {
                className: "token keyword",
                children: "let"
              }), " server ", _jsx(_components.span, {
                className: "token operator",
                children: "="
              }), " ", _jsx(_components.span, {
                className: "token keyword control-flow",
                children: "yield"
              }), " ", _jsx(_components.span, {
                className: "token function",
                children: "startServer"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "{"
              }), " ", _jsx(_components.span, {
                className: "token literal-property property",
                children: "port"
              }), _jsx(_components.span, {
                className: "token operator",
                children: ":"
              }), " ", _jsx(_components.span, {
                className: "token number",
                children: "3500"
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
              children: ["        ", _jsx(_components.span, {
                className: "token keyword control-flow",
                children: "yield"
              }), " ", _jsx(_components.span, {
                className: "token function",
                children: "ensure"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: ")"
              }), " ", _jsx(_components.span, {
                className: "token arrow operator",
                children: "=>"
              }), " server", _jsx(_components.span, {
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
                children: ")"
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
                className: "token function",
                children: "it"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), _jsx(_components.span, {
                className: "token string",
                children: "'can be pinged'"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: ","
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
              }), _jsx(_components.span, {
                className: "token string",
                children: "'http://localhost:3500/ping'"
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
                className: "token function",
                children: "expect"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), "response", _jsx(_components.span, {
                className: "token punctuation",
                children: "."
              }), _jsx(_components.span, {
                className: "token property-access",
                children: "ok"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: ")"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "."
              }), _jsx(_components.span, {
                className: "token method function property-access",
                children: "toBe"
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
        })
      }), _jsx(TabItem, {
        value: "mocha",
        children: _jsx(_components.pre, {
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
                }), " ensure ", _jsx(_components.span, {
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
                }), " beforeEach", _jsx(_components.span, {
                  className: "token punctuation",
                  children: ","
                }), " it ", _jsx(_components.span, {
                  className: "token punctuation",
                  children: "}"
                })]
              }), " ", _jsx(_components.span, {
                className: "token keyword module",
                children: "from"
              }), " ", _jsx(_components.span, {
                className: "token string",
                children: "'@effection/mocha'"
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
                children: "describe"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), _jsx(_components.span, {
                className: "token string",
                children: '"a server"'
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: ","
              }), " ", _jsx(_components.span, {
                className: "token punctuation",
                children: "("
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
                className: "token function",
                children: "beforeEach"
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
                className: "token keyword control-flow",
                children: "yield"
              }), " ", _jsx(_components.span, {
                className: "token punctuation",
                children: "{"
              }), "\n"]
            }), _jsxs(_components.span, {
              className: "code-line",
              children: ["      ", _jsx(_components.span, {
                className: "token literal-property property",
                children: "name"
              }), _jsx(_components.span, {
                className: "token operator",
                children: ":"
              }), " ", _jsx(_components.span, {
                className: "token string",
                children: "'ping server'"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: ","
              }), "\n"]
            }), _jsxs(_components.span, {
              className: "code-line",
              children: ["      ", _jsx(_components.span, {
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
              children: ["        ", _jsx(_components.span, {
                className: "token keyword",
                children: "let"
              }), " server ", _jsx(_components.span, {
                className: "token operator",
                children: "="
              }), " ", _jsx(_components.span, {
                className: "token keyword control-flow",
                children: "yield"
              }), " ", _jsx(_components.span, {
                className: "token function",
                children: "startServer"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "{"
              }), " ", _jsx(_components.span, {
                className: "token literal-property property",
                children: "port"
              }), _jsx(_components.span, {
                className: "token operator",
                children: ":"
              }), " ", _jsx(_components.span, {
                className: "token number",
                children: "3500"
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
              children: ["        ", _jsx(_components.span, {
                className: "token keyword control-flow",
                children: "yield"
              }), " ", _jsx(_components.span, {
                className: "token function",
                children: "ensure"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: ")"
              }), " ", _jsx(_components.span, {
                className: "token arrow operator",
                children: "=>"
              }), " server", _jsx(_components.span, {
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
                children: ")"
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
                className: "token function",
                children: "it"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), _jsx(_components.span, {
                className: "token string",
                children: "'can be pinged'"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: ","
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
              }), _jsx(_components.span, {
                className: "token string",
                children: "'http://localhost:3500/ping'"
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
                className: "token function",
                children: "expect"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), "response", _jsx(_components.span, {
                className: "token punctuation",
                children: "."
              }), _jsx(_components.span, {
                className: "token property-access",
                children: "ok"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: ")"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "."
              }), _jsx(_components.span, {
                className: "token method function property-access",
                children: "toBe"
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
        })
      })]
    }), "\n", _jsxs(_components.p, {
      children: ["We don't have to write an ", _jsx(_components.code, {
        children: "afterEach()"
      }), " ", _jsx(_components.em, {
        children: "at all"
      }), " anymore, because the resource\nknows how to tear itself down no matter where it ends up running."]
    }), "\n", _jsxs(_components.p, {
      children: ["This has the added benefit of making your tests more refactorable. For example,\nlet's say that we decided that since our server is read-only, we can actually\nstart it once before all of the tests run, so we move it to a ", _jsx(_components.em, {
        children: "suite"
      }), " level\nhook. Before, we would have had to remember to convert our teardown hook as\nwell, but with Effection, we can just move our resource to its new location."]
    }), "\n", _jsxs(Tabs, {
      groupId: "jest-and-mocha-resource",
      defaultValue: "jest",
      values: [{
        label: "Jest",
        value: "jest"
      }, {
        label: "Mocha",
        value: "mocha"
      }],
      children: [_jsx(TabItem, {
        value: "jest",
        children: _jsx(_components.pre, {
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
                }), " ensure ", _jsx(_components.span, {
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
                }), " beforeAll", _jsx(_components.span, {
                  className: "token punctuation",
                  children: ","
                }), " it ", _jsx(_components.span, {
                  className: "token punctuation",
                  children: "}"
                })]
              }), " ", _jsx(_components.span, {
                className: "token keyword module",
                children: "from"
              }), " ", _jsx(_components.span, {
                className: "token string",
                children: "'@effection/jest'"
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
                children: "describe"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), _jsx(_components.span, {
                className: "token string",
                children: '"a server"'
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: ","
              }), " ", _jsx(_components.span, {
                className: "token punctuation",
                children: "("
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
                className: "token function",
                children: "beforeAll"
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
                className: "token keyword control-flow",
                children: "yield"
              }), " ", _jsx(_components.span, {
                className: "token punctuation",
                children: "{"
              }), "\n"]
            }), _jsxs(_components.span, {
              className: "code-line",
              children: ["      ", _jsx(_components.span, {
                className: "token literal-property property",
                children: "name"
              }), _jsx(_components.span, {
                className: "token operator",
                children: ":"
              }), " ", _jsx(_components.span, {
                className: "token string",
                children: "'ping server'"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: ","
              }), "\n"]
            }), _jsxs(_components.span, {
              className: "code-line",
              children: ["      ", _jsx(_components.span, {
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
              children: ["        ", _jsx(_components.span, {
                className: "token keyword",
                children: "let"
              }), " server ", _jsx(_components.span, {
                className: "token operator",
                children: "="
              }), " ", _jsx(_components.span, {
                className: "token keyword control-flow",
                children: "yield"
              }), " ", _jsx(_components.span, {
                className: "token function",
                children: "startServer"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "{"
              }), " ", _jsx(_components.span, {
                className: "token literal-property property",
                children: "port"
              }), _jsx(_components.span, {
                className: "token operator",
                children: ":"
              }), " ", _jsx(_components.span, {
                className: "token number",
                children: "3500"
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
              children: ["        ", _jsx(_components.span, {
                className: "token keyword control-flow",
                children: "yield"
              }), " ", _jsx(_components.span, {
                className: "token function",
                children: "ensure"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: ")"
              }), " ", _jsx(_components.span, {
                className: "token arrow operator",
                children: "=>"
              }), " server", _jsx(_components.span, {
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
                children: ")"
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
                className: "token function",
                children: "it"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), _jsx(_components.span, {
                className: "token string",
                children: "'can be pinged'"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: ","
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
              }), _jsx(_components.span, {
                className: "token string",
                children: "'http://localhost:3500/ping'"
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
                className: "token function",
                children: "expect"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), "response", _jsx(_components.span, {
                className: "token punctuation",
                children: "."
              }), _jsx(_components.span, {
                className: "token property-access",
                children: "ok"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: ")"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "."
              }), _jsx(_components.span, {
                className: "token method function property-access",
                children: "toBe"
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
        })
      }), _jsx(TabItem, {
        value: "mocha",
        children: _jsx(_components.pre, {
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
                }), " ensure ", _jsx(_components.span, {
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
                }), " before", _jsx(_components.span, {
                  className: "token punctuation",
                  children: ","
                }), " it ", _jsx(_components.span, {
                  className: "token punctuation",
                  children: "}"
                })]
              }), " ", _jsx(_components.span, {
                className: "token keyword module",
                children: "from"
              }), " ", _jsx(_components.span, {
                className: "token string",
                children: "'@effection/mocha'"
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
                children: "describe"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), _jsx(_components.span, {
                className: "token string",
                children: '"a server"'
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: ","
              }), " ", _jsx(_components.span, {
                className: "token punctuation",
                children: "("
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
                className: "token function",
                children: "before"
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
                className: "token keyword control-flow",
                children: "yield"
              }), " ", _jsx(_components.span, {
                className: "token punctuation",
                children: "{"
              }), "\n"]
            }), _jsxs(_components.span, {
              className: "code-line",
              children: ["      ", _jsx(_components.span, {
                className: "token literal-property property",
                children: "name"
              }), _jsx(_components.span, {
                className: "token operator",
                children: ":"
              }), " ", _jsx(_components.span, {
                className: "token string",
                children: "'ping server'"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: ","
              }), "\n"]
            }), _jsxs(_components.span, {
              className: "code-line",
              children: ["      ", _jsx(_components.span, {
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
              children: ["        ", _jsx(_components.span, {
                className: "token keyword",
                children: "let"
              }), " server ", _jsx(_components.span, {
                className: "token operator",
                children: "="
              }), " ", _jsx(_components.span, {
                className: "token keyword control-flow",
                children: "yield"
              }), " ", _jsx(_components.span, {
                className: "token function",
                children: "startServer"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "{"
              }), " ", _jsx(_components.span, {
                className: "token literal-property property",
                children: "port"
              }), _jsx(_components.span, {
                className: "token operator",
                children: ":"
              }), " ", _jsx(_components.span, {
                className: "token number",
                children: "3500"
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
              children: ["        nyield ", _jsx(_components.span, {
                className: "token function",
                children: "ensure"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: ")"
              }), " ", _jsx(_components.span, {
                className: "token arrow operator",
                children: "=>"
              }), " server", _jsx(_components.span, {
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
                children: ")"
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
                className: "token function",
                children: "it"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), _jsx(_components.span, {
                className: "token string",
                children: "'can be pinged'"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: ","
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
              }), _jsx(_components.span, {
                className: "token string",
                children: "'http://localhost:3500/ping'"
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
                className: "token function",
                children: "expect"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), "response", _jsx(_components.span, {
                className: "token punctuation",
                children: "."
              }), _jsx(_components.span, {
                className: "token property-access",
                children: "ok"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: ")"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "."
              }), _jsx(_components.span, {
                className: "token method function property-access",
                children: "toBe"
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
        })
      })]
    }), "\n", _jsx(_components.p, {
      children: "It is common to extract such resources into re-usable functions that can be\nembedded anywhere into your test suite, and you never have to worry about them\nbeing torn down. For example, we could define our server resource in a single\nplace:"
    }), "\n", _jsx(_components.pre, {
      className: "language-javascript",
      children: _jsxs(_components.code, {
        className: "language-javascript code-highlight",
        children: [_jsxs(_components.span, {
          className: "code-line",
          children: [_jsx(_components.span, {
            className: "token comment",
            children: "//server.js"
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
            }), " ensure ", _jsx(_components.span, {
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
            children: "createServer"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token parameter",
            children: "options"
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
          }), " port ", _jsx(_components.span, {
            className: "token operator",
            children: "="
          }), " ", _jsx(_components.span, {
            className: "token number",
            children: "3500"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ","
          }), " name ", _jsx(_components.span, {
            className: "token operator",
            children: "="
          }), " ", _jsx(_components.span, {
            className: "token string",
            children: "'ping server'"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "}"
          }), " ", _jsx(_components.span, {
            className: "token operator",
            children: "="
          }), " options", _jsx(_components.span, {
            className: "token punctuation",
            children: ";"
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
          children: ["    name", _jsx(_components.span, {
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
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["      ", _jsx(_components.span, {
            className: "token keyword",
            children: "let"
          }), " server ", _jsx(_components.span, {
            className: "token operator",
            children: "="
          }), " ", _jsx(_components.span, {
            className: "token keyword control-flow",
            children: "yield"
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "startServer"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "{"
          }), " port ", _jsx(_components.span, {
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
          children: ["      ", _jsx(_components.span, {
            className: "token keyword control-flow",
            children: "yield"
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "ensure"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), " ", _jsx(_components.span, {
            className: "token arrow operator",
            children: "=>"
          }), " server", _jsx(_components.span, {
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
      children: "Then we can use it easily in any test case:"
    }), "\n", _jsxs(Tabs, {
      groupId: "jest-and-mocha-reuse",
      defaultValue: "jest",
      values: [{
        label: "Jest",
        value: "jest"
      }, {
        label: "Mocha",
        value: "mocha"
      }],
      children: [_jsx(TabItem, {
        value: "jest",
        children: _jsx(_components.pre, {
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
                }), " beforeAll", _jsx(_components.span, {
                  className: "token punctuation",
                  children: ","
                }), " it ", _jsx(_components.span, {
                  className: "token punctuation",
                  children: "}"
                })]
              }), " ", _jsx(_components.span, {
                className: "token keyword module",
                children: "from"
              }), " ", _jsx(_components.span, {
                className: "token string",
                children: "'@effection/jest'"
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
                }), " createServer ", _jsx(_components.span, {
                  className: "token punctuation",
                  children: "}"
                })]
              }), " ", _jsx(_components.span, {
                className: "token keyword module",
                children: "from"
              }), " ", _jsx(_components.span, {
                className: "token string",
                children: "'./server'"
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
                children: "describe"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), _jsx(_components.span, {
                className: "token string",
                children: '"a server"'
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: ","
              }), " ", _jsx(_components.span, {
                className: "token punctuation",
                children: "("
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
                className: "token function",
                children: "beforeAll"
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
                className: "token keyword control-flow",
                children: "yield"
              }), " ", _jsx(_components.span, {
                className: "token function",
                children: "createServer"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "{"
              }), " ", _jsx(_components.span, {
                className: "token literal-property property",
                children: "port"
              }), _jsx(_components.span, {
                className: "token operator",
                children: ":"
              }), " ", _jsx(_components.span, {
                className: "token number",
                children: "3500"
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
                className: "token function",
                children: "it"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), _jsx(_components.span, {
                className: "token string",
                children: "'can be pinged'"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: ","
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
              }), _jsx(_components.span, {
                className: "token string",
                children: "'http://localhost:3500/ping'"
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
                className: "token function",
                children: "expect"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), "response", _jsx(_components.span, {
                className: "token punctuation",
                children: "."
              }), _jsx(_components.span, {
                className: "token property-access",
                children: "ok"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: ")"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "."
              }), _jsx(_components.span, {
                className: "token method function property-access",
                children: "toBe"
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
        })
      }), _jsx(TabItem, {
        value: "mocha",
        children: _jsx(_components.pre, {
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
                }), " before", _jsx(_components.span, {
                  className: "token punctuation",
                  children: ","
                }), " it ", _jsx(_components.span, {
                  className: "token punctuation",
                  children: "}"
                })]
              }), " ", _jsx(_components.span, {
                className: "token keyword module",
                children: "from"
              }), " ", _jsx(_components.span, {
                className: "token string",
                children: "'@effection/mocha'"
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
                }), " createServer ", _jsx(_components.span, {
                  className: "token punctuation",
                  children: "}"
                })]
              }), " ", _jsx(_components.span, {
                className: "token keyword module",
                children: "from"
              }), " ", _jsx(_components.span, {
                className: "token string",
                children: "'./server'"
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
                children: "describe"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), _jsx(_components.span, {
                className: "token string",
                children: '"a server"'
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: ","
              }), " ", _jsx(_components.span, {
                className: "token punctuation",
                children: "("
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
                className: "token function",
                children: "before"
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
                className: "token keyword control-flow",
                children: "yield"
              }), " ", _jsx(_components.span, {
                className: "token function",
                children: "createServer"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "{"
              }), " ", _jsx(_components.span, {
                className: "token literal-property property",
                children: "port"
              }), _jsx(_components.span, {
                className: "token operator",
                children: ":"
              }), " ", _jsx(_components.span, {
                className: "token number",
                children: "3500"
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
                className: "token function",
                children: "it"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), _jsx(_components.span, {
                className: "token string",
                children: "'can be pinged'"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: ","
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
              }), _jsx(_components.span, {
                className: "token string",
                children: "'http://localhost:3500/ping'"
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
                className: "token function",
                children: "expect"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), "response", _jsx(_components.span, {
                className: "token punctuation",
                children: "."
              }), _jsx(_components.span, {
                className: "token property-access",
                children: "ok"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: ")"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "."
              }), _jsx(_components.span, {
                className: "token method function property-access",
                children: "toBe"
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
        })
      })]
    }), "\n", _jsxs(_components.h3, {
      id: "test-scope",
      className: "group",
      children: ["Test Scope", _jsx(_components.a, {
        className: "opacity-0 group-hover:opacity-100 after:content-['#']",
        href: "#test-scope",
        children: _jsx(_components.span, {
          className: "icon icon-link"
        })
      })]
    }), "\n", _jsxs(_components.p, {
      children: ["As hinted at above, there are two separate levels of task in\nyour tests: ", _jsx(_components.em, {
        children: "suite-scoped"
      }), ", and ", _jsx(_components.em, {
        children: "test-scoped"
      }), ". Effection creates one\ntask that has the same lifetime as the beginning and end of your test\nsuite. Any task spawned within it can potentially last across multiple\ntest runs. By the same token, the ", _jsx(_components.em, {
        children: "test-scoped"
      }), " task is created before\nand halted after every single test. Any tasks spawned within it will\nbe halted immediately after the test is finished. For example:"]
    }), "\n", _jsxs(Tabs, {
      groupId: "jest-and-mocha-reuse",
      defaultValue: "jest",
      values: [{
        label: "Jest",
        value: "jest"
      }, {
        label: "Mocha",
        value: "mocha"
      }],
      children: [_jsx(TabItem, {
        value: "jest",
        children: _jsx(_components.pre, {
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
                }), " beforeAll", _jsx(_components.span, {
                  className: "token punctuation",
                  children: ","
                }), " beforeEach", _jsx(_components.span, {
                  className: "token punctuation",
                  children: ","
                }), " it ", _jsx(_components.span, {
                  className: "token punctuation",
                  children: "}"
                })]
              }), " ", _jsx(_components.span, {
                className: "token keyword module",
                children: "from"
              }), " ", _jsx(_components.span, {
                className: "token string",
                children: "'@effection/jest'"
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
                }), " createServer ", _jsx(_components.span, {
                  className: "token punctuation",
                  children: "}"
                })]
              }), " ", _jsx(_components.span, {
                className: "token keyword module",
                children: "from"
              }), " ", _jsx(_components.span, {
                className: "token string",
                children: "'./server'"
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
                children: "describe"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), _jsx(_components.span, {
                className: "token string",
                children: '"a server"'
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: ","
              }), " ", _jsx(_components.span, {
                className: "token punctuation",
                children: "("
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
                className: "token function",
                children: "beforeAll"
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
                className: "token comment",
                children: "// started once before both `it` blocks"
              }), "\n"]
            }), _jsxs(_components.span, {
              className: "code-line",
              children: ["    ", _jsx(_components.span, {
                className: "token comment",
                children: "// stopped once after both `it` blocks"
              }), "\n"]
            }), _jsxs(_components.span, {
              className: "code-line",
              children: ["    ", _jsx(_components.span, {
                className: "token keyword control-flow",
                children: "yield"
              }), " ", _jsx(_components.span, {
                className: "token function",
                children: "createServer"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "{"
              }), " ", _jsx(_components.span, {
                className: "token literal-property property",
                children: "port"
              }), _jsx(_components.span, {
                className: "token operator",
                children: ":"
              }), " ", _jsx(_components.span, {
                className: "token number",
                children: "3500"
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
                className: "token function",
                children: "beforeEach"
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
                className: "token comment",
                children: "// started before every `it` block"
              }), "\n"]
            }), _jsxs(_components.span, {
              className: "code-line",
              children: ["    ", _jsx(_components.span, {
                className: "token comment",
                children: "// stopped after every `it` block,"
              }), "\n"]
            }), _jsxs(_components.span, {
              className: "code-line",
              children: ["    ", _jsx(_components.span, {
                className: "token keyword control-flow",
                children: "yield"
              }), " ", _jsx(_components.span, {
                className: "token function",
                children: "createServer"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "{"
              }), " ", _jsx(_components.span, {
                className: "token literal-property property",
                children: "port"
              }), _jsx(_components.span, {
                className: "token operator",
                children: ":"
              }), " ", _jsx(_components.span, {
                className: "token number",
                children: "3501"
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
                className: "token function",
                children: "it"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), _jsx(_components.span, {
                className: "token string",
                children: "'can be pinged'"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: ","
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
              }), _jsx(_components.span, {
                className: "token string",
                children: "'http://localhost:3500/ping'"
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
                className: "token function",
                children: "expect"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), "response", _jsx(_components.span, {
                className: "token punctuation",
                children: "."
              }), _jsx(_components.span, {
                className: "token property-access",
                children: "ok"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: ")"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "."
              }), _jsx(_components.span, {
                className: "token method function property-access",
                children: "toBe"
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
            }), _jsx(_components.span, {
              className: "code-line",
              children: "\n"
            }), _jsxs(_components.span, {
              className: "code-line",
              children: ["    ", _jsx(_components.span, {
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
              }), _jsx(_components.span, {
                className: "token string",
                children: "'http://localhost:3501/ping'"
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
                className: "token function",
                children: "expect"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), "response", _jsx(_components.span, {
                className: "token punctuation",
                children: "."
              }), _jsx(_components.span, {
                className: "token property-access",
                children: "ok"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: ")"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "."
              }), _jsx(_components.span, {
                className: "token method function property-access",
                children: "toBe"
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
                className: "token function",
                children: "it"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), _jsx(_components.span, {
                className: "token string",
                children: "'can be ponged'"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: ","
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
              }), _jsx(_components.span, {
                className: "token string",
                children: "'http://localhost:3500/pong'"
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
                className: "token function",
                children: "expect"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), "response", _jsx(_components.span, {
                className: "token punctuation",
                children: "."
              }), _jsx(_components.span, {
                className: "token property-access",
                children: "ok"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: ")"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "."
              }), _jsx(_components.span, {
                className: "token method function property-access",
                children: "toBe"
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
            }), _jsx(_components.span, {
              className: "code-line",
              children: "\n"
            }), _jsxs(_components.span, {
              className: "code-line",
              children: ["    ", _jsx(_components.span, {
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
              }), _jsx(_components.span, {
                className: "token string",
                children: "'http://localhost:3501/pong'"
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
                className: "token function",
                children: "expect"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), "response", _jsx(_components.span, {
                className: "token punctuation",
                children: "."
              }), _jsx(_components.span, {
                className: "token property-access",
                children: "ok"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: ")"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "."
              }), _jsx(_components.span, {
                className: "token method function property-access",
                children: "toBe"
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
        })
      }), _jsx(TabItem, {
        value: "mocha",
        children: _jsx(_components.pre, {
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
                }), " before", _jsx(_components.span, {
                  className: "token punctuation",
                  children: ","
                }), " beforeEach", _jsx(_components.span, {
                  className: "token punctuation",
                  children: ","
                }), " it ", _jsx(_components.span, {
                  className: "token punctuation",
                  children: "}"
                })]
              }), " ", _jsx(_components.span, {
                className: "token keyword module",
                children: "from"
              }), " ", _jsx(_components.span, {
                className: "token string",
                children: "'@effection/mocha'"
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
                }), " createServer ", _jsx(_components.span, {
                  className: "token punctuation",
                  children: "}"
                })]
              }), " ", _jsx(_components.span, {
                className: "token keyword module",
                children: "from"
              }), " ", _jsx(_components.span, {
                className: "token string",
                children: "'./server'"
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
                children: "describe"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), _jsx(_components.span, {
                className: "token string",
                children: '"a server"'
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: ","
              }), " ", _jsx(_components.span, {
                className: "token punctuation",
                children: "("
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
                className: "token function",
                children: "before"
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
                className: "token comment",
                children: "// started once before both `it` blocks"
              }), "\n"]
            }), _jsxs(_components.span, {
              className: "code-line",
              children: ["    ", _jsx(_components.span, {
                className: "token comment",
                children: "// stopped once after both `it` blocks"
              }), "\n"]
            }), _jsxs(_components.span, {
              className: "code-line",
              children: ["    ", _jsx(_components.span, {
                className: "token keyword control-flow",
                children: "yield"
              }), " ", _jsx(_components.span, {
                className: "token function",
                children: "createServer"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "{"
              }), " ", _jsx(_components.span, {
                className: "token literal-property property",
                children: "port"
              }), _jsx(_components.span, {
                className: "token operator",
                children: ":"
              }), " ", _jsx(_components.span, {
                className: "token number",
                children: "3500"
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
                className: "token function",
                children: "beforeEach"
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
                className: "token comment",
                children: "// started before every `it` block"
              }), "\n"]
            }), _jsxs(_components.span, {
              className: "code-line",
              children: ["    ", _jsx(_components.span, {
                className: "token comment",
                children: "// stopped after every `it` block,"
              }), "\n"]
            }), _jsxs(_components.span, {
              className: "code-line",
              children: ["    ", _jsx(_components.span, {
                className: "token keyword control-flow",
                children: "yield"
              }), " ", _jsx(_components.span, {
                className: "token function",
                children: "createServer"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "{"
              }), " ", _jsx(_components.span, {
                className: "token literal-property property",
                children: "port"
              }), _jsx(_components.span, {
                className: "token operator",
                children: ":"
              }), " ", _jsx(_components.span, {
                className: "token number",
                children: "3501"
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
                className: "token function",
                children: "it"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), _jsx(_components.span, {
                className: "token string",
                children: "'can be pinged'"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: ","
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
              }), _jsx(_components.span, {
                className: "token string",
                children: "'http://localhost:3500/ping'"
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
                className: "token function",
                children: "expect"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), "response", _jsx(_components.span, {
                className: "token punctuation",
                children: "."
              }), _jsx(_components.span, {
                className: "token property-access",
                children: "ok"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: ")"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "."
              }), _jsx(_components.span, {
                className: "token method function property-access",
                children: "toBe"
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
            }), _jsx(_components.span, {
              className: "code-line",
              children: "\n"
            }), _jsxs(_components.span, {
              className: "code-line",
              children: ["    ", _jsx(_components.span, {
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
              }), _jsx(_components.span, {
                className: "token string",
                children: "'http://localhost:3501/ping'"
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
                className: "token function",
                children: "expect"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), "response", _jsx(_components.span, {
                className: "token punctuation",
                children: "."
              }), _jsx(_components.span, {
                className: "token property-access",
                children: "ok"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: ")"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "."
              }), _jsx(_components.span, {
                className: "token method function property-access",
                children: "toBe"
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
                className: "token function",
                children: "it"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), _jsx(_components.span, {
                className: "token string",
                children: "'can be ponged'"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: ","
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
              }), _jsx(_components.span, {
                className: "token string",
                children: "'http://localhost:3500/pong'"
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
                className: "token function",
                children: "expect"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), "response", _jsx(_components.span, {
                className: "token punctuation",
                children: "."
              }), _jsx(_components.span, {
                className: "token property-access",
                children: "ok"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: ")"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "."
              }), _jsx(_components.span, {
                className: "token method function property-access",
                children: "toBe"
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
            }), _jsx(_components.span, {
              className: "code-line",
              children: "\n"
            }), _jsxs(_components.span, {
              className: "code-line",
              children: ["    ", _jsx(_components.span, {
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
              }), _jsx(_components.span, {
                className: "token string",
                children: "'http://localhost:3501/pong'"
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
                className: "token function",
                children: "expect"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "("
              }), "response", _jsx(_components.span, {
                className: "token punctuation",
                children: "."
              }), _jsx(_components.span, {
                className: "token property-access",
                children: "ok"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: ")"
              }), _jsx(_components.span, {
                className: "token punctuation",
                children: "."
              }), _jsx(_components.span, {
                className: "token method function property-access",
                children: "toBe"
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
        })
      })]
    }), "\n", _jsxs(_components.h3, {
      id: "caveats",
      className: "group",
      children: ["Caveats", _jsx(_components.a, {
        className: "opacity-0 group-hover:opacity-100 after:content-['#']",
        href: "#caveats",
        children: _jsx(_components.span, {
          className: "icon icon-link"
        })
      })]
    }), "\n", _jsx(_components.p, {
      children: ":::note Jest"
    }), "\n", _jsxs(_components.p, {
      children: ["There is currently a ", _jsx(_components.a, {
        href: "https://github.com/facebook/jest/issues/12259",
        children: "critical bug in\nJest"
      }), " that causes\nteardown hooks to be completely ignored if you hit ", _jsx(_components.code, {
        children: "CTRL-C"
      }), " while your\ntests are running. This is true for any Jest test whether you're using\nEffection or not, but you must be careful about interrupting your\ntests from the command line while they are running as it can have\nunknown consequences."]
    }), "\n", _jsxs(_components.p, {
      children: ["If you'd like to see this fixed, please ", _jsx(_components.a, {
        href: "https://github.com/facebook/jest/issues/12259",
        children: "go to the\nissue"
      }), " and leave a\ncomment."]
    }), "\n", _jsx(_components.p, {
      children: ":::"
    }), "\n", _jsxs(_components.h2, {
      id: "other-frameworks",
      className: "group",
      children: ["Other Frameworks", _jsx(_components.a, {
        className: "opacity-0 group-hover:opacity-100 after:content-['#']",
        href: "#other-frameworks",
        children: _jsx(_components.span, {
          className: "icon icon-link"
        })
      })]
    }), "\n", _jsxs(_components.p, {
      children: ["Have a favorite testing tool that you don't see listed here that you\nthink could benefit from a first class Effection integration? Feel\nfree to ", _jsx(_components.a, {
        href: "https://github.com/thefrontside/effection/issues/new",
        children: "create an issue for\nit"
      }), " or ", _jsx(_components.a, {
        href: "https://discord.gg/r6AvtnU",
        children: "drop\ninto discord"
      }), " and let us know!"]
    })]
  });
}
function MDXContent(props = {}) {
  const { wrapper: MDXLayout } = props.components || {};
  return MDXLayout ? _jsx(MDXLayout, Object.assign({}, props, {
    children: _jsx(_createMdxContent, props)
  })) : _createMdxContent(props);
}
var testing_default = MDXContent;
function _missingMdxReference(id, component) {
  throw new Error("Expected " + (component ? "component" : "object") + " `" + id + "` to be defined: you likely forgot to import, pass, or provide it.");
}
export {
  testing_default as default,
  frontmatter
};
