const path = require('path');

const CopyPlugin = require('copy-webpack-plugin');

const config = {
  common: {
    entry: {
      index: './build/js/src/web-frontends/index.js',
      ide: './build/js/src/web-frontends/ide/index.js',
      explorer: './build/js/src/web-frontends/explorer/index.js',
      monaco: './build/js/src/web-frontends/ide/monaco/index.js',
      'editor.worker': 'monaco-editor/esm/vs/editor/editor.worker.js',
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          enforce: 'pre',
          use: ['source-map-loader'],
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
        {
          test: /\.ttf$/,
          type: 'asset/resource',
        },
      ],
    },
    output: {
      filename: '[name].bundle.js',
      path: path.join(__dirname, 'build', 'web'),
      publicPath: '/',
    },
    devServer: {
      contentBase: path.join(__dirname, 'build', 'web'),
    },
    plugins: [
      new CopyPlugin({
        patterns: [
          'static',
          { from: 'build/css', to: 'css' },
        ],
      }),
    ],
  },
  dev: {
    mode: 'development',
    devtool: 'eval-source-map',
  },
  prod: {
    mode: 'production',
    // devtool: 'inline-source-map',
  },
};

module.exports = {
  ...config.common,
  ...(process.env.PRODUCTION ? config.prod : config.dev),
};
