const { VanillaExtractPlugin } = require("@vanilla-extract/webpack-plugin");

module.exports = {
  plugins: [new VanillaExtractPlugin()],
};

module.exports = function () {
  return {
    name: "docusaurus-plugin-vanilla-extract",
    configureWebpack() {
      return {
        plugins: [new VanillaExtractPlugin()],
      };
    },
  };
};
