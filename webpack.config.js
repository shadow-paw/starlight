const path = require('path');

module.exports = {
  target: 'web',
  mode: "production",
  entry: './generated/js/index.js',
  output: {
    filename: 'app.js',
    path: path.resolve(__dirname, 'dist'),
  },
  externals: [
    { 'three': 'root THREE' },
    { 'dat.gui': 'root dat'}
  ]
};