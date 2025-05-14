const path = require('path');
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

module.exports = {
  target: 'web',
  mode: "production",
  experiments: {
    outputModule: true,
  },
  entry: './src/main.ts',
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      "@": path.resolve(__dirname, 'src/'),
      "@assets": path.resolve(__dirname, 'assets/'),
    },
  },
  output: {
    filename: 'app.js',
    path: path.resolve(__dirname, 'dist'),
    library: {
      type: "module",
    },
  },
  performance: {
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: "index.html",
      template: "src/index.html",
      scriptLoading: "module",
    }),
    new MiniCssExtractPlugin({
      filename: "styles.css",
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: 'ts-loader',
      },
      {
        test: /\.css$/,
        exclude: /node_modules/,
        sideEffects: true,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: "css-loader",
            options: {
              modules: {
                mode: "local",
                auto: true,
                exportGlobals: true,
                localIdentName: "[path][name]__[local]--[hash:base64:5]",
                localIdentContext: path.resolve(__dirname, "src"),
                localIdentHashSalt: "my-custom-hash",
                namedExport: true,
                exportLocalsConvention: "as-is",
                exportOnlyLocals: false,
                getJSON: ({ resourcePath, imports, exports, replacements }) => {},
              },
            }
          }
        ],
      },
      {
        test: /\.(png|jpg|jpeg)$/i,
        exclude: /node_modules/,
        loader: 'file-loader',
        options: {
            name: '[path][name].[ext]'
        },
      },
      {
        test: /\.(glb)$/i,
        exclude: /node_modules/,
        loader: 'file-loader',
        options: {
            name: '[path][name].[ext]'
        },
      },
      {
        test: /\.(glsl)$/i,
        exclude: /node_modules/,
        type: 'asset/source',
      },
    ],
  },
  optimization: {
    minimize: true,
    minimizer: [
      new CssMinimizerPlugin(),
    ],
  },
  externals: [
    { 'jquery': 'window jQuery' },
    { 'three': 'module three' },
    { 'dat.gui': 'window dat'},
    function ({ context, request }, callback) {
      if (/^@material\/web\/*/.test(request)) {
        return callback(null, 'import ' + request);
      }
      callback();
    },
  ],
};
