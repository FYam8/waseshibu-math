# Scheduler Planner Shadow Checkpoint

Status: persisted planner shadow + read-only legacy-reader parity + aggregate rehearsal coverage implemented; reconciliation writes remain legacy

## Scope

This checkpoint covers the two WaseShibu scheduler records:

- `waseshibu-math-daily-required-plan-v2`
- `waseshibu-math-study-ahead-plan-v1`

It does not collapse them into the separate 8-question practice session in `waseshibu-math-daily`.

## Canonical boundary

The shared engine defines `CanonicalScheduledTaskPlan` and `CanonicalScheduledTaskReference`.

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

`plannerLegacyReader.ts` separately mirrors only the private read semantics from `dailyPlan.ts`. `plannerAudit.ts` compares valid legacy-reader projections with the strict raw-storage shadow without executing task generation, target switching, next-day promotion, queue refill or any localStorage write.

The parity test also source-pins the private reader logic in `dailyPlan.ts`, so a later change to those reader conditions cannot silently invalidate the audit mirror.

## Fail-closed rules

The strict planner projection rejects:

- corrupt JSON;
- unknown plan fields;
- unsupported target values;
- non-string pending/completed task IDs;
- malformed fallback task metadata;
- unsupported fallback task fields;
- non-integer queue-version evidence.

The legacy runtime may regenerate or ignore some broken planner state. Migration intentionally does not copy that forgiving behavior: unknown persisted information must not be silently discarded merely to fit the canonical contract.

## Build gates

- `test:shared-engine-planner-shadow` verifies persisted projection, task-order preservation, target mapping, fallback lineage, school-only route evidence, absent-key behavior and zero writes.
- `test:shared-engine-planner-parity` verifies read-only legacy-reader semantics against the strict shadow, stale/absent behavior and source-level reader drift guards.
- `test:shared-engine-migration-rehearsal` now includes both persisted planner plans in the aggregate candidate and exact rollback snapshot.

## Aggregate migration status

Both planner records are now part of `CanonicalLearnerStateMigrationCandidate` as:

- `todayRequiredPlan`
- `studyAheadPlan`

Their exact raw source strings are captured by the aggregate rehearsal and restored byte-for-byte in the isolated rollback proof.

This integration still does **not** move WaseShibu scheduler policy into the shared engine. The following behavior remains in legacy runtime code and is not executed by the rehearsal:

- maximum 10 required tasks;
- no automatic 11th refill;
- target-change replacement while preserving the cap;
- fallback-task completion handling;
- next-day study-ahead creation and promotion into Today.

Those are behavior baselines to preserve during later runtime extraction, not generic persistence semantics to infer from the stored task IDs.

## Next safe step

With daily practice and both persisted planner records under aggregate rehearsal/rollback coverage, the next learner-state families to audit are prep-check, guided review/progress, remediation and Level2 state. Production migration writes remain prohibited until those state families plus backup/export and cloud projection are covered.
