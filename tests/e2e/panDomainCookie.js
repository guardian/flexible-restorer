const { createCookie } = require("@guardian/pan-domain-node/dist/src/panda");
const { base64ToPEM } = require("@guardian/pan-domain-node/dist/src/utils");
const { readFixtureSettings } = require("./fixtureSettings");

function readPrivateKeyFromFixture(projectRoot) {
    const { settings, settingsFilePath } = readFixtureSettings(projectRoot);

    if (!settings.privateKey) {
        throw new Error(
            `privateKey was not found in settings file: ${settingsFilePath}`,
        );
    }

    return settings.privateKey;
}

function formatPrivateKeyForSigning(rawPrivateKey) {
    const trimmedKey = rawPrivateKey.trim();

    if (trimmedKey.includes("-----BEGIN")) {
        return trimmedKey.replace(/\\n/g, "\n");
    }

    const normalizedBase64Key = trimmedKey
        .replace(/\\n/g, "")
        .replace(/\s+/g, "");

    return base64ToPEM(normalizedBase64Key, "RSA PRIVATE");
}

function createPanDomainCookie(projectRoot) {
    const privateKey = formatPrivateKeyForSigning(
        readPrivateKeyFromFixture(projectRoot),
    );
    return createCookie(
        {
            firstName: "Playwright",
            lastName: "Tester",
            email: "composer.application@guardian.co.uk",
            authenticatingSystem: "restorer-e2e",
            authenticatedIn: ["restorer-e2e"],
            expires: Date.now() + 60 * 60 * 1000,
            multifactor: true,
        },
        privateKey,
    );
}

module.exports = {
    createPanDomainCookie,
};
