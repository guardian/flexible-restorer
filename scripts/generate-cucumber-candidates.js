#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = process.cwd();

function read(relPath) {
    return fs.readFileSync(path.join(root, relPath), "utf8");
}

function has(text, needle) {
    return text.includes(needle);
}

function parseRoutes(routesText) {
    return routesText
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#"))
        .map((line) => {
            const match = line.match(/^(GET|POST|PUT|DELETE|PATCH)\s+(\S+)\s+(\S+)/);
            if (!match) {
                return null;
            }
            return { method: match[1], path: match[2], target: match[3] };
        })
        .filter(Boolean);
}

function addScenario(list, scenario) {
    list.push(scenario);
}

function slug(value) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function asFeatureText(featureTitle, domainSlug, scenarios) {
    const lines = [];
    lines.push(`Feature: ${featureTitle}`);
    lines.push("  # Auto-generated from source analysis only.");
    lines.push("  # These are candidate BDD scenarios and should be validated in a live environment.");
    lines.push("");

    scenarios.forEach((s) => {
        lines.push(`  @candidate @source-discovery @domain-${domainSlug}`);
        lines.push(`  Scenario: ${s.title}`);
        lines.push(`    Given ${s.given}`);
        lines.push(`    When ${s.when}`);
        lines.push(`    Then ${s.then}`);
        lines.push("    # Evidence:");
        s.evidence.forEach((e) => {
            lines.push(`    # - ${e}`);
        });
        lines.push("");
    });

    return lines.join("\n");
}

function groupByDomain(scenarios) {
    return scenarios.reduce((acc, scenario) => {
        const key = scenario.domain;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(scenario);
        return acc;
    }, {});
}

function asIndexText(rows) {
    const lines = [];
    lines.push("# Source Discovered Candidate Features");
    lines.push("");
    lines.push("Auto-generated index of domain feature files produced by scripts/generate-cucumber-candidates.js.");
    lines.push("");
    lines.push("| Domain | Feature File | Scenario Count |");
    lines.push("| --- | --- | ---: |");
    rows.forEach((row) => {
        lines.push(`| ${row.domainName} | ${row.fileName} | ${row.count} |`);
    });
    lines.push("");
    return lines.join("\n");
}

