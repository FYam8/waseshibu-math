# Canonical Learner-State Migration Rehearsal

Status: Phase-1 read-only rehearsal implemented; production learner-state writes remain legacy

## Purpose

Before any WaseShibu learner record is rewritten into the canonical shared-engine format, the branch must prove that the proposed conversion is equivalent to the current runtime, preserves rollback evidence and fails closed when a safe one-to-one conversion cannot be established.

The rehearsal is deliberately **read-only**. It is not the production migration and it does not create, rename, delete or overwrite any learner storage key.

## Current audited scope

The current rehearsal covers only the learner-state surfaces that already have canonical shadow and dual-read parity:

- preferences / target identity;
- exam results;
- exam drafts;
- learning route, completion locks and reinforcement plans.

The exact legacy source strings captured as rollback evidence are:

- `waseshibu-math-preferences`
- `waseshibu-math-exam-scores`
- `waseshibu-math-exam-drafts-v2`
- `waseshibu-math-learning-route-v1`
- `waseshibu-math-sync-meta`
- `waseshibu-math-data-version`

This list is intentionally narrower than the final learner-state migration. The following are **not yet declared migrated by this rehearsal**:

- attempts;
- daily state / daily plans / study-ahead state;
- prep-check state;
- guided review/progress;
- remediation progress;
- Level2 history/mastery;
- backup/export package semantics;
- progress-sync IndexedDB/cloud projection.

No production cutover may occur while those remaining state surfaces are outside the canonical migration gate.

## Rehearsal sequence

`src/schools/waseshibu/migrationRehearsal.ts` performs the following sequence in memory:

1. capture the exact raw legacy strings for the current audited source keys;
2. run the actual legacy-reader vs canonical-shadow dual-read audit;
3. reject the candidate if dual-read parity fails or shadow conversion reports an unmappable value;
4. validate that all canonical exam IDs belong to the WaseShibu exam catalog;
5. validate that all canonical target IDs belong to the WaseShibu school profile;
6. reject duplicate exam-result IDs until an explicit no-loss duplicate policy exists;
7. capture the source strings again and fail if the rehearsal changed any persisted value;
8. return the canonical candidate only as an in-memory value object.

A `ready: true` rehearsal means only that the **currently audited scope** is safe to advance to the next migration-engine step. It does not mean WaseShibu learner state is ready for production cutover.

## Rollback proof

`scripts/test-shared-engine-migration-rehearsal.mjs` takes the exact raw source snapshot returned by the rehearsal, mutates an isolated in-memory clone, then restores every audited source key from those captured raw strings.

The test requires byte/string parity for every audited source key after the simulated rollback. It also verifies that out-of-scope learner data such as `waseshibu-math-attempts` remains untouched.

This is rollback **evidence**, not the final production rollback mechanism. Any real write migration must still use the app's established backup/restore-point safety framework and must restore both source keys and any newly introduced canonical keys atomically on failure.

## Fail-closed cases

The current rehearsal blocks advancement when, for example:

- the legacy runtime and canonical shadow disagree;
- an exam/year cannot map to a known WaseShibu `examId`;
- a target cannot map to a known WaseShibu `targetId`;
- a reinforcement plan has inconsistent exam identity;
- duplicate result IDs are present without an explicit migration policy;
- the rehearsal itself changes persisted source data.

No guessed value, silent record drop or implicit deduplication is allowed merely to make the migration pass.

## Required build gate

The normal production build now runs all four shared-engine learner-state safety gates before the existing WaseShibu regression suite:

1. `test:shared-engine-compat`
2. `test:shared-engine-shadow`
3. `test:shared-engine-dual-read`
4. `test:shared-engine-migration-rehearsal`

A failure in any of these blocks the PR/deploy build.

## Next migration step

Before a production write path is designed, the canonical read model and the same shadow/dual-read/rehearsal pattern must be expanded to the remaining learner-state surfaces listed above. Only after the full backup-relevant state is covered should the branch add a candidate write migration with restore-point creation, atomic rollback and post-write parity verification.
