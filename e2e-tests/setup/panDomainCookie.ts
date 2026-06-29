const { createCookie } =
    require("@guardian/pan-domain-node/dist/src/panda") as {
        createCookie: (
            user: Record<string, unknown>,
            privateKey: string,
        ) => string;
    };
const { base64ToPEM } = require("@guardian/pan-domain-node/dist/src/utils") as {
    base64ToPEM: (key: string, headerFooter: string) => string;
};

/**
 * Maps test roles to the email addresses used when signing the pan-domain cookie.
 *
 * Each email here must correspond to a userId override in the permissions fixture
 * (`fixtures/permissions/permissions.json`), which is what grants or denies
 * `restorer_access` for that user. Adding a role here without a matching entry in
 * the fixture means the cookie's email won't resolve to the expected permissions.
 *
 * - `default`: `composer.application@guardian.co.uk` — has `restorer_access`.
 * - `NoRestoreAccess`: `no.restore@guardian.co.uk` — does NOT have `restorer_access`.
 * - `RestoreSingleStack`: `restore.single.stack@guardian.co.uk` — has `restore_content`
 *   but NOT `restore_content_to_any_stack`, so can only restore to the snapshot's own system.
 */
export const roles = {
    default: "composer.application@guardian.co.uk",
    NoRestoreAccess: "no.restore@guardian.co.uk",
    RestoreSingleStack: "restore.single.stack@guardian.co.uk",
} as const;

export type Role = keyof typeof roles;

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

export function createPanDomainCookie(
    rawPrivateKey: string,
    role: Role = "default",
): string {
    if (!rawPrivateKey) {
        throw new Error("privateKey was not supplied to createPanDomainCookie");
    }

    const privateKey = formatPrivateKeyForSigning(rawPrivateKey);
    return createCookie(
        {
            firstName: "Playwright",
            lastName: "Tester",
            email: roles[role],
            authenticatingSystem: "composer-restorer",
            authenticatedIn: ["composer-restorer"],
            expires: Date.now() + 60 * 60 * 1000,
            multifactor: true,
        },
        privateKey,
    );
}
