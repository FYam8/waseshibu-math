# Scheduler Planner Shadow Checkpoint

Status: read-only persisted planner shadow implemented; active-reader parity and aggregate migration integration intentionally deferred

## Scope

This checkpoint covers the two WaseShibu scheduler records:

- `waseshibu-math-daily-required-plan-v2`
- `waseshibu-math-study-ahead-plan-v1`

It does not cover the separate 8-question practice session in `waseshibu-math-daily`.

## Canonical boundary

The shared engine now defines `CanonicalScheduledTaskPlan` and `CanonicalScheduledTaskReference`.

Only school-neutral persistence concepts are promoted:

- plan kind;
- date;
- opaque `targetId`;
- ordered pending/completed task IDs;
- optional fallback task identity and explicit problem lineage.

WaseShibu-specific presentation/action data stays under `schoolEvidence`, including:

- legacy task kind;
- title/detail;
- priority;
- `to` route string;
- A/B/C grade;
- queue-version evidence.

The engine must not parse `review-*`, `practice-*`, `progression:*` or route strings to infer meaning.

## Read-only guarantee

`plannerShadow.ts` reads the two persisted records directly. It never calls WaseShibu reconciliation functions, which can freeze/refill/promote planner state and therefore may write.

The current checkpoint performs no generation, promotion, queue reconciliation, target switching or storage writes.

## Fail-closed rules

The planner projection rejects:

- corrupt JSON;
- unknown plan fields;
- unsupported target values;
- non-string pending/completed task IDs;
- malformed fallback task metadata;
- unsupported fallback task fields;
- non-integer queue-version evidence.

No unknown persisted field is silently discarded merely to fit the canonical contract.

## Build gate

`test:shared-engine-planner-shadow` verifies the persisted projection, task-order preservation, target mapping, fallback lineage, school-only route evidence, absent-key behavior and zero writes.

## Not yet claimed

This checkpoint does **not** claim parity with the private legacy planner readers/reconcilers in `dailyPlan.ts`, and it does not add planner state to the aggregate migration rehearsal.

The next step is to isolate genuinely read-only legacy reader semantics, compare them with this raw shadow, and only then consider planner state for aggregate rehearsal/rollback coverage.