function main() {
    const routesText = read("conf/routes");
    const splashTemplate = read("public/javascripts/app/templates/splash-screen.html");
    const restoreTemplate = read("public/javascripts/app/templates/restore-list.html");
    const searchCtrl = read("public/javascripts/app/controllers/SearchFormCtrl.js");
    const snapshotListCtrl = read("public/javascripts/app/controllers/SnapshotListCtrl.js");
    const snapshotInteractionCtrl = read("public/javascripts/app/controllers/SnapshotListInteractionCtrl.js");
    const snapshotContentCtrl = read("public/javascripts/app/controllers/SnapshotContentCtrl.js");
    const restoreCtrl = read("public/javascripts/app/controllers/RestoreFormCtrl.js");
    const modalCtrl = read("public/javascripts/app/controllers/ModalController.js");
    const errorCtrl = read("public/javascripts/app/controllers/ErrorCtrl.js");

    const routes = parseRoutes(routesText);
    const scenarios = [];

    const hasVersionsRoute = routes.some((r) => r.path === "/content/:contentId/versions");
    const hasVersionListApi = routes.some((r) => r.path === "/api/1/versionList/:contentId");
    const hasRestoreApi = routes.some((r) => r.path === "/api/1/restore/:sourceId/:contentId/:timestamp/to/:destinationId");
    const hasExportGit = routes.some((r) => r.path === "/export/:contentId/git");
    const hasExportZip = routes.some((r) => r.path === "/export/:contentId/zip");

    if (hasVersionsRoute && has(splashTemplate, "Enter a composer url:") && has(searchCtrl, "formSubmit")) {
        addScenario(scenarios, {
            domain: "Search",
            title: "Search by composer url opens content versions page",
            given: "I am on the Restorer search page",
            when: "I submit a composer url",
            then: "I should be navigated to the versions page for the parsed content id",
            evidence: [
                "public/javascripts/app/templates/splash-screen.html",
                "public/javascripts/app/controllers/SearchFormCtrl.js",
                "conf/routes (/content/:contentId/versions)",
            ],
        });
    }

    if (hasVersionListApi && has(snapshotListCtrl, "getCollection") && has(restoreTemplate, "snapshot-list")) {
        addScenario(scenarios, {
            domain: "Version List",
            title: "View available snapshot versions for a content id",
            given: "I am on a content versions page",
            when: "snapshot data is loaded",
            then: "I should see a sidebar list of available snapshot versions",
            evidence: [
                "conf/routes (/api/1/versionList/:contentId)",
                "public/javascripts/app/controllers/SnapshotListCtrl.js",
                "public/javascripts/app/templates/restore-list.html",
            ],
        });
    }

    if (has(snapshotListCtrl, "snapshot-list:load-content") && has(snapshotInteractionCtrl, "onItemClicked")) {
        addScenario(scenarios, {
            domain: "Version Navigation",
            title: "Select a snapshot version to load it into the main pane",
            given: "I am viewing snapshot versions",
            when: "I click a snapshot row",
            then: "the selected snapshot should become active and its content should load in the main pane",
            evidence: [
                "public/javascripts/app/controllers/SnapshotListInteractionCtrl.js",
                "public/javascripts/app/controllers/SnapshotListCtrl.js",
                "public/javascripts/app/controllers/SnapshotContentCtrl.js",
            ],
        });
    }

    if (has(snapshotInteractionCtrl, "case 40") && has(snapshotInteractionCtrl, "case 38") && has(snapshotInteractionCtrl, "case 13")) {
        addScenario(scenarios, {
            domain: "Version Navigation",
            title: "Navigate snapshot versions with keyboard",
            given: "I am focused on the versions view",
            when: "I use up/down arrow keys and press enter",
            then: "the active snapshot should change and modal interaction should be available",
            evidence: [
                "public/javascripts/app/controllers/SnapshotListInteractionCtrl.js (keydown handler)",
            ],
        });
    }

    if (has(snapshotContentCtrl, "toggleJSON") && has(restoreTemplate, "Show JSON")) {
        addScenario(scenarios, {
            domain: "Content View",
            title: "Toggle main pane between text and JSON",
            given: "I have loaded a snapshot",
            when: "I toggle the JSON display control",
            then: "the content pane should switch between rendered text and raw JSON",
            evidence: [
                "public/javascripts/app/controllers/SnapshotContentCtrl.js",
                "public/javascripts/app/templates/restore-list.html",
            ],
        });
    }

    if (has(snapshotContentCtrl, "copyJSON")) {
        addScenario(scenarios, {
            domain: "Content View",
            title: "Copy snapshot JSON to clipboard",
            given: "I am viewing snapshot JSON",
            when: "I click the copy JSON action",
            then: "the snapshot JSON should be copied and the UI should indicate success",
            evidence: [
                "public/javascripts/app/controllers/SnapshotContentCtrl.js (copyJSON)",
            ],
        });
    }

    if (has(restoreTemplate, "Restore") && has(snapshotContentCtrl, "canRestore") && has(restoreCtrl, "restore_content")) {
        addScenario(scenarios, {
            domain: "Restore",
            title: "Show restore action only to users with restore permission",
            given: "a user is viewing snapshot content",
            when: "permissions are loaded",
            then: "the restore action should be visible only for users with restore permission",
            evidence: [
                "public/javascripts/app/controllers/SnapshotContentCtrl.js",
                "public/javascripts/app/controllers/RestoreFormCtrl.js",
                "public/javascripts/app/templates/restore-list.html",
            ],
        });
    }

    if (hasRestoreApi && has(restoreCtrl, "RestoreService.restore") && has(restoreTemplate, "self-in-content") && has(restoreTemplate, "else-in-content")) {
        addScenario(scenarios, {
            domain: "Restore",
            title: "Restore selected snapshot to destination after safety checks",
            given: "I have selected a snapshot and opened the restore modal",
            when: "I select a destination and confirm both safety checkboxes",
            then: "the app should restore content and redirect to the destination composer item",
            evidence: [
                "conf/routes (POST /api/1/restore/:sourceId/:contentId/:timestamp/to/:destinationId)",
                "public/javascripts/app/controllers/RestoreFormCtrl.js",
                "public/javascripts/app/templates/restore-list.html (restore modal)",
            ],
        });
    }

    if (has(modalCtrl, "case 27") || has(modalCtrl, "keyCode === 27")) {
        addScenario(scenarios, {
            domain: "Restore",
            title: "Close restore modal with escape key",
            given: "the restore modal is open",
            when: "I press escape",
            then: "the modal should close and the page should return to normal scrolling",
            evidence: [
                "public/javascripts/app/controllers/ModalController.js",
            ],
        });
    }

    if (has(errorCtrl, "mediator.subscribe('error'") && has(restoreTemplate, "Ooops, something went wrong")) {
        addScenario(scenarios, {
            domain: "Error Handling",
            title: "Display error state when snapshot or restore operations fail",
            given: "an operation fails in the app",
            when: "an error event is published",
            then: "an error modal should be shown with the error message",
            evidence: [
                "public/javascripts/app/controllers/ErrorCtrl.js",
                "public/javascripts/app/templates/restore-list.html (error modal)",
            ],
        });
    }

    if (hasExportGit) {
        addScenario(scenarios, {
            domain: "Export",
            title: "Export snapshots as Git repository",
            given: "I am viewing a content id in Restorer",
            when: "I choose export as Git repo",
            then: "the app should return a Git export for that content id",
            evidence: [
                "conf/routes (GET /export/:contentId/git)",
                "public/javascripts/app/templates/restore-list.html",
            ],
        });
    }

    if (hasExportZip) {
        addScenario(scenarios, {
            domain: "Export",
            title: "Export snapshots as zip archive",
            given: "I am viewing a content id in Restorer",
            when: "I choose export as zip",
            then: "the app should return a zip export for that content id",
            evidence: [
                "conf/routes (GET /export/:contentId/zip)",
                "public/javascripts/app/templates/restore-list.html",
            ],
        });
    }

    const byDomain = groupByDomain(scenarios);
    const outputDir = path.join(root, "tests/e2e/features/candidates");
    fs.mkdirSync(outputDir, { recursive: true });

    const outputs = Object.keys(byDomain)
        .sort()
        .map((domainName) => {
            const domainSlug = slug(domainName);
            const featureTitle = `Source discovered ${domainName} capabilities`;
            const output = asFeatureText(featureTitle, domainSlug, byDomain[domainName]);
            const fileName = `source-discovered-${domainSlug}.feature`;
            const outputPath = path.join(outputDir, fileName);
            fs.writeFileSync(outputPath, output, "utf8");
            return { domainName, fileName, outputPath, count: byDomain[domainName].length };
        });

    const indexText = asIndexText(outputs);
    const indexPath = path.join(outputDir, "INDEX.md");
    fs.writeFileSync(indexPath, indexText, "utf8");

    console.log(`Generated ${scenarios.length} candidate scenarios across ${outputs.length} domain files.`);
    outputs.forEach((output) => {
        console.log(`Output: ${output.outputPath}`);
    });
    console.log(`Index: ${indexPath}`);
}

main();
