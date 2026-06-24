---
name: generate-cucumber-from-templates-first
description: "Generate new source-driven Cucumber feature files by analyzing HTML templates first, then supporting JavaScript/controllers/routes. Split coverage into 4-6 domains, use tests/features formatting as a template, and avoid duplicating existing scenarios."
---

# Generate Source-Driven Features (Templates First)

Use this skill when the user wants to continue feature authoring from live source code, starting with template-level behavior and then drilling into implementation.

## Start Point

Begin from this intent:
- "Looking at the source code for the splash screen, what other scenarios are available..."

Interpretation:
- We are in feature-authoring mode (not catalog-generation mode).
- We are discovering uncovered user behavior directly from source.

## Goal

Produce new Cucumber feature files that:
1. Start from HTML template behavior.
2. Validate and enrich scenarios with controller/service/route evidence.
3. Are split into 4-6 clear domains.
4. Do not duplicate scenario intent already covered in existing feature files.

## Required Inputs

Primary-first analysis order:
1. HTML templates under public/javascripts/app/templates
2. Frontend controllers/services/models under public/javascripts/app
3. Backend routes and controllers under conf/routes and app/controllers

Feature style references (format only):
- tests/features/*.feature

Important:
- Use existing feature files only as formatting templates (Feature/Background/Scenario/Evidence layout).
- Do not copy scenario wording or step sequences from existing feature files.
- Do not use existing feature files as the source of truth for behavior; source code is the source of truth.

## Domain Rules

- Create 4-6 domains total.
- Each domain must represent a user-facing capability area.
- Domain names should be short and specific.
- Every scenario must have at least one template evidence line and any supporting JS/route evidence needed.

Preferred domain shape for this codebase (adjust if source strongly suggests otherwise):
- Search and Entry
- Version Discovery
- Snapshot Viewing and Interaction
- Restore Workflow
- Authentication and Access
- Export and Operational Endpoints

## Workflow

### Stage A: Template Inventory (Mandatory First)

Scan templates first and list:
- key visible UI sections
- controls and form actions
- stateful UI elements (loading, disabled, modal, error)
- user-triggered actions (click, submit, keypress)

Output a concise "Template Behavior Inventory" before writing scenarios.

Ask sign-off:
- "Approve this template inventory before scenario drafting?"

### Stage B: Candidate Scenarios From Templates

Draft candidate scenarios directly from template behavior only.
For each candidate include:
- user outcome
- trigger/action
- expected visible result
- initial template evidence path(s)

Then enrich each candidate by validating with:
- controllers/services/models
- routes/controllers (when relevant)

Ask sign-off:
- "Approve these candidate scenarios for domain split?"

### Stage C: Domain Split (4-6 Domains)

Group approved scenarios into 4-6 domains.
For each domain provide:
- domain name
- one-line domain intent
- scenario count
- source files that justify the grouping

Ask sign-off:
- "Approve this 4-6 domain breakdown?"

### Stage D: Write Feature Files

Write one feature file per approved domain into tests/features.

Feature requirements:
- user-facing language
- behavior-first scenarios
- happy path and failure path where present in source
- scenario outlines where source behavior varies by structured inputs
- evidence comments after each scenario using file paths

Evidence rule:
- First evidence line should be template path(s) where behavior is surfaced.
- Additional evidence lines should include JS/controller/service/route files that implement that behavior.

### Stage E: Anti-Duplication Pass (Mandatory)

Before finalizing each new feature file:
1. Compare scenario intent against existing tests/features/*.feature.
2. If intent already exists, do not re-add it.
3. If partial overlap exists, keep only the net-new behavior.
4. Merge near-identical scenarios into one behavior-focused scenario with combined evidence.

Ask sign-off:
- "Approve new non-duplicated features for these domains?"

## Output Location

- tests/ai-features/*.feature

## Quality Bar

- Source-backed scenarios only.
- No speculative behavior.
- No copied scenario text from existing feature files.
- Domain count stays within 4-6.
- Each scenario includes explicit evidence comments.
