// Jest config for frontend (AngularJS + React) unit tests. Babel options are
// supplied inline here rather than via a shared babel config file so this
// transform stays isolated from the webpack build (which passes its own inline
// Babel options).
module.exports = {
    testEnvironment: "jsdom",
    setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
    testMatch: ["<rootDir>/public/javascripts/**/*.test.{js,ts,tsx}"],
    moduleNameMapper: {
        "\\.(svg|png|jpe?g|gif|css|scss)$": "<rootDir>/jest.assetMock.js",
    },
    transform: {
        "^.+\\.[jt]sx?$": [
            "babel-jest",
            {
                presets: [
                    ["@babel/preset-env", { targets: { node: "current" } }],
                    [
                        "@babel/preset-react",
                        { runtime: "automatic", importSource: "@emotion/react" },
                    ],
                    "@babel/preset-typescript",
                ],
            },
        ],
    },
};
