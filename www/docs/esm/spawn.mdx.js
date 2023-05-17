import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "html/jsx-runtime";
const frontmatter = {
  "id": "spawn",
  "title": "Spawn"
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
    h3: "h3"
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
            href: "#using-asyncawait",
            children: "Using async/await"
          })
        }), _jsx(_components.li, {
          className: "toc-item toc-item-h3",
          children: _jsx(_components.a, {
            className: "toc-link toc-link-h3",
            href: "#cancellation",
            children: "Cancellation"
          })
        }), _jsx(_components.li, {
          className: "toc-item toc-item-h3",
          children: _jsx(_components.a, {
            className: "toc-link toc-link-h3",
            href: "#effection",
            children: "Effection"
          })
        }), _jsx(_components.li, {
          className: "toc-item toc-item-h3",
          children: _jsx(_components.a, {
            className: "toc-link toc-link-h3",
            href: "#introducing-spawn",
            children: "Introducing spawn"
          })
        }), _jsx(_components.li, {
          className: "toc-item toc-item-h3",
          children: _jsx(_components.a, {
            className: "toc-link toc-link-h3",
            href: "#using-combinators",
            children: "Using combinators"
          })
        }), _jsx(_components.li, {
          className: "toc-item toc-item-h3",
          children: _jsx(_components.a, {
            className: "toc-link toc-link-h3",
            href: "#direct-spawning",
            children: "Direct spawning"
          })
        })]
      })
    }), "\n", _jsxs(_components.p, {
      children: ["Suppose we are using the ", _jsx(_components.code, {
        children: "fetchWeekDay"
      }), " function from the introduction to fetch the current weekday in multiple timezones:"]
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
          }), " dayUS ", _jsx(_components.span, {
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
            className: "token keyword",
            children: "let"
          }), " daySweden ", _jsx(_components.span, {
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
            children: "'cet'"
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
              }), "dayUS", _jsx(_components.span, {
                className: "token interpolation-punctuation punctuation",
                children: "}"
              })]
            }), _jsx(_components.span, {
              className: "token string",
              children: ", in the US and "
            }), _jsxs(_components.span, {
              className: "token interpolation",
              children: [_jsx(_components.span, {
                className: "token interpolation-punctuation punctuation",
                children: "${"
              }), "daySweden", _jsx(_components.span, {
                className: "token interpolation-punctuation punctuation",
                children: "}"
              })]
            }), _jsx(_components.span, {
              className: "token string",
              children: " in Sweden!"
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
      children: ["This works, but it slightly inefficient because we are running the fetches one\nafter the other. How can we run both ", _jsx(_components.code, {
        children: "fetch"
      }), " operations at the same time?"]
    }), "\n", _jsxs(_components.h3, {
      id: "using-asyncawait",
      className: "group",
      children: ["Using ", _jsx(_components.code, {
        children: "async/await"
      }), _jsx(_components.a, {
        className: "opacity-0 group-hover:opacity-100 after:content-['#']",
        href: "#using-asyncawait",
        children: _jsx(_components.span, {
          className: "icon icon-link"
        })
      })]
    }), "\n", _jsxs(_components.p, {
      children: ["If we were just using ", _jsx(_components.code, {
        children: "async/await"
      }), " and not using Effection, we might do\nsomething like this to fetch the dates at the same time:"]
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
          }), " dayUS ", _jsx(_components.span, {
            className: "token operator",
            children: "="
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
            className: "token keyword",
            children: "let"
          }), " daySweden ", _jsx(_components.span, {
            className: "token operator",
            children: "="
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "fetchWeekDay"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token string",
            children: "'cet'"
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
              }), _jsx(_components.span, {
                className: "token keyword control-flow",
                children: "await"
              }), " dayUS", _jsx(_components.span, {
                className: "token interpolation-punctuation punctuation",
                children: "}"
              })]
            }), _jsx(_components.span, {
              className: "token string",
              children: ", in the US and "
            }), _jsxs(_components.span, {
              className: "token interpolation",
              children: [_jsx(_components.span, {
                className: "token interpolation-punctuation punctuation",
                children: "${"
              }), _jsx(_components.span, {
                className: "token keyword control-flow",
                children: "await"
              }), " daySweden", _jsx(_components.span, {
                className: "token interpolation-punctuation punctuation",
                children: "}"
              })]
            }), _jsx(_components.span, {
              className: "token string",
              children: " in Sweden!"
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
          }), "\n"]
        })]
      })
    }), "\n", _jsxs(_components.p, {
      children: ["Or we could use a combinator such as ", _jsx(_components.code, {
        children: "Promise.all"
      }), ":"]
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
            children: "["
          }), "dayUS", _jsx(_components.span, {
            className: "token punctuation",
            children: ","
          }), " daySweden", _jsx(_components.span, {
            className: "token punctuation",
            children: "]"
          }), " ", _jsx(_components.span, {
            className: "token operator",
            children: "="
          }), " ", _jsx(_components.span, {
            className: "token keyword control-flow",
            children: "await"
          }), " ", _jsx(_components.span, {
            className: "token known-class-name class-name",
            children: "Promise"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token method function property-access",
            children: "all"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "["
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
            className: "token function",
            children: "fetchWeekDay"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token string",
            children: "'cet'"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "]"
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
              }), "dayUS", _jsx(_components.span, {
                className: "token interpolation-punctuation punctuation",
                children: "}"
              })]
            }), _jsx(_components.span, {
              className: "token string",
              children: ", in the US and "
            }), _jsxs(_components.span, {
              className: "token interpolation",
              children: [_jsx(_components.span, {
                className: "token interpolation-punctuation punctuation",
                children: "${"
              }), "daySweden", _jsx(_components.span, {
                className: "token interpolation-punctuation punctuation",
                children: "}"
              })]
            }), _jsx(_components.span, {
              className: "token string",
              children: " in Sweden!"
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
          }), "\n"]
        })]
      })
    }), "\n", _jsxs(_components.h3, {
      id: "cancellation",
      className: "group",
      children: ["Cancellation", _jsx(_components.a, {
        className: "opacity-0 group-hover:opacity-100 after:content-['#']",
        href: "#cancellation",
        children: _jsx(_components.span, {
          className: "icon icon-link"
        })
      })]
    }), "\n", _jsx(_components.p, {
      children: "This works fine as long as both fetches complete successfully, but what happens\nwhen one of them fails? Since there is no connection between the two tasks, a\nfailure in one of them has no effect on the other. We will happily keep trying\nto fetch the US date, even when fetching the Swedish date has already failed!"
    }), "\n", _jsxs(_components.p, {
      children: ["For ", _jsx(_components.code, {
        children: "fetch"
      }), ", the consequences of this are not so severe, the worst that happens is\nthat we have a request which is running longer than necessary, but you can imagine\nthat the more complex the operations we're trying to combine, the more opportunity\nfor problems there are."]
    }), "\n", _jsxs(_components.p, {
      children: ['We are calling these situations "dangling promises", and most significantly complex\nJavaScript applications suffer from this problem. ', _jsx(_components.code, {
        children: "async/await"
      }), " fundamentally does\nnot handle cancellation very well when running multiple operations concurrently."]
    }), "\n", _jsxs(_components.h3, {
      id: "effection",
      className: "group",
      children: ["Effection", _jsx(_components.a, {
        className: "opacity-0 group-hover:opacity-100 after:content-['#']",
        href: "#effection",
        children: _jsx(_components.span, {
          className: "icon icon-link"
        })
      })]
    }), "\n", _jsxs(_components.p, {
      children: ["How does Effection deal with this situation? If we wrote the example using\nEffection in the exact same way as the ", _jsx(_components.code, {
        children: "async/await"
      }), " example, then we will find\nthat it doesn't behave the same:"]
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
          }), " dayUS ", _jsx(_components.span, {
            className: "token operator",
            children: "="
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
            className: "token keyword",
            children: "let"
          }), " daySweden ", _jsx(_components.span, {
            className: "token operator",
            children: "="
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "fetchWeekDay"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token string",
            children: "'cet'"
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
              }), _jsx(_components.span, {
                className: "token keyword control-flow",
                children: "yield"
              }), " dayUS", _jsx(_components.span, {
                className: "token interpolation-punctuation punctuation",
                children: "}"
              })]
            }), _jsx(_components.span, {
              className: "token string",
              children: ", in the US and "
            }), _jsxs(_components.span, {
              className: "token interpolation",
              children: [_jsx(_components.span, {
                className: "token interpolation-punctuation punctuation",
                children: "${"
              }), _jsx(_components.span, {
                className: "token keyword control-flow",
                children: "yield"
              }), " daySweden", _jsx(_components.span, {
                className: "token interpolation-punctuation punctuation",
                children: "}"
              })]
            }), _jsx(_components.span, {
              className: "token string",
              children: " in Sweden!"
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
    }), "\n", _jsx(_components.p, {
      children: "This is still running one fetch after the other, and is not fetching both at\nthe same time!"
    }), "\n", _jsxs(_components.p, {
      children: ["To understand why, remember that calling a generator function does not do\nanything by itself, only by passing the generator to ", _jsx(_components.code, {
        children: "yield"
      }), " or ", _jsx(_components.code, {
        children: "run"
      }), " do we\nactually run the generator. So only when we ", _jsx(_components.code, {
        children: "yield"
      }), " to we actually start\nfetching the dates."]
    }), "\n", _jsxs(_components.p, {
      children: ["We could use ", _jsx(_components.code, {
        children: "run"
      }), " here to run our operations, and then wait for them, but this\nis not the correct way:"]
    }), "\n", _jsx(_components.pre, {
      className: "language-javascript",
      children: _jsxs(_components.code, {
        className: "language-javascript code-highlight",
        children: [_jsxs(_components.span, {
          className: "code-line",
          children: [_jsx(_components.span, {
            className: "token comment",
            children: "// THIS IS NOT THE CORRECT WAY!"
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
            }), " main", _jsx(_components.span, {
              className: "token punctuation",
              children: ","
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
          }), " dayUS ", _jsx(_components.span, {
            className: "token operator",
            children: "="
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "run"
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
          }), " daySweden ", _jsx(_components.span, {
            className: "token operator",
            children: "="
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "run"
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
            children: "'cet'"
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
              }), _jsx(_components.span, {
                className: "token keyword control-flow",
                children: "yield"
              }), " dayUS", _jsx(_components.span, {
                className: "token interpolation-punctuation punctuation",
                children: "}"
              })]
            }), _jsx(_components.span, {
              className: "token string",
              children: ", in the US and "
            }), _jsxs(_components.span, {
              className: "token interpolation",
              children: [_jsx(_components.span, {
                className: "token interpolation-punctuation punctuation",
                children: "${"
              }), _jsx(_components.span, {
                className: "token keyword control-flow",
                children: "yield"
              }), " daySweden", _jsx(_components.span, {
                className: "token interpolation-punctuation punctuation",
                children: "}"
              })]
            }), _jsx(_components.span, {
              className: "token string",
              children: " in Sweden!"
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
      children: ["This has the same problem as our ", _jsx(_components.code, {
        children: "async/await"
      }), " example: a failure in one fetch\nhas no effect on the other!"]
    }), "\n", _jsxs(_components.h3, {
      id: "introducing-spawn",
      className: "group",
      children: ["Introducing ", _jsx(_components.code, {
        children: "spawn"
      }), _jsx(_components.a, {
        className: "opacity-0 group-hover:opacity-100 after:content-['#']",
        href: "#introducing-spawn",
        children: _jsx(_components.span, {
          className: "icon icon-link"
        })
      })]
    }), "\n", _jsxs(_components.p, {
      children: ["The ", _jsx(_components.code, {
        children: "spawn"
      }), " operation is Effection's solution to this problem!"]
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
          }), " dayUS ", _jsx(_components.span, {
            className: "token operator",
            children: "="
          }), " ", _jsx(_components.span, {
            className: "token keyword control-flow",
            children: "yield"
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "spawn"
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
          }), " daySweden ", _jsx(_components.span, {
            className: "token operator",
            children: "="
          }), " ", _jsx(_components.span, {
            className: "token keyword control-flow",
            children: "yield"
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "spawn"
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
            children: "'cet'"
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
              }), _jsx(_components.span, {
                className: "token keyword control-flow",
                children: "yield"
              }), " dayUS", _jsx(_components.span, {
                className: "token interpolation-punctuation punctuation",
                children: "}"
              })]
            }), _jsx(_components.span, {
              className: "token string",
              children: ", in the US and "
            }), _jsxs(_components.span, {
              className: "token interpolation",
              children: [_jsx(_components.span, {
                className: "token interpolation-punctuation punctuation",
                children: "${"
              }), _jsx(_components.span, {
                className: "token keyword control-flow",
                children: "yield"
              }), " daySweden", _jsx(_components.span, {
                className: "token interpolation-punctuation punctuation",
                children: "}"
              })]
            }), _jsx(_components.span, {
              className: "token string",
              children: " in Sweden!"
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
      children: ["Like ", _jsx(_components.code, {
        children: "run"
      }), " and ", _jsx(_components.code, {
        children: "main"
      }), ", ", _jsx(_components.code, {
        children: "spawn"
      }), " takes an ", _jsx(_components.code, {
        children: "Operation"
      }), " and returns a ", _jsx(_components.code, {
        children: "Task"
      }), ". The\ndifference is that this ", _jsx(_components.code, {
        children: "Task"
      }), " becomes a child of the current ", _jsx(_components.code, {
        children: "Task"
      }), ". This\nmeans it is impossible for this task to outlive its parent. And it also means\nthat an error in the task will cause the parent to fail."]
    }), "\n", _jsx(_components.p, {
      children: "You can think of this as creating a hierarchy like this:"
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
          children: "  +-- fetchWeekDay('est')\n"
        }), _jsx(_components.span, {
          className: "code-line",
          children: "  |\n"
        }), _jsx(_components.span, {
          className: "code-line",
          children: "  +-- fetchWeekDay('cet')\n"
        })]
      })
    }), "\n", _jsxs(_components.p, {
      children: ["When ", _jsx(_components.code, {
        children: "fetchWeekDay('cet')"
      }), " fails, since it was spawned by ", _jsx(_components.code, {
        children: "main"
      }), ", it will also\ncause ", _jsx(_components.code, {
        children: "main"
      }), " to fail. When ", _jsx(_components.code, {
        children: "main"
      }), " fails it will make sure that none of its\nchildren outlive it, and it will ", _jsx(_components.code, {
        children: "halt"
      }), " all of its remaining children. We end\nup with a situation like this:"]
    }), "\n", _jsx(_components.pre, {
      children: _jsxs(_components.code, {
        className: "code-highlight",
        children: [_jsx(_components.span, {
          className: "code-line",
          children: "+-- main [FAILED]\n"
        }), _jsx(_components.span, {
          className: "code-line",
          children: "  |\n"
        }), _jsx(_components.span, {
          className: "code-line",
          children: "  +-- fetchWeekDay('est') [HALTED]\n"
        }), _jsx(_components.span, {
          className: "code-line",
          children: "  |\n"
        }), _jsx(_components.span, {
          className: "code-line",
          children: "  +-- fetchWeekDay('cet') [FAILED]\n"
        })]
      })
    }), "\n", _jsx(_components.p, {
      children: "Effection tasks are tied to the lifetime of their parent, and it becomes\nimpossible to create a task whose lifetime is undefined. Additionally, the\nbehaviour of errors is very clearly defined. An error in a child will also\ncause the parent to error, which in turn halts any siblings."
    }), "\n", _jsxs(_components.p, {
      children: ["This idea is called ", _jsx(_components.a, {
        href: "https://vorpus.org/blog/notes-on-structured-concurrency-or-go-statement-considered-harmful/",
        children: "structured concurrency"
      }), ", and it has profound effects on\nthe composability of concurrent code."]
    }), "\n", _jsxs(_components.h3, {
      id: "using-combinators",
      className: "group",
      children: ["Using combinators", _jsx(_components.a, {
        className: "opacity-0 group-hover:opacity-100 after:content-['#']",
        href: "#using-combinators",
        children: _jsx(_components.span, {
          className: "icon icon-link"
        })
      })]
    }), "\n", _jsxs(_components.p, {
      children: ["We previously showed how we can use the ", _jsx(_components.code, {
        children: "Promise.all"
      }), " combinator to implement\nthe concurrent fetch. Effection also ships with some combinators, for example\nwe can use the ", _jsx(_components.code, {
        children: "all"
      }), " combinator:"]
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
            }), " all", _jsx(_components.span, {
              className: "token punctuation",
              children: ","
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
          }), " ", _jsx(_components.span, {
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
            children: "["
          }), "dayUS", _jsx(_components.span, {
            className: "token punctuation",
            children: ","
          }), " daySweden", _jsx(_components.span, {
            className: "token punctuation",
            children: "]"
          }), " ", _jsx(_components.span, {
            className: "token operator",
            children: "="
          }), " ", _jsx(_components.span, {
            className: "token keyword control-flow",
            children: "yield"
          }), " ", _jsx(_components.span, {
            className: "token function",
            children: "all"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "["
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
            className: "token function",
            children: "fetchWeekDay"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "("
          }), _jsx(_components.span, {
            className: "token string",
            children: "'cet'"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: "]"
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
              }), "dayUS", _jsx(_components.span, {
                className: "token interpolation-punctuation punctuation",
                children: "}"
              })]
            }), _jsx(_components.span, {
              className: "token string",
              children: ", in the US and "
            }), _jsxs(_components.span, {
              className: "token interpolation",
              children: [_jsx(_components.span, {
                className: "token interpolation-punctuation punctuation",
                children: "${"
              }), "daySweden", _jsx(_components.span, {
                className: "token interpolation-punctuation punctuation",
                children: "}"
              })]
            }), _jsx(_components.span, {
              className: "token string",
              children: " in Sweden!"
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
    }), "\n", _jsxs(_components.h3, {
      id: "direct-spawning",
      className: "group",
      children: ["Direct spawning", _jsx(_components.a, {
        className: "opacity-0 group-hover:opacity-100 after:content-['#']",
        href: "#direct-spawning",
        children: _jsx(_components.span, {
          className: "icon icon-link"
        })
      })]
    }), "\n", _jsxs(_components.p, {
      children: ["Another way of spawning tasks is to call the ", _jsx(_components.code, {
        children: "spawn"
      }), " method on a task:"]
    }), "\n", _jsx(_components.pre, {
      className: "language-javascript",
      children: _jsxs(_components.code, {
        className: "language-javascript code-highlight",
        children: [_jsxs(_components.span, {
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
            className: "token punctuation",
            children: ")"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ";"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["task", _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token method function property-access",
            children: "spawn"
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
            children: ")"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ";"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["task", _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token method function property-access",
            children: "spawn"
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
            children: "'cet'"
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
        })]
      })
    }), "\n", _jsx(_components.p, {
      children: "This is often useful when integrating Effection into existing promise or\ncallback based frameworks."
    }), "\n", _jsx(_components.p, {
      children: "When an Operation is a generator function, the first argument to the generator\nfunction is the current task. We can use this to spawn tasks:"
    }), "\n", _jsx(_components.pre, {
      className: "language-javascript",
      children: _jsxs(_components.code, {
        className: "language-javascript code-highlight",
        children: [_jsxs(_components.span, {
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
          }), "task", _jsx(_components.span, {
            className: "token punctuation",
            children: ")"
          }), " ", _jsx(_components.span, {
            className: "token punctuation",
            children: "{"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["  task", _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token method function property-access",
            children: "spawn"
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
            children: ")"
          }), _jsx(_components.span, {
            className: "token punctuation",
            children: ";"
          }), "\n"]
        }), _jsxs(_components.span, {
          className: "code-line",
          children: ["  task", _jsx(_components.span, {
            className: "token punctuation",
            children: "."
          }), _jsx(_components.span, {
            className: "token method function property-access",
            children: "spawn"
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
            children: "'cet'"
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
      children: "This is basically the same as the previous example."
    })]
  });
}
function MDXContent(props = {}) {
  const { wrapper: MDXLayout } = props.components || {};
  return MDXLayout ? _jsx(MDXLayout, Object.assign({}, props, {
    children: _jsx(_createMdxContent, props)
  })) : _createMdxContent(props);
}
var spawn_default = MDXContent;
export {
  spawn_default as default,
  frontmatter
};
