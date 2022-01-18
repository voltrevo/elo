const path = require('path');

const CopyPlugin = require('copy-webpack-plugin');

// eslint-disable-next-line import/no-extraneous-dependencies
const webpack = require('webpack');

const eloConfig = JSON.parse(fs.readFileSync(require.resolve('./config.json'), 'utf-8'));

const config = {
  common: {
    entry: {
      demo: './build/js/src/web-frontends/demo/index.js',
      'labelling-tool': './build/js/src/web-frontends/labelling-tool/index.js',
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
          { from: 'build/css/demo.css', to: 'css/demo.css' },
          { from: 'build/css/demo.css.map', to: 'css/demo.css.map' },
          { from: 'build/css/labelling-tool.css', to: 'css/labelling-tool.css' },
          { from: 'build/css/labelling-tool.css.map', to: 'css/labelling-tool.css.map' },
        ],
      }),
      new webpack.DefinePlugin({
        'process.env.ELO_CONFIG_API': JSON.stringify(eloConfig.api),
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
