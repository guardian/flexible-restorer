import fs from "fs";
import path from "path";

export type FixtureSettings = Record<string, string>;

export function parseSettingsFile(settingsText: string): FixtureSettings {
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
        }, {} as FixtureSettings);
}

export function readFixtureSettings(
    projectRoot: string,
    fileName = path.join(
        "pan-domain-settings",
        "local.dev-gutools.co.uk.settings",
    ),
): { settings: FixtureSettings; settingsFilePath: string } {
    const settingsFilePath = path.join(projectRoot, "fixtures", fileName);
    const settingsText = fs.readFileSync(settingsFilePath, "utf8");
    const settings = parseSettingsFile(settingsText);

    return {
        settings,
        settingsFilePath,
    };
}
