const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
    plugins: [new MiniCssExtractPlugin()],
    entry: './public/javascripts/app/main.js',
    output: {
        path: path.resolve(__dirname, 'public/dist'),
        filename: 'main.js'
    },
    module: {
        rules: [
            {
                test: /\.svg$/,
                loader: 'svg-url-loader'
            },
            {
                test: /\.scss$/i,
                use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
              },
        ]
    }
};