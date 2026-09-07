// Jest config for frontend (AngularJS) unit tests. Babel options are supplied
// inline here rather than via a shared babel config file so this transform stays
// isolated from the webpack build (which passes its own inline Babel options).
module.exports = {
    testEnvironment: "node",
    testMatch: ["<rootDir>/public/javascripts/**/*.test.js"],
    transform: {
        "^.+\\.jsx?$": [
            "babel-jest",
            {
                presets: [["@babel/preset-env", { targets: { node: "current" } }]],
            },
        ],
    },
};
