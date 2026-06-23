#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const projectRoot = process.cwd();
const featuresDir = path.join(projectRoot, "tests", "e2e", "features", "candidates");
const stepDefsDir = path.join(projectRoot, "tests", "bdd", "step-definitions");
const outputDir = path.join(projectRoot, "public", "feature-catalog");
const defaultBaseUrl = process.env.FEATURE_PREVIEW_BASE_URL || "http://localhost:9000";
const defaultStackSessionFile = path.join(projectRoot, ".tmp", "local-stack-session.json");

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function slug(value) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function listFiles(dir, extension) {
    if (!fs.existsSync(dir)) {
        return [];
    }

    return fs
        .readdirSync(dir)
        .filter((name) => name.endsWith(extension))
        .sort()
        .map((name) => path.join(dir, name));
}

function parseFeature(content) {
    const lines = content.split("\n");
    const featureLine = lines.find((line) => line.trim().startsWith("Feature:")) || "Feature: Untitled";
    const featureName = featureLine.replace(/^\s*Feature:\s*/, "").trim();

    const scenarios = [];
    let current = null;
    let tags = "";

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
            continue;
        }

        if (trimmed.startsWith("@")) {
            tags = trimmed;
            continue;
        }

        if (trimmed.startsWith("Scenario:")) {
            if (current) {
                scenarios.push(current);
            }

            current = {
                name: trimmed.replace(/^Scenario:\s*/, "").trim(),
                tags,
                steps: [],
                comments: [],
            };
            tags = "";
            continue;
        }

        if (current && /^(Given|When|Then|And|But)\b/.test(trimmed)) {
            current.steps.push(trimmed);
            continue;
        }

        if (current && trimmed.startsWith("#")) {
            current.comments.push(trimmed.replace(/^#\s?/, ""));
        }
    }

    if (current) {
        scenarios.push(current);
    }

    return { featureName, scenarios };
}

