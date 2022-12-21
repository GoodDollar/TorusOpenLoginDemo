const webpack = require("webpack");

module.exports = function override(config) {
  const { resolve, plugins = [] } = config
  const { fallback = {} } = resolve;

  return {
    ...config,
    ignoreWarnings: [
      /Failed to parse source map/
    ],
    resolve: {
      ...resolve,
      fallback: {
        ...fallback,
        crypto: require.resolve("crypto-browserify"),
        stream: require.resolve("stream-browserify"),
        assert: require.resolve("assert"),
        http: require.resolve("stream-http"),
        https: require.resolve("https-browserify"),
        os: require.resolve("os-browserify"),
        url: require.resolve("url"),
      },      
    },
    plugins: [
      ...plugins,
      new webpack.ProvidePlugin({
        process: "process/browser",
        Buffer: ["buffer", "Buffer"],
      }),
    ],
  };
};
