const path = require('path');

const CopyPlugin = require('copy-webpack-plugin');

// eslint-disable-next-line import/no-extraneous-dependencies
const webpack = require('webpack');

const config = {
  common: {
    entry: {
      index: './build/js/src/web-frontends/demo/index.js',
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
      path: path.join(__dirname, 'build', 'demo'),
      publicPath: '/',
    },
    devServer: {
      contentBase: path.join(__dirname, 'build', 'demo'),
    },
    plugins: [
      new CopyPlugin({
        patterns: [
          'static/demo',
          { from: 'build/css/demo.css', to: 'css/demo.css' },
          { from: 'build/css/demo.css.map', to: 'css/demo.css.map' },
        ],
      }),
      new webpack.DefinePlugin({
        'process.env.API_HOST_AND_PORT': JSON.stringify(
          process.env.API_HOST_AND_PORT ?? 'localhost:36582',
        ),
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
