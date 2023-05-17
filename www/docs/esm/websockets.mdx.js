import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "html/jsx-runtime";
const frontmatter = {
  "id": "websockets",
  "title": "WebSocket"
};
function _createMdxContent(props) {
  const _components = Object.assign({
    nav: "nav",
    ol: "ol",
    p: "p",
    em: "em"
  }, props.components);
  return _jsxs(_Fragment, {
    children: [_jsx(_components.nav, {
      className: "fixed top-0 right-0",
      children: _jsx(_components.ol, {
        className: "toc-level toc-level-1"
      })
    }), "\n", _jsx(_components.p, {
      children: _jsx(_components.em, {
        children: "Coming soon!"
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
var websockets_default = MDXContent;
export {
  websockets_default as default,
  frontmatter
};
