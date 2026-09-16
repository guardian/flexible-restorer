import fs from "fs";
import path from "path";

// Anonymises editorial user identities in snapshot fixtures, matching the
// existing convention: email -> userN@guardian.co.uk, firstName -> "User",
// lastName -> "N". Published contributor bylines and tags are left untouched
// because they are public authorship data. The transform is line-based so the
// Jackson pretty-print formatting of the fixtures is preserved exactly, and it
// is idempotent: already-anonymised blocks are left byte-for-byte unchanged.

const DEFAULT_TARGET = path.resolve(__dirname, "../fixtures/snapshots");

const EMAIL_RE = /^(\s*)"email" : "(.*)"(,?)$/;
const FIRST_NAME_RE = /^(\s*)"firstName" : "(.*)"(,?)$/;
const LAST_NAME_RE = /^(\s*)"lastName" : "(.*)"(,?)$/;
const ANON_EMAIL_RE = /^user(\d+)@/;

function collectJsonFiles(target: string): string[] {
    const stat = fs.statSync(target);
    if (stat.isFile()) {
        return target.endsWith(".json") ? [target] : [];
    }
    return fs
        .readdirSync(target)
        .flatMap((entry) => collectJsonFiles(path.join(target, entry)));
}

/**
 * Build a deterministic realEmail -> userN mapping. Emails are sorted so the
 * numbering is reproducible regardless of file traversal order, and numbers
 * continue past any already-anonymised users so the two never collide.
 */
function buildIdentityMap(files: string[]): Map<string, number> {
    const realEmails = new Set<string>();
    let maxExisting = 0;
    for (const file of files) {
        for (const line of fs.readFileSync(file, "utf8").split("\n")) {
            const match = EMAIL_RE.exec(line);
            if (!match) continue;
            const email = match[2];
            const existing = ANON_EMAIL_RE.exec(email);
            if (existing) {
                maxExisting = Math.max(maxExisting, Number(existing[1]));
            } else {
                realEmails.add(email.toLowerCase());
            }
        }
    }

    const map = new Map<string, number>();
    let next = maxExisting + 1;
    for (const email of [...realEmails].sort()) {
        map.set(email, next++);
    }
    return map;
}

function anonymiseFile(file: string, identities: Map<string, number>): boolean {
    const original = fs.readFileSync(file, "utf8");
    const lines = original.split("\n");
    let currentN: number | null = null;

    const rewritten = lines.map((line) => {
        const emailMatch = EMAIL_RE.exec(line);
        if (emailMatch) {
            const [, indent, email, comma] = emailMatch;
            const existing = ANON_EMAIL_RE.exec(email);
            if (existing) {
                currentN = Number(existing[1]);
                return line;
            }
            currentN = identities.get(email.toLowerCase()) ?? null;
            if (currentN === null) return line;
            return `${indent}"email" : "user${currentN}@guardian.co.uk"${comma}`;
        }

        const firstNameMatch = FIRST_NAME_RE.exec(line);
        if (firstNameMatch && currentN !== null) {
            const [, indent, , comma] = firstNameMatch;
            return `${indent}"firstName" : "User"${comma}`;
        }

        const lastNameMatch = LAST_NAME_RE.exec(line);
        if (lastNameMatch && currentN !== null) {
            const [, indent, , comma] = lastNameMatch;
            const line2 = `${indent}"lastName" : "${currentN}"${comma}`;
            currentN = null;
            return line2;
        }

        // Reset once we leave the user block so a number can't bleed across blocks.
        currentN = null;
        return line;
    });

    const output = rewritten.join("\n");
    if (output === original) return false;
    fs.writeFileSync(file, output);
    return true;
}

function main(): void {
    const targets = process.argv.slice(2);
    const roots = targets.length > 0 ? targets : [DEFAULT_TARGET];
    const files = roots.flatMap((root) => collectJsonFiles(path.resolve(root)));

    const identities = buildIdentityMap(files);
    if (identities.size === 0) {
        console.log("No non-anonymised user identities found. Nothing to do.");
        return;
    }

    console.log(`Anonymising ${identities.size} identities across ${files.length} files:`);
    for (const [email, n] of identities) {
        console.log(`  ${email} -> user${n}@guardian.co.uk`);
    }

    let changed = 0;
    for (const file of files) {
        if (anonymiseFile(file, identities)) changed++;
    }
    console.log(`Updated ${changed} file(s).`);
}

main();
