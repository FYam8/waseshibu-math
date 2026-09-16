# Daily State Audit

Status: daily-practice parity implemented; required-task/study-ahead planner shadows implemented read-only; aggregate migration not yet expanded

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

The normal build runs `test:shared-engine-daily` so corrupt JSON, malformed shapes, unknown fields or parity drift block the branch.

## Important daily-practice reader finding

`loadDaily()` currently performs JSON parsing only; unlike attempts and exam scores, it does not normalize or validate the shape. Therefore a parseable but malformed object can enter current runtime code.

For migration safety, the canonical adapter is deliberately stricter: parseable malformed state is not interpreted as valid canonical state. It blocks migration and requires an explicit policy.

This is a migration-safety rule, not a change to current production runtime behavior.

## Scheduler contract boundary

The shared contract now also defines `CanonicalScheduledTaskPlan` and `CanonicalScheduledTaskReference` for persisted scheduler state, while keeping them separate from `CanonicalDailyPracticeSession`.

The generic scheduler contract contains only:

- plan kind (`today-required` or `study-ahead`);
- plan date;
- opaque school-defined `targetId`;
- ordered pending/completed task IDs;
- an optional fallback task reference with opaque task ID and optional problem lineage;
- opaque school-owned evidence.

It deliberately does **not** define WaseShibu URL grammar, task-ID prefixes, numeric score targets, queue-version meaning or the "maximum 10 / no automatic 11th refill" policy as universal semantics.

## Planner shadow: current safe extraction

`src/schools/waseshibu/plannerCompatibility.ts` strictly projects persisted planner records into the generic scheduler contract.

For WaseShibu:

- numeric `60 | 70 | 75` is converted through the school compatibility map into opaque `targetId`;
- `pendingIds` and `completedIds` remain opaque and ordered;
- `fallbackTask.id` becomes the generic task identity;
- `fallbackTask.questionId`, when present, is retained only as explicit problem lineage;
- fallback title/detail/priority/kind and the WaseShibu `to` route are preserved under `schoolEvidence` rather than promoted to universal planner fields;
- `queueVersion` is preserved as `legacyQueueVersion` under school evidence.

`src/schools/waseshibu/plannerShadow.ts` reads `waseshibu-math-daily-required-plan-v2` and `waseshibu-math-study-ahead-plan-v1` directly from raw storage. It does not call reconciliation, generate tasks, promote next-day state, refill a queue, change a target or write localStorage.

`scripts/test-shared-engine-planner-shadow.mjs` verifies:

- exact ordered task-ID preservation;
- school target mapping;
- fallback problem lineage preservation;
- WaseShibu routes remain school evidence;
- absence remains `null` rather than inventing an empty persisted plan;
- corrupt JSON, unsupported fields, invalid targets and malformed fallback metadata fail closed;
- zero persistence writes.

The normal build now runs `test:shared-engine-planner-shadow`.

## Why planner parity is intentionally not claimed yet

The current planner readers/reconcilers are private inside `dailyPlan.ts`, and normal high-level planner APIs can write during reconciliation. This extraction step therefore does **not** claim active-reader parity yet and does not modify `dailyPlan.ts` merely to make the audit convenient.

The next safety step is to expose or isolate genuinely read-only legacy planner-reader semantics without invoking reconciliation, then compare those current reader values against the raw canonical planner shadow. Only after that parity gate is green should planner state be considered for the aggregate migration rehearsal.

This preserves the current learner-visible baseline:

- maximum 10 required tasks;
- no automatic 11th required-task refill;
- target-change cap preservation;
- next-day handoff/promotion behavior.

None of those runtime behaviors are changed by the current planner-shadow work.

## Aggregate migration status

The aggregate migration rehearsal currently covers preferences, exam results, drafts, route/completion/reinforcement and audited activity/attempt history.

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

Add a **read-only planner parity gate** without running reconciliation or changing current write behavior. After planner parity is proven, evaluate daily practice + both scheduler records together as one coherent backup/migration unit before expanding the aggregate rehearsal.
