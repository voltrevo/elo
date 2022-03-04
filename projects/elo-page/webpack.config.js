const path = require('path');

const CopyPlugin = require('copy-webpack-plugin');

const webpackConfig = {
  common: {
    entry: {
      index: './build/js/src/elo-page/index.js',
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
      path: path.join(__dirname, 'build'),
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
  ...webpackConfig.common,
  ...(process.env.PRODUCTION ? webpackConfig.prod : webpackConfig.dev),
};
