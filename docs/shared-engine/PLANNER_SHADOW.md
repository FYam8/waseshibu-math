# Scheduler Planner Shadow Checkpoint

Status: persisted raw shadow + read-only legacy-reader parity gate implemented; aggregate migration integration intentionally deferred

## Scope

This checkpoint covers the two WaseShibu scheduler records:

- `waseshibu-math-daily-required-plan-v2`
- `waseshibu-math-study-ahead-plan-v1`

It does not cover the separate 8-question practice session in `waseshibu-math-daily`.

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

## Two independent read-only views

`plannerShadow.ts` reads the exact two persisted records directly and applies the strict canonical projection.

`plannerLegacyReader.ts` separately mirrors the current private reader semantics in `dailyPlan.ts` without invoking any reconciliation API:

- the required-plan reader keeps the current date-scoped behavior and target fallback;
- the study-ahead reader keeps the current invalid/missing -> `null` behavior;
- neither reader writes, freezes, refills, promotes or regenerates persisted state.

`plannerAudit.ts` compares valid persisted plans from the legacy-reader mirror against the canonical raw shadow. The audit captures the scheduler source strings before/after and fails if they change.

Because the live private functions remain embedded in `dailyPlan.ts`, the test also pins the compatibility mirror to the current source-level reader signatures/normalization expressions. If those runtime readers change, the parity gate requires the compatibility mirror to be reviewed before migration claims can advance.

This is deliberately safer than calling high-level planner APIs during audit, because the high-level APIs reconcile and can write state.

## Important behavior distinction

Absence/staleness has different runtime and persistence meanings:

- no persisted required plan => canonical persisted shadow is `null`;
- the current runtime required-plan reader still synthesizes an empty ephemeral plan for the requested date/target;
- a stored plan for another date is likewise treated as an empty ephemeral current-day plan;
- the persisted shadow does not invent that ephemeral value.

The parity audit therefore compares canonical persisted values only when a corresponding valid raw record exists, while separately testing the legacy absent/stale behavior.

## Fail-closed rules

The strict canonical planner projection rejects:

- corrupt JSON;
- unknown plan fields;
- unsupported target values;
- non-string pending/completed task IDs;
- malformed fallback task metadata;
- unsupported fallback task fields;
- non-integer queue-version evidence.

This remains intentional even though the current runtime reader is more forgiving. A malformed record may be ignored/regenerated for runtime continuity, but migration must not silently discard unknown learner state.

## Build gates

- `test:shared-engine-planner-shadow` verifies exact persisted projection, task order, target mapping, fallback lineage, school-only route evidence, absent-key behavior and zero writes.
- `test:shared-engine-planner-parity` verifies the read-only legacy-reader semantics against the canonical raw shadow for valid plans, preserves stale/absent behavior, fails closed on unsupported raw state and performs zero writes.

Both are required by the normal build.

## Still not yet claimed

Planner state is **not yet added to the aggregate migration rehearsal**.

The next safe step is to combine the already-audited daily-practice session with both planner records in one expanded in-memory rehearsal, add exact rollback bytes for all three daily-family keys and prove the existing 10-task/no-11th-refill/next-day-promotion behavior remains outside the migration adapter rather than being reimplemented as universal engine policy.
