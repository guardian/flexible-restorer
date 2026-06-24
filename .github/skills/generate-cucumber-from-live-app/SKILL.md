---
name: generate-cucumber-from-live-app
description: "Generate Cucumber BDD features from source code by scanning frontend JavaScript and backend routes/controllers, grouping functionality into domains, producing a markdown domain catalog, then generating detailed feature files with explicit developer sign-off at each step. Use when asked for cucumber, bdd, gherkin, feature files, domain catalog, or interactive approval workflow."
---

# Generate Cucumber Features From Source

Use this skill to derive BDD artifacts directly from this codebase.

## Goal

Create feature files in five controlled stages:
1. Generate domain definitions markdown from source code.
2. Build a structured catalog using the generated domain definitions.
3. Produce a high-level markdown domain catalog.
4. Generate detailed cucumber features for approved domains.
5. Iterate domain-by-domain with explicit user sign-off before each next stage.

## Inputs This Skill Uses

- Frontend JavaScript under public/javascripts
- Backend endpoints from conf/routes
- Backend controllers from app/controllers

## Required Interaction Contract

This skill is interactive. Do not continue automatically between stages.

At every stage gate, ask for sign-off using the ask-questions tool:
- Stage 1 approval: generated domain definitions and keyword sets
- Stage 2 approval: domain assignment in structured catalog
- Stage 3 approval: markdown catalog content and domain list
- Stage 4 approval: generated feature files for each domain
- Stage 5 approval: final refinement pass

If approval is declined, ask what to change and repeat that stage.

## Stage Workflow

### Stage 1: Generate domain definitions markdown

We want to look at the existing source code and identify the domains of functionality that exist in the application. This is done by scanning frontend JavaScript and backend routes/controllers, then grouping related functionality into domains.

Then provide a verbose Stage 1 summary from the generated markdown.
For each identified domain include:
- domain name
- brief domain description
- representative evidence (routes/actions/frontend)
and call out any domain that appears too broad or too narrow.

We can generate temporary code to scan the source code and produce a domain definitions markdown file, but this should be deleted after Stage 1 is complete. The domain definitions markdown file will be used as input for Stage 2.

Ask sign-off:
- "Approve generated domains and keywords?"


### Stage 2: Build catalog from approved domain definitions

We want to read the approved domain definitions markdown and produce a structured catalog of domains, including evidence from frontend files, backend routes, and controller actions.

Then summarize domain assignment coverage and any uncategorized evidence.

Ask sign-off:
- "Approve domain assignment and catalog JSON?"

### Stage 3: Render markdown catalog

We want to read the approved domain catalog JSON and produce a human-readable markdown catalog of domains, including evidence from frontend files, backend routes, and controller actions.

Then summarize inferred domains and evidence from stage 2

We can generate temporary code to scan the source code and produce a domain definitions markdown file, but this should be deleted after Stage 1 is complete. The domain definitions markdown file will be used as input for Stage 2.

Then summarize inferred domains and evidence:
- frontend files
- backend routes
- controller actions

Ask sign-off:
- "Approve this catalog as the baseline?"

### Stage 4: Generate detailed cucumber features

Before writing features, load and apply:

.github/skills/generate-cucumber-from-live-app/assets/better-gherkin-guidelines.md

We want to read the approved domain catalog and produce detailed feature files for each domain, including frontend-first scenarios derived from Angular components/controllers/templates in JS/HTML, and backend-route-informed checks as supporting evidence.

Then run cleanup pass to remove duplicate scenarios and consolidate evidence placement:


Generate one feature file per domain.

Each feature should include:
- frontend-first scenarios derived from Angular components/controllers/templates in JS/HTML
- group related frontend components that support the same user outcome into one scenario (do not create one scenario per component)
- avoid duplicate scenarios by merging component-level evidence into a single behavior-focused scenario when intent and outcome are the same
- list all contributing components/templates/routes/actions as evidence at the end of the scenario, instead of splitting into repeated near-identical scenarios
- clear domain tags
- user-facing behavior
- happy path and failure path scenarios
- scenario outlines where useful
- backend-route-informed checks as supporting evidence (not the primary source of user journeys)

Ask sign-off:
- "Approve generated features for all domains?"
- Or gather a selected subset of domains for regeneration.

### Stage 5: Refine and finalize

We want to make sure there are no duplicate scenarios across domains, and that all evidence is consolidated into the most relevant scenario.

Then run cleanup pass to remove duplicate scenarios and consolidate evidence placement:
Finish when user confirms all domains are complete.

## Output Locations

- tests/bdd-results/domain-catalog.json
- tests/bdd-results/domain-definitions.md
- tests/bdd-results/domain-catalog.md
- tests/bdd-results/features/*.feature

## Notes

- Keep generated text deterministic where possible.
- Preserve existing manual feature files if present by writing domain-specific filenames only.
- Prefer evidence-backed scenarios derived from routes, controllers, and frontend modules.
