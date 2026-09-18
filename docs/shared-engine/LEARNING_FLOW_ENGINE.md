# Shared learning-flow engine

Status: behaviour-preserving pure state extraction; legacy persistence remains authoritative.

`src/engine/learningFlow.ts` owns school-neutral state transitions used by the
learning UX:

- guided-answer exposure, independent success and self-reproduction mastery;
- the rule for advancing an authored explanation step;
- fixed-set reconciliation without replacing valid existing items;
- preservation of completed problems and retrying only unresolved problems;
- next unresolved problem and sequential-flow movement.

Problem IDs are opaque. The module does not read storage, choose school
content, grade mathematics, derive a year/form/skill from an ID, or define a
school target. WaseShibu continues to own its Level2 candidate ordering,
four-item policy, authored Guided Solutions and all current persistence keys.

The existing WaseShibu writers now call the pure engine and keep the same JSON
shape. `test:shared-engine-learning-flow` verifies representative pre-extraction
outcomes, school neutrality, WaseShibu runtime consumption and deterministic
browser-bundle parity.

Downstream apps may vendor `learningFlow.ts` and
`learningFlow.runtime.js` only from a pinned WaseShibu commit. Their own school
packages remain responsible for content mapping, labels, answer authority,
storage identity and review intervals.

This extraction does not authorize canonical learner-state writes and does not
change backup/import, local restore, external sync or legacy migration policy.
