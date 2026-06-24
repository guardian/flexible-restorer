# Better Gherkin Guidelines (Stage 4 Asset)

Source distilled from: https://cucumber.io/docs/bdd/better-gherkin/
Retrieved: 2026-06-23

Use this checklist during Stage 4 feature generation.

## Core Principles

- Describe behavior, not implementation.
- Prefer what the user/business outcome is, not UI mechanics.
- Use declarative wording so scenarios remain stable when UI details change.
- Keep scenarios short, readable, and focused on one intent.

## Declarative Writing Pattern

- Good style:
- Given the user has relevant business context
- When they perform a meaningful business action
- Then they observe a user-visible business outcome

- Avoid style:
- click/type/press specific widget-level steps unless absolutely needed
- hard-wiring page internals when intent can be stated directly

## Stage 4 Quality Checklist

- Scenario title names a user goal or expected behavior.
- Given sets user role/state and relevant context.
- When expresses a meaningful action in user language.
- Then validates user-visible value or outcome.
- And clarifies follow-up outcome (feedback/error/success visibility).
- Evidence links (routes/actions/components/templates) are kept as evidence comments, not user-facing wording.

## Reusability and Maintainability Checks

- Ask: would this step need to change if implementation changes but behavior stays the same?
- If yes, rewrite more declaratively.
- Keep domain language consistent across scenarios in the same feature.
- Prefer scenario outlines when only example values change.

## Refactoring Heuristics

- Replace "click/type/press" with "submit/search/confirm/select/review".
- Replace widget names in user steps with task intent.
- Keep technical artifact names in evidence comments only.

## Definition of Done for Stage 4

A generated feature is acceptable when:
- It reads as user-facing living documentation.
- It captures behavior intent and expected outcomes clearly.
- It avoids brittle implementation detail in step text.
- It retains traceability via evidence comments.