function extractStepPatterns(source) {
    const patterns = [];
    const matcher = /(Given|When|Then)\(\s*(["'`])([\s\S]*?)\2\s*,/g;
    let match = matcher.exec(source);

    while (match) {
        patterns.push({ phrase: match[3], kind: match[1] });
        match = matcher.exec(source);
    }

    return patterns;
}

function buildStepPatternIndex() {
    const files = listFiles(stepDefsDir, ".ts");
    const entries = [];

    files.forEach((filePath) => {
        const source = fs.readFileSync(filePath, "utf8");
        const patterns = extractStepPatterns(source);

        patterns.forEach((pattern) => {
            let regex = null;
            try {
                regex = new RegExp(`^${pattern.phrase}$`);
            } catch {
                regex = null;
            }

            entries.push({
                phrase: pattern.phrase,
                kind: pattern.kind,
                fileName: path.basename(filePath),
                regex,
            });
        });
    });

    return entries;
}

function normalizeStep(stepLine) {
    return stepLine.replace(/^(Given|When|Then|And|But)\s+/, "").trim();
}

function inferAction(stepText) {
    const phrase = normalizeStep(stepText);
    const lower = phrase.toLowerCase();

    if (
        lower.includes("open a content versions page") ||
        lower.includes("on a content versions page") ||
        lower.includes("opened a content versions page")
    ) {
        return { type: "open-content-page" };
    }

    if (lower.includes("click the display toggle button")) {
        return { type: "click-text-button", options: ["Show JSON", "Show TEXT"] };
    }

    if (lower.includes("click the copy json action")) {
        return { type: "click-text-button", options: ["Copy JSON", "Copied!"] };
    }

    if (lower.includes("load a different snapshot version")) {
        return { type: "click-nth", selector: ".snapshot-list__item .snapshot-list__item__content", index: 1 };
    }

    if (lower.includes("500 milliseconds have elapsed")) {
        return { type: "wait", ms: 600 };
    }

    if (lower.includes("restore modal is closed")) {
        return { type: "press-escape" };
    }

    if (lower.includes("loading bars should be visible")) {
        return { type: "assert-visible", selector: ".loading-bars" };
    }

    if (lower.includes("content layout should be hidden")) {
        return { type: "assert-hidden", selector: "gu-row.content, .content" };
    }

    if (lower.includes("display toggle should read \"show json\"")) {
        return { type: "assert-text", selector: "button.snapshot-content__actions--button", text: "Show JSON" };
    }

    if (lower.includes("display toggle should read \"show text\"")) {
        return { type: "assert-text", selector: "button.snapshot-content__actions--button", text: "Show TEXT" };
    }

    if (lower.includes("copy button should read \"copy json\"")) {
        return { type: "assert-text", selector: "button.snapshot-content__actions--button", text: "Copy JSON" };
    }

    if (lower.includes("copy button should change to \"copied!\"")) {
        return { type: "assert-text", selector: "button.snapshot-content__actions--button", text: "Copied!" };
    }

    if (lower.includes("copy button should reset to \"copy json\"")) {
        return { type: "assert-text", selector: "button.snapshot-content__actions--button", text: "Copy JSON" };
    }

    if (lower.includes("article hash should show")) {
        return { type: "assert-text", selector: ".article-hash", text: "568c4110e4b0c73bdb0e52df" };
    }

    if (lower.includes("article title should show")) {
        return { type: "assert-visible", selector: ".article-headline" };
    }

    if (lower.includes("article link should point")) {
        return { type: "assert-attr", selector: ".article-hash a", attr: "href", text: "/content/568c4110e4b0c73bdb0e52df" };
    }

    if (lower.includes("first model in the list should have active state")) {
        return { type: "assert-class", selector: ".snapshot-list__item", className: "item-active" };
    }

    if (lower.includes("sidebar should transition to active state")) {
        return { type: "assert-class", selector: ".sidebar", className: "active" };
    }

    if (lower.includes("sidebar list of available snapshot versions")) {
        return { type: "assert-visible", selector: ".sidebar .snapshot-list" };
    }

    if (lower.includes("snapshot data is loaded")) {
        return { type: "assert-visible", selector: ".snapshot-list__item" };
    }

    if (lower.includes("initial snapshot content is loaded")) {
        return { type: "assert-visible", selector: ".snapshot-content" };
    }

    if (lower.includes("row status is displayed")) {
        return { type: "assert-visible", selector: ".snapshot-list__item__status" };
    }

    if (lower.includes("relative age text and last modified user")) {
        return { type: "assert-visible", selector: ".snapshot-list__item__content__relative-date, .snapshot-list__item__content__reason" };
    }

    if (lower.includes("launch highlight classes")) {
        return { type: "assert-visible", selector: ".highlight-row-for-launches, .highlight-reason-for-launches" };
    }

    if (lower.includes("settings indicators")) {
        return {
            type: "assert-visible",
            selector: ".snapshot-list__item__settings__legally-sensitive, .snapshot-list__item__settings__comments--on, .snapshot-list__item__settings__comments--off",
        };
    }

    if (lower.includes("status label should display")) {
        return { type: "assert-visible", selector: ".snapshot-list__item__status--right" };
    }

    return { type: "noop" };
}

function matchDefinition(stepPatternIndex, stepText) {
    const phrase = normalizeStep(stepText);
    const direct = stepPatternIndex.find((entry) => entry.phrase === phrase);
    if (direct) {
        return direct;
    }

    return stepPatternIndex.find((entry) => entry.regex && entry.regex.test(phrase)) || null;
}

function getSessionFileData() {
    const sessionFile = process.env.BDD_STACK_SESSION_FILE || defaultStackSessionFile;
    if (!fs.existsSync(sessionFile)) {
        return null;
    }

    try {
        return JSON.parse(fs.readFileSync(sessionFile, "utf8"));
    } catch {
        return null;
    }
}

function resolvePreviewAuthCookie() {
    const explicitCookie = String(process.env.FEATURE_PREVIEW_AUTH_COOKIE || "").trim();
    if (explicitCookie) {
        return explicitCookie;
    }

    const bddCookie = String(process.env.BDD_AUTH_COOKIE || "").trim();
    if (bddCookie) {
        return bddCookie;
    }

    const sessionData = getSessionFileData();
    if (!sessionData) {
        return "";
    }

    return String(sessionData.panDomainCookie || sessionData.authCookie || "").trim();
}

const previewAuthCookie = resolvePreviewAuthCookie();

function buildIndexPage(features) {
    const cards = features
        .map((feature) => {
            const links = feature.scenarios
                .map((scenario) => `<li><a href="${escapeHtml(feature.outputName)}#${escapeHtml(scenario.anchor)}">${escapeHtml(scenario.name)}</a></li>`)
                .join("\n");

            return `<article class="card">
  <h2><a href="${escapeHtml(feature.outputName)}">${escapeHtml(feature.featureName)}</a></h2>
  <p class="meta">${feature.scenarios.length} scenario${feature.scenarios.length === 1 ? "" : "s"}</p>
  <ul>${links || "<li>No scenarios</li>"}</ul>
</article>`;
        })
        .join("\n");

    return `<!doctype html>
<html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>E2E Feature Catalog</title>
<style>
body{margin:0;font-family:"Avenir Next","Segoe UI",sans-serif;background:#f5f3ee;color:#1f1f1b}
header{padding:20px;border-bottom:1px solid #dfd7c9;background:linear-gradient(100deg,#f9f5ea,#eef7f4)}
main{max-width:1200px;margin:0 auto;padding:20px}
.feature-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px}
.card{background:#fffefb;border:1px solid #dfd7c9;border-radius:12px;padding:14px;box-shadow:0 8px 20px rgba(0,0,0,.04)}
a{color:#0a7d5a;text-decoration:none}a:hover{text-decoration:underline}
.meta{color:#6d6a61;font-size:13px}
</style></head>
<body><header><h1>E2E Feature Catalog</h1><p class="meta">Interactive preview pages are generated in /assets/feature-catalog</p></header>
<main><section class="feature-grid">${cards}</section></main></body></html>`;
}

function buildFeaturePage(feature, allFeatures) {
    const navLinks = [
        '<a href="index.html">All Features</a>',
        ...allFeatures.map((item) => `<a href="${escapeHtml(item.outputName)}">${escapeHtml(item.featureName)}</a>`),
    ].join(" | ");

    const options = feature.scenarios
        .map((scenario, index) => `<option value="${index}">${escapeHtml(scenario.name)}</option>`)
        .join("\n");

    function actionDebugDetails(action) {
        if (!action || action.type === "noop") {
            return "No mapped DOM action";
        }

        const details = [`type=${action.type}`];

        if (action.selector) {
            details.push(`selector=${action.selector}`);
        }
        if (Array.isArray(action.options) && action.options.length > 0) {
            details.push(`buttonText~=${action.options.join(" | ")}`);
        }
        if (typeof action.index === "number") {
            details.push(`index=${String(action.index)}`);
        }
        if (action.attr) {
            details.push(`attr=${action.attr}`);
        }
        if (action.text) {
            details.push(`expected~=${action.text}`);
        }
        if (action.className) {
            details.push(`class=${action.className}`);
        }
        if (action.ms) {
            details.push(`waitMs=${String(action.ms)}`);
        }

        return details.join(" | ");
    }

    const scenarioSections = feature.scenarios
        .map((scenario, index) => {
            const stepRows = scenario.steps
                .map((step) => {
                    const definitionMeta = step.definition
                        ? `${step.definition.kind} in ${step.definition.fileName}`
                        : "No step-definition match";
                    const actionMeta = actionDebugDetails(step.action);

                    return `<li><code>${escapeHtml(step.text)}</code><div class="step-meta">${escapeHtml(definitionMeta)}</div><div class="step-debug">${escapeHtml(actionMeta)}</div></li>`;
                })
                .join("\n");

            const evidence = scenario.comments.length
                ? `<details><summary>Evidence and Notes</summary><ul>${scenario.comments.map((comment) => `<li>${escapeHtml(comment)}</li>`).join("\n")}</ul></details>`
                : "";

            return `<section id="${escapeHtml(scenario.anchor)}" class="scenario-card"><h3>${escapeHtml(scenario.name)}</h3><div class="scenario-run-controls"><button class="scenario-focus" data-scenario-index="${index}">Focus Scenario</button><button class="scenario-run" data-scenario-index="${index}">Run This Scenario</button><button class="scenario-reset" data-scenario-index="${index}">Reset Scenario</button><span class="scenario-run-status" id="scenario-run-status-${index}">Not run</span></div><ul>${stepRows}</ul>${evidence}</section>`;
        })
        .join("\n");

    const scriptData = JSON.stringify({
        baseUrl: defaultBaseUrl,
        authCookie: previewAuthCookie,
        scenarios: feature.scenarios.map((scenario) => ({
            name: scenario.name,
            steps: scenario.steps,
        })),
    });

    return `<!doctype html>
<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(feature.featureName)}</title>
<style>
body{margin:0;font-family:"Avenir Next","Segoe UI",sans-serif;background:#f5f3ee;color:#1f1f1b}
header{padding:20px;border-bottom:1px solid #dfd7c9;background:linear-gradient(100deg,#f9f5ea,#eef7f4)}
main{max-width:1400px;margin:0 auto;padding:18px}
nav{font-size:14px;margin-top:8px}a{color:#0a7d5a;text-decoration:none}a:hover{text-decoration:underline}
.layout{display:grid;grid-template-columns:420px minmax(640px,1fr);gap:16px}@media (max-width:1200px){.layout{grid-template-columns:1fr}}
.card,.preview-card{background:#fffefb;border:1px solid #dfd7c9;border-radius:12px;padding:14px;box-shadow:0 8px 20px rgba(0,0,0,.04)}
.controls{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}
button,select,input{border:1px solid #dfd7c9;background:#fff;padding:8px 10px;border-radius:8px;font:inherit}
button{cursor:pointer}button:hover{background:#f9f7f1}
.step-list{list-style:none;padding:0;margin:0}.step-item{display:grid;grid-template-columns:30px 1fr;gap:8px;padding:8px;border-bottom:1px dashed #dfd7c9;font-family:"Menlo","Monaco",monospace;font-size:12px}
.step-item.current{background:#eef7f4}.step-item.done{background:#f0fff7}.step-item.failed{background:#fff3f2}.step-item.pending{background:#fff8ef}
.step-index{display:inline-flex;width:22px;height:22px;align-items:center;justify-content:center;border-radius:999px;background:#ddebe5;color:#1c5e4a;font-size:11px}
#runner-status{font-size:13px;color:#6d6a61;margin-top:8px}
#runner-status.warn{color:#a25a00}#runner-status.error{color:#b42318}#runner-status.ok{color:#067647}
.preview-toolbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px}
.preview-toolbar input{flex:1;min-width:260px}
#auth-controls{margin:10px 0;padding:10px;border:1px dashed #dfd7c9;border-radius:10px;background:#fcfaf3}
#auth-controls label{display:block;font-size:12px;color:#4f4b42;margin:8px 0 4px}
#auth-controls textarea{width:100%;min-height:72px;border:1px solid #dfd7c9;border-radius:8px;padding:8px;font:12px/1.3 "Menlo","Monaco",monospace;resize:vertical;box-sizing:border-box}
#auth-controls .row{display:grid;grid-template-columns:1fr 1fr;gap:8px}@media (max-width:1200px){#auth-controls .row{grid-template-columns:1fr}}
#auth-controls .buttons{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
#auth-note{font-size:12px;color:#6d6a61;margin-top:6px}
#stack-reminder{margin:8px 0;padding:8px;border-radius:8px;border:1px solid #efc58b;background:#fff5e8;color:#7a4b00;font-size:13px}
iframe{width:100%;min-height:760px;border:1px solid #dfd7c9;border-radius:10px;background:#fff}
.scenario-card{margin-top:10px;border-top:1px dashed #dfd7c9;padding-top:8px}.scenario-card ul{padding-left:18px}
.step-meta{font-size:11px;color:#6d6a61;font-family:"Avenir Next","Segoe UI",sans-serif}
.step-debug{font-size:11px;color:#1c5e4a;margin-top:2px;word-break:break-word;font-family:"Menlo","Monaco",monospace}
.scenario-run-controls{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:6px 0 8px}
.scenario-run-controls button{font-size:12px;padding:6px 8px}
.scenario-run-status{font-size:12px;color:#6d6a61}
.scenario-run-status.ok{color:#067647}.scenario-run-status.warn{color:#a25a00}.scenario-run-status.error{color:#b42318}
code{background:#f8f6ef;padding:1px 4px;border-radius:4px}
</style></head>
<body><header><h1>${escapeHtml(feature.featureName)}</h1><nav>${navLinks}</nav></header>
<main><section class="layout"><div>
<article class="card">
<label for="scenario-select"><strong>Scenario</strong></label>
<select id="scenario-select">${options}</select>
<div class="controls"><button id="run-next">Run Next Step</button><button id="run-all">Run Scenario</button><button id="reset">Reset</button></div>
<ol id="step-list" class="step-list"></ol>
<div id="runner-status" class="warn">Select a scenario and run step-by-step.</div>
</article>
${scenarioSections}
</div>
<div>
<article class="preview-card">
<div class="preview-toolbar"><label for="base-url"><strong>Preview URL</strong></label><input id="base-url" value="${escapeHtml(defaultBaseUrl)}" /><button id="connect">Connect</button></div>
<section id="auth-controls">
  <strong>Manual Auth</strong>
  <label for="manual-cookie">Auth cookie (gutoolsAuth-assym)</label>
  <textarea id="manual-cookie" placeholder="Paste an existing cookie value to apply directly"></textarea>
  <div class="row">
    <div>
      <label for="manual-private-key">Pan-domain private key</label>
      <textarea id="manual-private-key" placeholder="Paste PRIVATE KEY or RSA PRIVATE KEY"></textarea>
    </div>
    <div>
      <label for="manual-public-key">Pan-domain public key (optional verification)</label>
      <textarea id="manual-public-key" placeholder="Paste PUBLIC KEY"></textarea>
    </div>
  </div>
  <div class="buttons">
    <button id="generate-auth-cookie">Generate Cookie From Keys</button>
    <button id="apply-auth-cookie">Apply Auth Cookie</button>
  </div>
  <div id="auth-note">Keys are stored in local browser storage for this page origin.</div>
</section>
<div id="stack-reminder" hidden>Local stack unavailable. Start it with <code>npm run local:stack</code> then reconnect.</div>
<iframe id="preview-iframe" title="Restorer preview"></iframe>
</article>
</div></section></main>
<script>
const data = ${scriptData};
const scenarioSelect = document.getElementById('scenario-select');
const stepList = document.getElementById('step-list');
const statusNode = document.getElementById('runner-status');
const runNext = document.getElementById('run-next');
const runAll = document.getElementById('run-all');
const resetBtn = document.getElementById('reset');
const connectBtn = document.getElementById('connect');
const baseUrlInput = document.getElementById('base-url');
const stackReminder = document.getElementById('stack-reminder');
const frame = document.getElementById('preview-iframe');
const manualCookieInput = document.getElementById('manual-cookie');
const manualPrivateKeyInput = document.getElementById('manual-private-key');
const manualPublicKeyInput = document.getElementById('manual-public-key');
const applyAuthCookieBtn = document.getElementById('apply-auth-cookie');
const generateAuthCookieBtn = document.getElementById('generate-auth-cookie');
const scenarioRunButtons = Array.from(document.querySelectorAll('.scenario-run'));
const scenarioFocusButtons = Array.from(document.querySelectorAll('.scenario-focus'));
const scenarioResetButtons = Array.from(document.querySelectorAll('.scenario-reset'));

let scenarioIndex = 0;
let stepIndex = 0;

function setStatus(text, state) {
  statusNode.textContent = text;
  statusNode.className = state || '';
}

function updateScenarioRunStatus(index, text, state) {
  const node = document.getElementById('scenario-run-status-' + index);
  if (!node) {
    return;
  }
  node.textContent = text;
  node.className = 'scenario-run-status ' + (state || '');
}

function selectedScenario() {
  return data.scenarios[scenarioIndex];
}

function renderSteps() {
  const scenario = selectedScenario();
  stepList.innerHTML = '';
  scenario.steps.forEach((step, index) => {
    const li = document.createElement('li');
    li.className = 'step-item';
    if (index === stepIndex) {
      li.classList.add('current');
    }
    li.innerHTML = '<span class="step-index">' + (index + 1) + '</span><span>' + step.text + '</span>';
    stepList.appendChild(li);
  });
}

function setStepClass(index, className) {
  const node = stepList.children[index];
  if (!node) {
    return;
  }
  node.classList.remove('current', 'done', 'failed', 'pending');
  node.classList.add(className);
}

async function isStackReachable(baseUrl) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    await fetch(baseUrl, { method: 'GET', mode: 'no-cors', signal: controller.signal });
    clearTimeout(timeout);
    return true;
  } catch {
    return false;
  }
}

function queryBySelectors(doc, selectorText) {
  const selectors = selectorText.split(',').map((selector) => selector.trim()).filter(Boolean);
  for (const selector of selectors) {
    const node = doc.querySelector(selector);
    if (node) {
      return node;
    }
  }
  return null;
}

function findButtonByText(doc, options) {
  const buttons = Array.from(doc.querySelectorAll('button'));
  return buttons.find((button) => {
    const text = (button.textContent || '').trim();
    return options.some((option) => text.includes(option));
  }) || null;
}

function base64FromUint8(bytes) {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function base64ToUint8(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function normalizePem(rawValue, defaultHeader) {
  const raw = String(rawValue || '').trim();
  if (!raw) {
    return '';
  }

  if (raw.includes('-----BEGIN')) {
    return raw.replace(/\\n/g, '\\n');
  }

  const body = raw.replace(/\\n/g, '').replace(/\s+/g, '');
  const lines = body.match(/.{1,64}/g) || [];
  return '-----BEGIN ' + defaultHeader + '-----\\n' + lines.join('\\n') + '\\n-----END ' + defaultHeader + '-----';
}

function pemToDerBytes(pemValue) {
  const cleaned = pemValue
    .replace(/-----BEGIN [^-]+-----/g, '')
    .replace(/-----END [^-]+-----/g, '')
    .replace(/\s+/g, '');
  return base64ToUint8(cleaned);
}

function encodeDerLength(length) {
  if (length < 0x80) {
    return Uint8Array.from([length]);
  }

  const octets = [];
  let remaining = length;
  while (remaining > 0) {
    octets.unshift(remaining & 0xff);
    remaining >>= 8;
  }
  return Uint8Array.from([0x80 | octets.length, ...octets]);
}

function derNode(tag, contentBytes) {
  const lengthBytes = encodeDerLength(contentBytes.length);
  const out = new Uint8Array(1 + lengthBytes.length + contentBytes.length);
  out[0] = tag;
  out.set(lengthBytes, 1);
  out.set(contentBytes, 1 + lengthBytes.length);
  return out;
}

function concatBytes(chunks) {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const out = new Uint8Array(totalLength);
  let offset = 0;
  chunks.forEach((chunk) => {
    out.set(chunk, offset);
    offset += chunk.length;
  });
  return out;
}

function pkcs1ToPkcs8(pkcs1Bytes) {
  const version = Uint8Array.from([0x02, 0x01, 0x00]);
  const algorithmIdentifier = Uint8Array.from([
    0x30, 0x0d,
    0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01,
    0x05, 0x00,
  ]);
  const privateKeyOctetString = derNode(0x04, pkcs1Bytes);
  const sequence = concatBytes([version, algorithmIdentifier, privateKeyOctetString]);
  return derNode(0x30, sequence);
}

async function importPrivateKeyFromInput(privateKeyInput) {
  const normalized = normalizePem(privateKeyInput, 'PRIVATE KEY');
  if (!normalized) {
    throw new Error('Provide a private key before generating a cookie.');
  }

  const isPkcs1 = normalized.includes('BEGIN RSA PRIVATE KEY');
  const derBytes = pemToDerBytes(normalized);
  const keyData = isPkcs1 ? pkcs1ToPkcs8(derBytes) : derBytes;

  try {
    return await crypto.subtle.importKey(
      'pkcs8',
      keyData.buffer,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign'],
    );
  } catch {
    throw new Error('Unable to import private key. Use PKCS#8 or RSA PKCS#1 key material.');
  }
}

async function importPublicKeyFromInput(publicKeyInput) {
  const normalized = normalizePem(publicKeyInput, 'PUBLIC KEY');
  if (!normalized) {
    return null;
  }

  try {
    return await crypto.subtle.importKey(
      'spki',
      pemToDerBytes(normalized).buffer,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify'],
    );
  } catch {
    throw new Error('Unable to import public key for verification.');
  }
}

async function buildPanDomainCookieFromKeys() {
  const privateKey = await importPrivateKeyFromInput(manualPrivateKeyInput.value);
  const expires = Date.now() + 60 * 60 * 1000;
  const message = [
    'firstName=Feature',
    'lastName=Catalog',
    'email=composer.application@guardian.co.uk',
    'system=restorer-feature-catalog',
    'authedIn=restorer-feature-catalog',
    'expires=' + String(expires),
    'multifactor=true',
  ].join('&');

  const messageBytes = new TextEncoder().encode(message);
  const signatureBuffer = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, messageBytes);
  const signatureBytes = new Uint8Array(signatureBuffer);
  const cookie = base64FromUint8(messageBytes) + '.' + base64FromUint8(signatureBytes);

  const optionalPublicKey = await importPublicKeyFromInput(manualPublicKeyInput.value);
  if (optionalPublicKey) {
    const verified = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', optionalPublicKey, signatureBytes, messageBytes);
    if (!verified) {
      throw new Error('Public/private key verification failed. Check key pair values.');
    }
  }

  return cookie;
}

function applyPreviewAuthCookie(cookieValue) {
  const value = String(cookieValue || '').trim();
  if (!value) {
    return false;
  }
  data.authCookie = value;
  manualCookieInput.value = value;
  return true;
}

function persistManualAuthInputs() {
  localStorage.setItem('featureCatalog.manualPrivateKey', manualPrivateKeyInput.value || '');
  localStorage.setItem('featureCatalog.manualPublicKey', manualPublicKeyInput.value || '');
  localStorage.setItem('featureCatalog.manualCookie', manualCookieInput.value || '');
}

function loadManualAuthInputs() {
  const privateKey = localStorage.getItem('featureCatalog.manualPrivateKey') || '';
  const publicKey = localStorage.getItem('featureCatalog.manualPublicKey') || '';
  const cookie = localStorage.getItem('featureCatalog.manualCookie') || '';
  manualPrivateKeyInput.value = privateKey;
  manualPublicKeyInput.value = publicKey;
  manualCookieInput.value = cookie || data.authCookie || '';
  if (!data.authCookie && cookie) {
    data.authCookie = cookie;
  }
}

function injectPreviewAuthCookie() {
  return applyPreviewAuthCookie(data.authCookie);
}

async function configurePreviewProxy(baseUrl) {
  const response = await fetch('/__feature_preview/configure', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      baseUrl,
      authCookie: data.authCookie || '',
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Failed to configure preview proxy');
  }
}

async function ensureFrameReady() {
  const baseUrl = baseUrlInput.value.trim();
  if (!baseUrl) {
    setStatus('Enter a base URL for preview.', 'warn');
    return false;
  }

  injectPreviewAuthCookie();
  const reachable = await isStackReachable(baseUrl);
  if (!reachable) {
    stackReminder.hidden = false;
    setStatus('Local stack unavailable. Start it with npm run local:stack.', 'warn');
    return false;
  }

  stackReminder.hidden = true;
  await configurePreviewProxy(baseUrl);
  if (!frame.src || !frame.src.startsWith(window.location.origin + '/')) {
    frame.src = '/';
    await new Promise((resolve) => {
      frame.onload = () => resolve();
    });
  } else if (frame.contentWindow) {
    frame.contentWindow.location.replace('/');
    await new Promise((resolve) => {
      frame.onload = () => resolve();
    });
  }

  return true;
}

async function executeAction(action) {
  const frameWindow = frame.contentWindow;
  if (!frameWindow || !frameWindow.document) {
    throw new Error('Preview iframe is not ready');
  }

  const doc = frameWindow.document;
  switch (action.type) {
    case 'open-content-page': {
      await configurePreviewProxy(baseUrlInput.value.trim());
      frameWindow.location.href = '/';
      await new Promise((resolve) => {
        frame.onload = () => resolve();
      });
      const input = doc.querySelector('input[aria-label="Enter a composer url:"], input[type="text"]');
      if (!input) {
        throw new Error('Composer URL input not found');
      }
      input.value = '568c4110e4b0c73bdb0e52df';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      const searchBtn = findButtonByText(doc, ['Search']);
      if (!searchBtn) {
        throw new Error('Search button not found');
      }
      searchBtn.click();
      await new Promise((resolve) => setTimeout(resolve, 700));
      return;
    }
    case 'click-text-button': {
      const button = findButtonByText(doc, action.options || []);
      if (!button) {
        throw new Error('Button not found for options: ' + (action.options || []).join(','));
      }
      button.click();
      await new Promise((resolve) => setTimeout(resolve, 250));
      return;
    }
    case 'click-nth': {
      const nodes = Array.from(doc.querySelectorAll(action.selector || ''));
      const node = nodes[action.index || 0];
      if (!node) {
        throw new Error('Element not found for selector: ' + action.selector);
      }
      node.click();
      await new Promise((resolve) => setTimeout(resolve, 250));
      return;
    }
    case 'press-escape': {
      frameWindow.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 180));
      return;
    }
    case 'wait': {
      await new Promise((resolve) => setTimeout(resolve, action.ms || 300));
      return;
    }
    case 'assert-visible': {
      const node = queryBySelectors(doc, action.selector || '');
      if (!node) {
        throw new Error('Expected visible element not found: ' + action.selector);
      }
      return;
    }
    case 'assert-hidden': {
      const node = queryBySelectors(doc, action.selector || '');
      if (node) {
        throw new Error('Expected hidden element still visible: ' + action.selector);
      }
      return;
    }
    case 'assert-text': {
      const node = queryBySelectors(doc, action.selector || '');
      if (!node) {
        throw new Error('Element not found for text assertion: ' + action.selector);
      }
      const text = (node.textContent || '').trim();
      if (!text.includes(action.text || '')) {
        throw new Error('Text mismatch for selector ' + action.selector + '. Expected fragment: ' + action.text + ', got: ' + text);
      }
      return;
    }
    case 'assert-attr': {
      const node = queryBySelectors(doc, action.selector || '');
      if (!node) {
        throw new Error('Element not found for attr assertion: ' + action.selector);
      }
      const value = node.getAttribute(action.attr || 'href') || '';
      if (!value.includes(action.text || '')) {
        throw new Error('Attribute mismatch. Expected fragment: ' + action.text + ', got: ' + value);
      }
      return;
    }
    case 'assert-class': {
      const node = queryBySelectors(doc, action.selector || '');
      if (!node) {
        throw new Error('Element not found for class assertion: ' + action.selector);
      }
      if (!node.classList.contains(action.className)) {
        throw new Error('Class ' + action.className + ' not found on selector: ' + action.selector);
      }
      return;
    }
    case 'noop':
    default:
      return;
  }
}

async function runOneStep() {
  const ready = await ensureFrameReady();
  if (!ready) {
    return;
  }

  const scenario = selectedScenario();
  if (stepIndex >= scenario.steps.length) {
    setStatus('Scenario complete.', 'ok');
    return;
  }

  const step = scenario.steps[stepIndex];
  setStepClass(stepIndex, 'current');
  setStatus('Running: ' + step.text, '');

  try {
    if (!step.definition) {
      setStepClass(stepIndex, 'pending');
      setStatus('No matching step definition for: ' + step.text, 'warn');
      stepIndex += 1;
      renderSteps();
      return;
    }
    await executeAction(step.action);
    setStepClass(stepIndex, 'done');
    setStatus('Passed: ' + step.text, 'ok');
  } catch (error) {
    setStepClass(stepIndex, 'failed');
    setStatus('Failed: ' + (error.message || String(error)), 'error');
    return;
  }

  stepIndex += 1;
  renderSteps();
}

async function runScenario() {
  const scenario = selectedScenario();
  while (stepIndex < scenario.steps.length) {
    await runOneStep();
    if (statusNode.classList.contains('error') || statusNode.classList.contains('warn')) {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
}

async function runScenarioAt(index) {
  scenarioIndex = index;
  stepIndex = 0;
  scenarioSelect.value = String(index);
  renderSteps();
  updateScenarioRunStatus(index, 'Running...', '');

  await runScenario();

  if (statusNode.classList.contains('error')) {
    updateScenarioRunStatus(index, statusNode.textContent || 'Failed', 'error');
    return;
  }

  if (statusNode.classList.contains('warn')) {
    updateScenarioRunStatus(index, statusNode.textContent || 'Completed with warning', 'warn');
    return;
  }

  updateScenarioRunStatus(index, statusNode.textContent || 'Passed', 'ok');
}

function resetScenario() {
  stepIndex = 0;
  renderSteps();
  if (frame.src && frame.contentWindow) {
    frame.contentWindow.location.reload();
  }
  setStatus('Scenario reset.', '');
}

scenarioSelect.addEventListener('change', () => {
  scenarioIndex = Number(scenarioSelect.value) || 0;
  stepIndex = 0;
  renderSteps();
  setStatus('Scenario selected: ' + selectedScenario().name, '');
});

connectBtn.addEventListener('click', async () => {
  const ok = await ensureFrameReady();
  if (ok) {
    setStatus('Preview connected.', 'ok');
  }
});

applyAuthCookieBtn.addEventListener('click', () => {
  const applied = applyPreviewAuthCookie(manualCookieInput.value);
  persistManualAuthInputs();
  if (applied) {
    setStatus('Auth cookie applied for preview.', 'ok');
    return;
  }
  setStatus('Paste an auth cookie or generate one from keys first.', 'warn');
});

generateAuthCookieBtn.addEventListener('click', async () => {
  try {
    const cookie = await buildPanDomainCookieFromKeys();
    applyPreviewAuthCookie(cookie);
    persistManualAuthInputs();
    setStatus('Generated and applied auth cookie from provided keys.', 'ok');
  } catch (error) {
    setStatus('Unable to generate cookie: ' + (error.message || String(error)), 'error');
  }
});

manualCookieInput.addEventListener('blur', persistManualAuthInputs);
manualPrivateKeyInput.addEventListener('blur', persistManualAuthInputs);
manualPublicKeyInput.addEventListener('blur', persistManualAuthInputs);

runNext.addEventListener('click', runOneStep);
runAll.addEventListener('click', runScenario);
resetBtn.addEventListener('click', resetScenario);

scenarioFocusButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const index = Number(button.dataset.scenarioIndex || '0');
    scenarioIndex = index;
    stepIndex = 0;
    scenarioSelect.value = String(index);
    renderSteps();
    setStatus('Scenario selected: ' + selectedScenario().name, '');
  });
});

scenarioRunButtons.forEach((button) => {
  button.addEventListener('click', async () => {
    const index = Number(button.dataset.scenarioIndex || '0');
    await runScenarioAt(index);
  });
});

scenarioResetButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const index = Number(button.dataset.scenarioIndex || '0');
    scenarioIndex = index;
    stepIndex = 0;
    scenarioSelect.value = String(index);
    renderSteps();
    updateScenarioRunStatus(index, 'Not run', '');
    setStatus('Scenario reset.', '');
  });
});

loadManualAuthInputs();
if (data.authCookie && !manualCookieInput.value) {
  manualCookieInput.value = data.authCookie;
}

renderSteps();
ensureFrameReady().then((ok) => {
  if (!ok) {
    stackReminder.hidden = false;
    return;
  }
  if (!data.authCookie) {
    setStatus('Preview connected. No auth cookie was injected; paste cookie or provide keys in Manual Auth.', 'warn');
  }
});
</script>
</body></html>`;
}

function main() {
    if (!fs.existsSync(featuresDir)) {
        throw new Error(`Features directory not found: ${featuresDir}`);
    }

    fs.mkdirSync(outputDir, { recursive: true });

    const stepPatternIndex = buildStepPatternIndex();
    const featureFiles = listFiles(featuresDir, ".feature");

    const features = featureFiles.map((filePath) => {
        const source = fs.readFileSync(filePath, "utf8");
        const parsed = parseFeature(source);
        const baseName = path.basename(filePath, ".feature");

        const scenarios = parsed.scenarios.map((scenario, index) => ({
            name: scenario.name,
            tags: scenario.tags,
            comments: scenario.comments,
            steps: scenario.steps.map((stepText) => {
                const definition = matchDefinition(stepPatternIndex, stepText);
                return {
                    text: stepText,
                    definition: definition
                        ? { kind: definition.kind, fileName: definition.fileName, phrase: definition.phrase }
                        : null,
                    action: inferAction(stepText),
                };
            }),
            anchor: `${slug(scenario.name || `scenario-${index + 1}`)}-${index + 1}`,
        }));

        return {
            featureName: parsed.featureName,
            outputName: `${baseName}.html`,
            scenarios,
        };
    });

    features.forEach((feature) => {
        fs.writeFileSync(path.join(outputDir, feature.outputName), buildFeaturePage(feature, features), "utf8");
    });

    fs.writeFileSync(path.join(outputDir, "index.html"), buildIndexPage(features), "utf8");

    console.log(`Generated ${features.length} interactive feature pages in ${outputDir}`);
    console.log("Serve the catalog with: npm run bdd:features:serve");
    console.log("Then open: http://localhost:9010/catalog/");
    console.log(`Preview proxy target defaults to: ${defaultBaseUrl}`);
}

main();
