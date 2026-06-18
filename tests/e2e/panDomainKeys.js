const { generateKeyPairSync } = require("crypto");

function pemToBase64(key) {
    return key
        .replace(/-----BEGIN [^-]+-----/g, "")
        .replace(/-----END [^-]+-----/g, "")
        .replace(/\s+/g, "");
}

function generatePanDomainKeys() {
    const { privateKey, publicKey } = generateKeyPairSync("rsa", {
        modulusLength: 4096,
        publicKeyEncoding: {
            type: "spki",
            format: "pem",
        },
        privateKeyEncoding: {
            type: "pkcs8",
            format: "pem",
        },
    });

    return {
        privateKeyPem: privateKey,
        privateKeyBase64: pemToBase64(privateKey),
        publicKeyBase64: pemToBase64(publicKey),
    };
}

module.exports = {
    pemToBase64,
    generatePanDomainKeys,
};
