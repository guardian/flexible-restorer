const path = require("path");
const webpack = require("webpack");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

// Root-absolute URLs (e.g. `/assets/fonts/...`) are served at runtime by Play,
// so webpack must not try to resolve/bundle them. Relative URLs are still bundled.
const cssLoader = {
    loader: "css-loader",
    options: {
        url: {
            filter: (url) => !url.startsWith("/"),
        },
    },
};

module.exports = {
    plugins: [
        new MiniCssExtractPlugin(),
        // webpack 5 no longer polyfills Node globals. mediator-js references
        // `process.env.MEDIATOR_JS_COV` at module load, which would throw
        // `process is not defined` in the browser; define it so it resolves to
        // a falsy value and the standard (non-coverage) build is used.
        new webpack.DefinePlugin({
            "process.env.MEDIATOR_JS_COV": JSON.stringify(false),
        }),
    ],
    entry: "./public/javascripts/app/main.js",
    output: {
        path: path.resolve(__dirname, "public/dist"),
        filename: "main.js",
    },
    devtool: "source-map",
    module: {
        rules: [
            {
                // webpack 5 has native asset modules; `asset/inline` replaces
                // svg-url-loader and inlines SVGs as `data:image/svg+xml` URIs
                // (matching the previous inlined-icon behaviour).
                test: /\.svg$/,
                type: "asset/inline",
            },
            {
                test: /\.scss$/i,
                use: [
                    MiniCssExtractPlugin.loader,
                    cssLoader,
                    {
                        loader: "sass-loader",
                        options: {
                            sassOptions: {
                                // The SCSS partials import each other relative to
                                // the public/sass root (e.g. `@import "palette.scss"`),
                                // so expose it as a load path for Dart Sass.
                                loadPaths: [
                                    path.resolve(__dirname, "public/sass"),
                                ],
                            },
                        },
                    },
                ],
            },
            {
                test: /\.css$/i,
                use: [MiniCssExtractPlugin.loader, cssLoader],
            },
        ],
    },
};
