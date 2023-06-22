import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "html/jsx-runtime";
const frontmatter = {
  "id": "inspector",
  "title": "Inspector"
};
function _createMdxContent(props) {
  const _components = Object.assign({
    nav: "nav",
    ol: "ol",
    li: "li",
    a: "a",
    p: "p",
    img: "img",
    h2: "h2",
    span: "span",
    code: "code",
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
            href: "#using-the-node-inspector",
            children: "Using the node inspector"
          })
        }), _jsx(_components.li, {
          className: "toc-item toc-item-h2",
          children: _jsx(_components.a, {
            className: "toc-link toc-link-h2",
            href: "#improving-the-output",
            children: "Improving the output"
          })
        })]
      })
    }), "\n", _jsx(_components.p, {
      children: "We have created a powerful visual inspector for Effection. The inspector can\nshow you which tasks are currently running. You can click on a task to focus in\non it, see which tasks completed or failed and more."
    }), "\n", _jsx(_components.p, {
      children: _jsx(_components.img, {
        src: "/images/inspector-screenshot.png",
        alt: "The Visual Inspector"
      })
    }), "\n", _jsxs(_components.h2, {
      id: "using-the-node-inspector",
      className: "group",
      children: ["Using the node inspector", _jsx(_components.a, {
        className: "opacity-0 group-hover:opacity-100 after:content-['#']",
        href: "#using-the-node-inspector",
        children: _jsx(_components.span, {
          className: "icon icon-link"
        })
      })]
    }), "\n", _jsxs(_components.p, {
      children: ["Install the ", _jsx(_components.code, {
        children: "@effection/inspect"
      }), " package:"]
    }), "\n", _jsx(_components.pre, {
      children: _jsx(_components.code, {
        className: "code-highlight",
        children: _jsx(_components.span, {
          className: "code-line",
          children: "npm install @effection/inspect --save-dev\n"
        })
      })
    }), "\n", _jsx(_components.p, {
      children: "You will need to import this package, and there are two main options that we\nrecommend for doing so."
    }), "\n", _jsxs(_components.p, {
      children: ["The first option is to import it from the entry point of your application (for\nexample ", _jsx(_components.code, {
        children: "src/index.js"
      }), " or similar):"]
    }), "\n", _jsx(_components.pre, {
      children: _jsx(_components.code, {
        className: "code-highlight",
        children: _jsx(_components.span, {
          className: "code-line",
          children: "import '@effection/inspect'\n"
        })
      })
    }), "\n", _jsxs(_components.p, {
      children: ["The second option is to run your ", _jsx(_components.code, {
        children: "node"
      }), " command with ", _jsx(_components.code, {
        children: "-r @effection/inspect"
      }), ":"]
    }), "\n", _jsx(_components.pre, {
      children: _jsx(_components.code, {
        className: "code-highlight",
        children: _jsx(_components.span, {
          className: "code-line",
          children: "node -r @effection/inspect src/index.js\n"
        })
      })
    }), "\n", _jsx(_components.p, {
      children: "Once your application starts, you should see Effection print a message like this:"
    }), "\n", _jsx(_components.pre, {
      children: _jsx(_components.code, {
        className: "code-highlight",
        children: _jsx(_components.span, {
          className: "code-line",
          children: "[effection] inspector available on http://localhost:34556\n"
        })
      })
    }), "\n", _jsx(_components.p, {
      children: "Open the URL in a browser and you should see the visual inspector."
    }), "\n", _jsxs(_components.h2, {
      id: "improving-the-output",
      className: "group",
      children: ["Improving the output", _jsx(_components.a, {
        className: "opacity-0 group-hover:opacity-100 after:content-['#']",
        href: "#improving-the-output",
        children: _jsx(_components.span, {
          className: "icon icon-link"
        })
      })]
    }), "\n", _jsxs(_components.p, {
      children: ["To clarify the output produced by the inspector it can be very helpful to add\n", _jsx(_components.a, {
        href: "/docs/guides/labels",
        children: "labels"
      }), " to your tasks."]
    })]
  });
}
function MDXContent(props = {}) {
  const { wrapper: MDXLayout } = props.components || {};
  return MDXLayout ? _jsx(MDXLayout, Object.assign({}, props, {
    children: _jsx(_createMdxContent, props)
  })) : _createMdxContent(props);
}
var inspector_default = MDXContent;
export {
  inspector_default as default,
  frontmatter
};
