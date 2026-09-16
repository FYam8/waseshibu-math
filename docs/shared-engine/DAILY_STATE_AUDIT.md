# Daily State Audit

Status: legacy daily-practice shadow/parity implemented; scheduler state intentionally not canonicalized yet

## Why this needs a separate extraction step

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

These must not be collapsed into one universal `DailyState` merely because their names contain `daily`.

## Daily practice session: current safe extraction

The shared contract now has `CanonicalDailyPracticeSession` for the first concept only.

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

The normal build runs `test:shared-engine-daily` so corrupt JSON, malformed shapes, unknown fields or parity drift block the branch.

## Important current-reader finding

`loadDaily()` currently performs JSON parsing only; unlike attempts and exam scores, it does not normalize or validate the shape. Therefore a parseable but malformed object can enter current runtime code.

For migration safety, the canonical adapter is deliberately stricter: parseable malformed state is not interpreted as valid canonical state. It blocks migration and requires an explicit policy.

This is a migration-safety rule, not a change to current production runtime behavior.

## Why the required-task planner is not canonicalized in this step

The required plan and study-ahead plan include school-policy and UI/action data that must be separated before they can become a reusable engine contract:

- numeric WaseShibu target `60 | 70 | 75`;
- generated task IDs such as review/practice/progression IDs;
- `fallbackTask` snapshots containing title/detail/priority and WaseShibu route strings such as `/past-papers?year=...`;
- a WaseShibu-specific queue-version/reconciliation algorithm;
- promotion of next-day plan into today's plan;
- write-on-reconcile behavior used to freeze the daily cap and avoid automatic 11th-task refill.

A downstream school must not be forced to store WaseShibu routes or interpret task IDs by string prefix.

Before these planner records join the aggregate canonical migration candidate, Phase 1 must define a planner contract that separates at least:

- opaque scheduled-task identity;
- target identity as school-defined `targetId`;
- plan date and completion membership;
- generic scheduler state;
- school-owned task resolver/presentation/action metadata;
- version/migration evidence.

The existing WaseShibu behavior — maximum 10 required tasks, no automatic 11th refill, target-change cap preservation and next-day handoff — remains the compatibility baseline and must not change during extraction.

## Aggregate migration status

`waseshibu-math-daily` is **audited but not yet included in the aggregate migration rehearsal**.

The following remain outside the aggregate candidate at this checkpoint:

- daily practice session;
- required-task planner;
- study-ahead planner;
- prep-check;
- guided review/progress;
- remediation progress;
- Level2 history/mastery;
- backup/export semantics;
- IndexedDB/cloud progress projection.

No production learner-state cutover is allowed while those surfaces remain outside the full rehearsal/rollback gate.

## Next safe step

After the daily-practice gate is green, inspect/extract the required-task and study-ahead planners as read-only snapshots first. Do not integrate `waseshibu-math-daily` into the aggregate rehearsal until the planner boundary is explicit, because backup/restore and learner-visible "Today" behavior must be migrated as one coherent policy rather than as similarly named keys.
