const pkg = require("./package.json");
const babel = require("rollup-plugin-babel");
const filesize = require("rollup-plugin-filesize");
const resolve = require("rollup-plugin-node-resolve");

const babelPlugin = babel({
  babelrc: false,
  comments: false,
  presets: [
    [
      "@babel/preset-env",
      {
        modules: false
      }
    ]
  ]
});

const fileSize = filesize();

module.exports = [
  {
    input: "index.js",
    output: {
      file: pkg.main,
      format: "cjs",
      sourcemap: true
    },
    plugins: [
      resolve(),
      babel({
        babelrc: false,
        comments: false,
        presets: [
          [
            "@babel/preset-env",
            {
              targets: {
                node: "6"
              },
              modules: false
            }
          ]
        ]
      }),
      fileSize
    ]
  },
  {
    input: "index.js",
    output: { file: pkg.module, format: "es", sourcemap: true },
    plugins: [
      resolve(),
      babelPlugin,
      fileSize
    ]
  }
];
