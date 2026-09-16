# Canonical Learner-State Migration Rehearsal

Status: Phase-1 read-only rehearsal includes audited activities; production learner-state writes remain legacy

## Purpose

Before any WaseShibu learner record is rewritten into the canonical shared-engine format, the branch must prove that the proposed conversion is equivalent to the current runtime, preserves rollback evidence and fails closed when a safe one-to-one conversion cannot be established.

The rehearsal is deliberately **read-only**. It is not the production migration and it does not create, rename, delete or overwrite any learner storage key.

## Current audited scope

The aggregate rehearsal currently covers:

- preferences / target identity;
- exam results;
- exam drafts;
- learning route, completion locks and reinforcement plans;
- legacy attempts projected into discriminated canonical activity records.

The attempts container is not treated as one universal attempt schema. Its audited canonical projection distinguishes:

- `problem-attempt` — a learner answered, skipped or deferred a concrete problem;
- `exam-exposure` — a concrete past paper was opened/exposed;
- `mastery-marker` — a legacy WaseShibu mastery marker that must not be counted as an answer attempt.

The exact legacy source strings captured as rollback evidence are:

- `waseshibu-math-attempts`
- `waseshibu-math-preferences`
- `waseshibu-math-exam-scores`
- `waseshibu-math-exam-drafts-v2`
- `waseshibu-math-learning-route-v1`
- `waseshibu-math-sync-meta`
- `waseshibu-math-data-version`

This list is still intentionally narrower than the final learner-state migration. The following are **not yet declared migrated by this rehearsal**:

- daily state / daily plans / study-ahead state;
- prep-check state;
- guided review/progress;
- remediation progress;
- Level2 history/mastery state;
- backup/export package semantics;
- progress-sync IndexedDB/cloud projection.

No production cutover may occur while those remaining state surfaces are outside the canonical migration gate.

## Rehearsal sequence

`src/schools/waseshibu/migrationRehearsal.ts` performs the following sequence in memory:

1. capture the exact raw legacy strings for the current audited source keys;
2. run the actual legacy-reader vs canonical-shadow dual-read audit for preferences/results/drafts/route;
3. run the independent `loadAttempts()` vs raw-storage canonical activity audit;
4. reject the candidate if either audit reports a mismatch, filtered record, corruption or unmappable value;
5. combine both audited projections into one in-memory `CanonicalLearnerStateMigrationCandidate`;
6. validate canonical exam IDs and target IDs against the WaseShibu catalog/profile;
7. reject duplicate exam-result IDs and duplicate activity IDs until explicit no-loss identity policies exist;
8. capture the source strings again and fail if the rehearsal changed any persisted value;
9. return the canonical candidate only as an in-memory value object.

The rehearsal contract marker is now version `2` because activities were added to the aggregate candidate. This marker is independent from WaseShibu app/data versions and from the future shared content contract version.

A `ready: true` rehearsal means only that the **currently audited scope** is safe to advance to the next migration-engine step. It does not mean WaseShibu learner state is ready for production cutover.

## Activity safety rules

The activity layer preserves current WaseShibu normalization such as legacy device/reset fallbacks while avoiding false universal semantics:

- `q1|multi` remains WaseShibu legacy evidence, not a universal canonical purpose enum;
- `exam-*` and `target-*` problem IDs are bound to an `examId` only when the year mapping is deterministic;
- synthetic `year-*` training activity is not treated as a real past-paper exam merely because its ID contains a year;
- unsupported exam exposure cannot be preserved meaningfully without a concrete exam identity, so it fails closed;
- records that the current legacy reader silently filters are treated as potential migration data loss and fail the rehearsal.

## Rollback proof

`scripts/test-shared-engine-migration-rehearsal.mjs` takes the exact raw source snapshot returned by the rehearsal, mutates an isolated in-memory clone, then restores every audited source key from those captured raw strings.

The test requires byte/string parity for every audited source key after the simulated rollback, including the complete legacy attempts string. It also verifies that still-out-of-scope learner data such as `waseshibu-math-daily` remains untouched.

This is rollback **evidence**, not the final production rollback mechanism. Any real write migration must still use the app's established backup/restore-point safety framework and must restore both source keys and any newly introduced canonical keys atomically on failure.

## Fail-closed cases

The current rehearsal blocks advancement when, for example:

- the legacy runtime and canonical shadow disagree;
- the legacy attempt reader and canonical activity shadow disagree;
- an exam/year cannot map to a known WaseShibu `examId` where a concrete exam identity is required;
- a target cannot map to a known WaseShibu `targetId`;
- a reinforcement plan has inconsistent exam identity;
- duplicate result IDs are present without an explicit migration policy;
- duplicate activity IDs are present without an explicit migration policy;
- an attempt record would be silently filtered by the current reader;
- the rehearsal itself changes persisted source data.

No guessed value, silent record drop or implicit deduplication is allowed merely to make the migration pass.

## Required build gates

The normal production build now runs these shared-engine learner-state safety gates before the existing WaseShibu regression suite:

1. `test:shared-engine-compat`
2. `test:shared-engine-shadow`
3. `test:shared-engine-activity`
4. `test:shared-engine-dual-read`
5. `test:shared-engine-migration-rehearsal`

A failure in any of these blocks the PR/deploy build.

## Next migration step

Before a production write path is designed, the same shadow/parity/rehearsal pattern must be expanded to the remaining learner-state surfaces, starting with daily state and related daily-plan data. Only after the full backup-relevant state is covered should the branch add a candidate write migration with restore-point creation, atomic rollback and post-write parity verification.
