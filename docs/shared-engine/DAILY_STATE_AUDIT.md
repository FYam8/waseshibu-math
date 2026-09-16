# Daily State Audit

Status: daily-practice parity + scheduler shadow/parity + aggregate rehearsal coverage implemented; production writes remain legacy

## Why this needs separate concepts

WaseShibu currently persists three different concepts that all look "daily" at first glance but are not the same state model:

1. `waseshibu-math-daily`
   - resumable 8-question foundation-practice session;
   - stores concrete practice question IDs, queue/defer state, counts and elapsed time;
   - read by `loadDaily()` and written by `saveDaily()`.
2. `waseshibu-math-daily-required-plan-v2`
   - home-screen required-task plan with a daily cap of 10;
   - stores generated task IDs, completed IDs, target, queue version and sometimes a full fallback task snapshot;
   - reconciliation deliberately mutates/fixes the plan while normal app flows build today's tasks.
3. `waseshibu-math-study-ahead-plan-v1`
   - optional next-day study-ahead plan;
   - has similar task scheduling semantics and is later promoted into the day's required plan.

These remain separate canonical concepts. They are not collapsed into one universal `DailyState` merely because their names contain `daily`.

## Daily practice session

The shared contract has `CanonicalDailyPracticeSession` for the first concept only.

`src/schools/waseshibu/dailyCompatibility.ts` maps the legacy 8-question practice session without parsing problem IDs or attaching score/target meaning. The mapping preserves:

- date;
- ordered `questionIds` as opaque `problemIds`;
- completion flag;
- resumable queue;
- one-time defer list;
- settled/correct/wrong/deferred counts;
- session elapsed seconds;
- optional `updatedAt`.

No order is changed and no duplicate problem ID is removed.

Unknown fields, malformed arrays/counts or unsupported shapes fail closed rather than being guessed, coerced or silently dropped.

`src/schools/waseshibu/dailyShadow.ts` independently reads the raw `waseshibu-math-daily` string. `src/schools/waseshibu/dailyAudit.ts` compares that shadow with the actual current `loadDaily()` result and verifies the audit performs zero writes.

## Important current-reader finding

`loadDaily()` currently performs JSON parsing only; unlike attempts and exam scores, it does not normalize or validate the shape. Therefore a parseable but malformed object can enter current runtime code.

For migration safety, the canonical adapter is deliberately stricter: parseable malformed state is not interpreted as valid canonical state. It blocks migration and requires an explicit policy.

This is a migration-safety rule, not a change to current production runtime behavior.

## Required-task and study-ahead planners

The scheduler records are mapped separately through `CanonicalScheduledTaskPlan` / `CanonicalScheduledTaskReference`.

The canonical projection keeps:

- plan kind;
- date;
- opaque school-defined `targetId`;
- ordered pending/completed task IDs;
- optional fallback task identity and explicit problem lineage.

WaseShibu-only route strings, title/detail, priority, A/B/C grade and queue-version evidence remain under `schoolEvidence`. A downstream school is not required to understand WaseShibu task-ID prefixes or routes.

`plannerShadow.ts` reads persisted planner records without reconciliation. `plannerLegacyReader.ts` mirrors the private read semantics only. `plannerAudit.ts` compares those read-only projections while avoiding all write-capable high-level planner APIs.

## Behavior intentionally left in WaseShibu policy

The current runtime behavior remains unchanged:

- maximum 10 required tasks per day;
- no automatic 11th refill after completion;
- target changes preserve the total daily cap;
- fallback progression can count as the one required next action;
- study-ahead plans can be promoted into the next day's Today plan.

These rules are compatibility baselines. The aggregate migration rehearsal preserves the persisted planner bytes and canonical membership state, but it does not execute or universalize those scheduling rules.

## Aggregate migration status

All three daily-related records are now included in the read-only aggregate migration rehearsal:

- `waseshibu-math-daily` -> `dailyPractice`
- `waseshibu-math-daily-required-plan-v2` -> `todayRequiredPlan`
- `waseshibu-math-study-ahead-plan-v1` -> `studyAheadPlan`

The rehearsal captures the exact raw source strings for all three, requires the daily/planner audits to pass, includes their canonical projections in `CanonicalLearnerStateMigrationCandidate`, and proves byte-for-byte rollback in isolated memory.

The following remain outside the aggregate candidate at this checkpoint:

- prep-check;
- guided review/progress;
- remediation progress;
- Level2 history/mastery;
- backup/export semantics;
- IndexedDB/cloud progress projection.

No production learner-state cutover is allowed while those surfaces remain outside the full rehearsal/rollback gate.

## Required build gates

The normal build includes:

- `test:shared-engine-daily`
- `test:shared-engine-planner-shadow`
- `test:shared-engine-planner-parity`
- `test:shared-engine-migration-rehearsal`

Corrupt/malformed daily or planner state, reader parity drift or rollback coverage loss blocks the branch.

## Next safe step

Proceed to prep-check and then guided/remediation/Level2 state using the same pattern: strict raw shadow, active/read-only legacy parity where possible, fail-closed migration rules, aggregate rehearsal integration and exact rollback evidence before any production write path is introduced.
