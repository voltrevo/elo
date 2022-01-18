const fs = require('fs');
const path = require('path');

const CopyPlugin = require('copy-webpack-plugin');

// eslint-disable-next-line import/no-extraneous-dependencies
const webpack = require('webpack');

const eloConfig = JSON.parse(fs.readFileSync(require.resolve('./config.json'), 'utf-8'));

const config = {
  common: {
    entry: {
      popup: './build/js/src/web-frontends/extension/popup.js',
      'elo-page': './build/js/src/web-frontends/extension/elo-page.js',
      contentScript: './build/js/src/web-frontends/extension/contentScript.js',
      pageContentScript: './build/js/src/web-frontends/extension/pageContentScript.js',
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
      contentBase: path.join(__dirname, 'build', 'extension'),
    },
    plugins: [
      new CopyPlugin({
        patterns: [
          'static/extension',
          { from: 'build/css/extension.css', to: 'css/extension.css' },
          { from: 'build/css/extension.css.map', to: 'css/extension.css.map' },
          { from: 'build/css/elo-page.css', to: 'css/elo-page.css' },
          { from: 'build/css/elo-page.css.map', to: 'css/elo-page.css.map' },
        ],
      }),
      new webpack.DefinePlugin({
        'process.env.ELO_CONFIG_API': JSON.stringify(eloConfig.api),
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
