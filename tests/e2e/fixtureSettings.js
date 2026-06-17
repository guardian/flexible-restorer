const path = require("path");
const fs = require("fs");

function parseSettingsFile(settingsText) {
    return settingsText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith("#"))
        .reduce((acc, line) => {
            const separatorIndex = line.indexOf("=");
            if (separatorIndex <= 0) {
                return acc;
            }

            const key = line.slice(0, separatorIndex).trim();
            const value = line.slice(separatorIndex + 1).trim();
            acc[key] = value;
            return acc;
        }, {});
}

function readFixtureSettings(
    projectRoot,
    fileName = "local.dev-gutools.co.uk.settings",
) {
    const settingsFilePath = path.join(projectRoot, "fixtures", fileName);
    const settingsText = fs.readFileSync(settingsFilePath, "utf8");
    const settings = parseSettingsFile(settingsText);

    return {
        settings,
        settingsFilePath,
    };
}

module.exports = {
    parseSettingsFile,
    readFixtureSettings,
};
