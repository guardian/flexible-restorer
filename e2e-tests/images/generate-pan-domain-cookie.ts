const { generatePanDomainKeys } = require("../setup/panDomainKeys") as typeof import("../setup/panDomainKeys");
const { createPanDomainCookie } = require("../setup/panDomainCookie") as typeof import("../setup/panDomainCookie");

// This cookie is baked into the nginx image at build time and may be served from
// Docker's build cache across many rebuilds, so it is given a far-future expiry
// to avoid silently going stale between rebuilds.
const TEN_YEARS_MS = 10 * 365 * 24 * 60 * 60 * 1000;

const { privateKeyPem } = generatePanDomainKeys();
process.stdout.write(
    createPanDomainCookie(privateKeyPem, "default", TEN_YEARS_MS),
);