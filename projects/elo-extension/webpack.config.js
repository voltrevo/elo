const path = require('path');

const CopyPlugin = require('copy-webpack-plugin');

const config = {
  common: {
    entry: {
      'elo-page': './build/js/src/elo-extension/elo-page.js',
      'zoom-holding-page': './build/js/src/elo-extension/zoom-holding-page.js',
      'zoom-external-capture': './build/js/src/elo-extension/zoom-external-capture.js',
      contentScript: './build/js/src/elo-extension/contentScript.js',
      pageContentScript: './build/js/src/elo-extension/pageContentScript.js',
      backgroundScript: './build/js/src/elo-extension/backgroundScript.js',
      hardenPasswordWorker: './build/js/src/elo-page/hardenPasswords/worker.js',
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
      path: path.join(__dirname, 'build', 'extension'),
      publicPath: '/',
    },
    devServer: {
      contentBase: path.join(__dirname, 'build'),
    },
    plugins: [
      new CopyPlugin({
        patterns: [
          'static',
        ],
      }),
    ],
  },
  dev: {
    mode: 'development',
    devtool: 'source-map',
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
