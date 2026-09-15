import fs from "fs";
import path from "path";
import type { PanDomainKeys } from "./panDomainKeys";

// Buckets/objects the restorer reads on startup and while serving. Names must
// match what the app requests. Created in eu-west-1 to match the app's S3 client
// region (see app/config/AWS.scala).
const REGION = "eu-west-1";

const PERMISSIONS_BUCKET = "permissions-cache";
const PERMISSIONS_OBJECT_KEY = "CODE/permissions.json";
const PERMISSIONS_FIXTURE = "permissions/permissions.json";

const PAN_DOMAIN_BUCKET = "pan-domain-auth-settings";
const PAN_DOMAIN_SETTINGS_OBJECT_KEY = "local.dev-gutools.co.uk.settings";
const PAN_DOMAIN_SETTINGS_PUBLIC_OBJECT_KEY =
    "local.dev-gutools.co.uk.settings.public";
const PAN_DOMAIN_SETTINGS_FIXTURE =
    "pan-domain-settings/local.dev-gutools.co.uk.settings";
const PAN_DOMAIN_SETTINGS_PUBLIC_FIXTURE =
    "pan-domain-settings/local.dev-gutools.co.uk.settings.public";

const SNAPSHOT_BUCKET = "flexible-snapshotter-code";
const SECONDARY_SNAPSHOT_BUCKET = "flexible-secondary-snapshotter-code";

// The whole fixtures tree is bind-mounted here by stackContainers.ts, so awslocal
// can copy the snapshot tree recursively without shipping a custom image.
const FIXTURES_MOUNT = "/fixtures";
const SNAPSHOTS_FIXTURE_DIR = "snapshots";

/**
 * Seed the LocalStack S3 mock with the pan-domain settings, permissions cache and
 * snapshot fixtures the restorer reads.
 *
 * Must run after the LocalStack container is ready and before the restorer starts,
 * since the app loads pan-domain settings and the permissions cache from S3 on
 * startup. The per-run pan-domain signing keys are appended to the settings
 * fixtures before upload. awslocal inherits the container's eu-west-1 region.
 */
export async function seedS3(
    s3Container: any,
    projectRoot: string,
    panDomainKeys: PanDomainKeys,
): Promise<void> {
    const fixturePath = (file: string) =>
        path.join(projectRoot, "e2e-tests/fixtures", file);

    // The pan-domain library expects the signing keys inside the settings files.
    const settings =
        fs.readFileSync(fixturePath(PAN_DOMAIN_SETTINGS_FIXTURE), "utf8") +
        `publicKey=${panDomainKeys.publicKeyBase64}\n` +
        `privateKey=${panDomainKeys.privateKeyBase64}\n`;
    const settingsPublic =
        fs.readFileSync(fixturePath(PAN_DOMAIN_SETTINGS_PUBLIC_FIXTURE), "utf8") +
        `publicKey=${panDomainKeys.publicKeyBase64}\n`;

    await s3Container.copyContentToContainer([
        { content: settings, target: "/tmp/pan-domain.settings" },
        { content: settingsPublic, target: "/tmp/pan-domain.settings.public" },
    ]);

    const seedScript = [
        `awslocal s3api create-bucket --bucket ${PERMISSIONS_BUCKET} --create-bucket-configuration LocationConstraint=${REGION}`,
        `awslocal s3api create-bucket --bucket ${PAN_DOMAIN_BUCKET} --create-bucket-configuration LocationConstraint=${REGION}`,
        `awslocal s3api create-bucket --bucket ${SNAPSHOT_BUCKET} --create-bucket-configuration LocationConstraint=${REGION}`,
        `awslocal s3api create-bucket --bucket ${SECONDARY_SNAPSHOT_BUCKET} --create-bucket-configuration LocationConstraint=${REGION}`,
        `awslocal s3 cp ${FIXTURES_MOUNT}/${PERMISSIONS_FIXTURE} s3://${PERMISSIONS_BUCKET}/${PERMISSIONS_OBJECT_KEY}`,
        `awslocal s3 cp /tmp/pan-domain.settings s3://${PAN_DOMAIN_BUCKET}/${PAN_DOMAIN_SETTINGS_OBJECT_KEY}`,
        `awslocal s3 cp /tmp/pan-domain.settings.public s3://${PAN_DOMAIN_BUCKET}/${PAN_DOMAIN_SETTINGS_PUBLIC_OBJECT_KEY}`,
        `awslocal s3 cp ${FIXTURES_MOUNT}/${SNAPSHOTS_FIXTURE_DIR} s3://${SNAPSHOT_BUCKET} --recursive --exclude ".DS_Store" --exclude "STATE_FIXTURES.md"`,
        `awslocal s3 cp ${FIXTURES_MOUNT}/${SNAPSHOTS_FIXTURE_DIR} s3://${SECONDARY_SNAPSHOT_BUCKET} --recursive --exclude ".DS_Store" --exclude "STATE_FIXTURES.md"`,
    ].join(" && ");

    const result = await s3Container.exec(["sh", "-c", seedScript]);
    if (result.exitCode !== 0) {
        throw new Error(
            `Failed to seed S3 (exit code ${result.exitCode}):\n${result.output}`,
        );
    }
}
