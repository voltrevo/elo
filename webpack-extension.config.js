const path = require('path');

const CopyPlugin = require('copy-webpack-plugin');

const config = {
  common: {
    entry: {
      index: './build/js/src/web-frontends/extension/index.js',
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
