const path = require('path');
const webpack = require('webpack'); // 用于访问内置插件
const MinifyPlugin = require("babel-minify-webpack-plugin");
module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'plugin.min.js',
    path: path.resolve(__dirname, 'dist')
  },
  plugins: [new MinifyPlugin(minifyOpts, pluginOpts)]
};