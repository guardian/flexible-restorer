const path = require("path");
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
    ],
    entry: "./public/javascripts/app/main.js",
    output: {
        path: path.resolve(__dirname, "public/dist"),
        filename: "main.js",
    },
    devtool: "source-map",
    resolve: {
        // Allow importing React component modules without the extension.
        extensions: [".ts", ".tsx", ".js", ".jsx"],
    },
    module: {
        rules: [
            {
                // Compile the application's JS/TS(X) modules with Babel.
                // `@guardian/stand` ships as pre-transpiled ESM, so only our
                // own source is processed here.
                test: /\.[jt]sx?$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: [
                            "@babel/preset-env",
                            [
                                "@babel/preset-react",
                                {
                                    runtime: "automatic",
                                    // Always emit the production JSX runtime
                                    // (`jsx`/`jsxs`); the dev runtime's `jsxDEV`
                                    // is absent from React's production build.
                                    development: false,
                                    // Route JSX through emotion's runtime so the
                                    // `css` prop is supported (matches the
                                    // `jsxImportSource` in tsconfig.json).
                                    importSource: "@emotion/react",
                                },
                            ],
                            // Strip TypeScript types. Must run after preset-react
                            // so JSX is still present for it to transform.
                            "@babel/preset-typescript",
                        ],
                    },
                },
            },
            {
                // webpack 5 has native asset modules; `asset/inline` replaces
                // svg-url-loader and inlines SVGs as `data:image/svg+xml` URIs
                // (matching the previous inlined-icon behaviour).
                test: /\.svg$/,
                type: "asset/inline",
            },
            {
                test: /\.css$/i,
                use: [MiniCssExtractPlugin.loader, cssLoader],
            },
        ],
    },
};
