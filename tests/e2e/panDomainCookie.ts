const { createCookie } = require("@guardian/pan-domain-node/dist/src/panda") as {
    createCookie: (user: Record<string, unknown>, privateKey: string) => string;
};
const { base64ToPEM } = require("@guardian/pan-domain-node/dist/src/utils") as {
    base64ToPEM: (key: string, headerFooter: string) => string;
};

function formatPrivateKeyForSigning(rawPrivateKey: string): string {
    const trimmedKey = rawPrivateKey.trim();

    if (trimmedKey.includes("-----BEGIN")) {
        return trimmedKey.replace(/\\n/g, "\n");
    }

    const normalizedBase64Key = trimmedKey
        .replace(/\\n/g, "")
        .replace(/\s+/g, "");

    return base64ToPEM(normalizedBase64Key, "RSA PRIVATE");
}

export function createPanDomainCookie(rawPrivateKey: string): string {
    if (!rawPrivateKey) {
        throw new Error("privateKey was not supplied to createPanDomainCookie");
    }

    const privateKey = formatPrivateKeyForSigning(rawPrivateKey);
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
