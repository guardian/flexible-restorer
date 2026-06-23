#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function readJson(filePath) {
    if (!fs.existsSync(filePath)) {
        return [];
    }

    const raw = fs.readFileSync(filePath, "utf8").trim();
    if (!raw) {
        return [];
    }

    try {
        return JSON.parse(raw);
    } catch (error) {
        throw new Error(`Failed to parse cucumber JSON report at ${filePath}: ${error.message}`);
    }
}

function flattenScenarios(report) {
    const scenarios = [];

    report.forEach((feature) => {
        const featureName = feature.name || feature.uri || "Unknown feature";
        const elements = Array.isArray(feature.elements) ? feature.elements : [];

        elements.forEach((scenario) => {
            const steps = Array.isArray(scenario.steps) ? scenario.steps : [];
            const statuses = steps
                .map((step) => step.result && step.result.status)
                .filter(Boolean);

            const statusPriority = ["failed", "ambiguous", "undefined", "pending", "skipped", "passed"];
            const overallStatus = statusPriority.find((s) => statuses.includes(s)) || "unknown";

            scenarios.push({
                featureName,
                scenarioName: scenario.name || "Unnamed scenario",
                status: overallStatus,
                steps,
            });
        });
    });

    return scenarios;
}

function getVideoFiles(videosDir, htmlDir) {
    if (!fs.existsSync(videosDir)) {
        return [];
    }

    return fs
        .readdirSync(videosDir)
        .filter((name) => name.toLowerCase().endsWith(".webm"))
        .sort()
        .map((name) => ({
            fileName: name,
            relativePath: path.relative(htmlDir, path.join(videosDir, name)),
        }));
}

function buildHtml({ scenarios, videos, runDir }) {
    const totals = scenarios.reduce(
        (acc, scenario) => {
            acc.total += 1;
            acc[scenario.status] = (acc[scenario.status] || 0) + 1;
            return acc;
        },
        { total: 0 }
    );

    const scenarioRows = scenarios
        .map((scenario) => {
            const failedSteps = scenario.steps
                .filter((step) => step.result && step.result.status !== "passed")
                .map((step) => {
                    const result = step.result || {};
                    const error = result.error_message ? `<pre>${escapeHtml(result.error_message)}</pre>` : "";
                    return `<div><strong>${escapeHtml(step.keyword || "")}${escapeHtml(step.name || "")}</strong> - ${escapeHtml(result.status || "unknown")}${error}</div>`;
                })
                .join("");

            return `<tr>
<td>${escapeHtml(scenario.featureName)}</td>
<td>${escapeHtml(scenario.scenarioName)}</td>
<td class=\"status status-${escapeHtml(scenario.status)}\">${escapeHtml(scenario.status)}</td>
<td>${failedSteps || "-"}</td>
</tr>`;
        })
        .join("\n");

    const videoItems = videos.length
        ? videos
              .map(
                  (video) => `<li><a href=\"${escapeHtml(video.relativePath)}\">${escapeHtml(video.fileName)}</a></li>`
              )
              .join("\n")
        : "<li>No video files were generated for this run.</li>";

    return `<!doctype html>
<html lang=\"en\">
<head>
<meta charset=\"utf-8\" />
<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\" />
<title>BDD Test Report</title>
<style>
body { font-family: -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif; margin: 24px; color: #111; }
h1 { margin-bottom: 8px; }
summary { font-weight: 600; cursor: pointer; }
.metrics { display: flex; gap: 12px; flex-wrap: wrap; margin: 12px 0 20px; }
.metric { background: #f2f4f7; padding: 8px 12px; border-radius: 8px; }
table { width: 100%; border-collapse: collapse; margin-top: 12px; }
th, td { border: 1px solid #d0d7de; padding: 8px; text-align: left; vertical-align: top; }
th { background: #f6f8fa; }
.status { font-weight: 700; text-transform: uppercase; }
.status-passed { color: #1a7f37; }
.status-failed, .status-ambiguous, .status-undefined { color: #cf222e; }
.status-pending, .status-skipped { color: #9a6700; }
pre { white-space: pre-wrap; background: #f6f8fa; padding: 8px; border-radius: 6px; }
</style>
</head>
<body>
<h1>BDD Test Report</h1>
<p><strong>Run directory:</strong> ${escapeHtml(runDir)}</p>
<div class=\"metrics\">
<div class=\"metric\">Total: ${totals.total || 0}</div>
<div class=\"metric\">Passed: ${totals.passed || 0}</div>
<div class=\"metric\">Failed: ${totals.failed || 0}</div>
<div class=\"metric\">Pending: ${totals.pending || 0}</div>
<div class=\"metric\">Skipped: ${totals.skipped || 0}</div>
<div class=\"metric\">Undefined/Ambiguous: ${(totals.undefined || 0) + (totals.ambiguous || 0)}</div>
</div>
<h2>Videos</h2>
<ul>
${videoItems}
</ul>
<h2>Scenarios</h2>
<table>
<thead><tr><th>Feature</th><th>Scenario</th><th>Status</th><th>Non-passing step details</th></tr></thead>
<tbody>
${scenarioRows || "<tr><td colspan=\"4\">No scenarios found.</td></tr>"}
</tbody>
</table>
</body>
</html>`;
}

function main() {
    const jsonReportPath = process.argv[2];
    const htmlReportPath = process.argv[3];
    const videosDir = process.argv[4];

    if (!jsonReportPath || !htmlReportPath || !videosDir) {
        throw new Error("Usage: node scripts/render-bdd-report.js <jsonReportPath> <htmlReportPath> <videosDir>");
    }

    const runDir = path.dirname(htmlReportPath);
    const report = readJson(jsonReportPath);
    const scenarios = flattenScenarios(report);
    const videos = getVideoFiles(videosDir, path.dirname(htmlReportPath));

    const html = buildHtml({ scenarios, videos, runDir });
    fs.writeFileSync(htmlReportPath, html, "utf8");
}

main();
