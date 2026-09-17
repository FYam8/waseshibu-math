# Canonical Learner-State Migration Rehearsal

Status: Phase-1 read-only rehearsal includes audited activities, daily/planner state, preparation check, guided state, remediation state and durable practice history; production learner-state writes remain legacy.

## Purpose

Before any WaseShibu learner record is rewritten into the canonical shared-engine format, the branch must prove that the proposed conversion is equivalent to the current runtime, preserves rollback evidence and fails closed when a safe one-to-one conversion cannot be established.

The rehearsal is deliberately **read-only**. It is not the production migration and it does not create, rename, delete or overwrite any learner storage key.

## Current audited scope

The aggregate rehearsal currently covers:

- preferences / target identity;
- exam results;
- exam drafts;
- learning route, completion locks and reinforcement plans;
- legacy attempts projected into discriminated canonical activity records;
- the resumable 8-question daily-practice session;
- the persisted Today required-task plan;
- the persisted next-day study-ahead plan;
- preparation/onboarding check progress;
- guided-learning state, with v2 as the one active mastery timeline and v1 retained only as compatibility/final-answer-fallback evidence;
- remediation progress, projected by opaque source problem while WaseShibu field/rank/cursor details remain school evidence;
- Level2 durable history projected as generic practice history, including attempts, per-problem stats, resumable practice sessions and mastery events.

The attempts container is not treated as one universal attempt schema. Its audited canonical projection distinguishes `problem-attempt`, `exam-exposure` and `mastery-marker` records so marker/exposure evidence cannot be counted as an answer attempt.

Daily practice and the scheduler plans remain separate canonical concepts. The scheduler keeps task IDs opaque and preserves WaseShibu-only route/presentation/queue-version details only as school evidence.

Preparation state also remains content-neutral. The canonical state stores an opaque item cursor, answer/try maps and completion flags; the WaseShibu five fixed prep prompts and their answer rules remain school-owned content.

Guided state deliberately has one generic active mastery map. `waseshibu-math-guided-progress-v2` supplies that map. `waseshibu-math-guided-review-v1` remains preserved under guided `schoolEvidence` because the current UI still reads/writes it and may use its final answer as fallback, but it is not promoted into a second mastery timeline.

Remediation is a separate state family, not guided mastery and not a generic answer-attempt stream. Its canonical projection keeps source problem identity, source-attempt time, status, streak, attempt count and the concrete correct problem IDs in the current streak. WaseShibu `field`, A/B/C `rank`, `currentIndex` and any additional normalized legacy fields stay in `schoolEvidence.legacyRecord`.

Level2 is represented generically as `practiceHistory`, not as an engine-wide “Level2” concept. WaseShibu pool names, mastery labels, field taxonomy and fallback selection/count policy remain school evidence or WaseShibu compatibility logic. The independent full-history and session-summary readers must both agree with the canonical projection.

The exact legacy source strings captured as rollback evidence are:

- `waseshibu-math-attempts`
- `waseshibu-math-daily`
- `waseshibu-math-daily-required-plan-v2`
- `waseshibu-math-study-ahead-plan-v1`
- `waseshibu-math-prep-check-v1`
- `waseshibu-math-guided-review-v1`
- `waseshibu-math-guided-progress-v2`
- `waseshibu-math-remediation-progress-v1`
- `waseshibu-math-level2-history-v1`
- `waseshibu-math-preferences`
- `waseshibu-math-exam-scores`
- `waseshibu-math-exam-drafts-v2`
- `waseshibu-math-learning-route-v1`
- `waseshibu-math-sync-meta`
- `waseshibu-math-data-version`

School-local runtime identity such as `waseshibu-math-device-id` is intentionally **not** part of the canonical learner-state source snapshot. The rollback test explicitly verifies that it remains untouched.

The remaining major pre-cutover surfaces are:

- an explicit no-loss policy for legacy portable records and destructive import/merge conflicts;
- routing the current progress-sync runtime identity through the audited school profile without changing its IndexedDB/cloud projection behavior.

The device-local rollback boundary is now implemented separately from portable transport. New internal restore points preserve exact raw learner keys plus device identity and sync reset/tombstone metadata; their downloadable payload remains portable and excludes those runtime keys. See `LOCAL_RESTORE_POINT_AUDIT.md`.

No production cutover may occur while those surfaces are outside the canonical migration gate.

## Rehearsal sequence

`src/schools/waseshibu/migrationRehearsal.ts` performs the following sequence in memory:

1. capture the exact raw legacy strings for the current audited source keys;
2. run the actual legacy-reader vs canonical-shadow dual-read audit for preferences/results/drafts/route;
3. run the independent `loadAttempts()` vs raw-storage canonical activity audit;
4. run the independent `loadDaily()` vs canonical daily-practice audit;
5. run the persisted planner shadow vs read-only legacy planner-reader parity audit;
6. run the active `loadPrepState()` vs strict raw prep shadow parity audit;
7. run guided v1 compatibility parity and v2 active-progress parity as separate surfaces;
8. run remediation runtime-normalization parity while separately detecting raw entries that would be dropped or collapsed;
9. run Level2 full-history parity plus the independent session-summary-reader parity;
10. reject the candidate if any audit reports a mismatch, filtered record, collision, corruption or unmappable value;
11. combine the audited projections into one in-memory candidate;
12. validate canonical exam IDs, target IDs, planner identities, preparation state, guided identities, remediation identities and practice-history identities/evidence;
13. reject duplicate exam-result IDs, activity IDs, practice-attempt IDs or practice-session IDs until explicit no-loss identity policies exist;
14. capture the source strings again and fail if the rehearsal changed any persisted value;
15. return the canonical candidate only as an in-memory value object.

The rehearsal contract marker is version `7` because durable practice history joined the aggregate candidate and rollback source set. This marker is independent from WaseShibu app/data versions and from the future shared content contract version.

A `ready: true` rehearsal means only that the **currently audited scope** is safe to advance to the next migration-engine step. It does not mean WaseShibu learner state is ready for production cutover.

## Fail-closed rules

The aggregate rehearsal blocks advancement when, for example:

- any active/read-only legacy reader and its canonical shadow disagree;
- an exam/year cannot map to a known WaseShibu `examId` where concrete exam identity is required;
- a target cannot map to a known WaseShibu `targetId`;
- a reinforcement plan has inconsistent exam identity;
- duplicate result/activity/practice-attempt/practice-session IDs are present without an explicit migration policy;
- an attempt or prep entry would be silently filtered by the current reader/normalizer;
- daily/planner/prep state is malformed or contains unsupported persisted fields;
- guided v1/v2 state is malformed, unsupported or internally misidentified;
- remediation raw entries would be silently dropped or collide on normalized source identity;
- Level2 data contains a future schema version, malformed attempts/stats/mastery records, lossy session normalization, invalid identities/timestamps, or disagreement between its two current reader surfaces;
- the rehearsal itself changes persisted source data.

No guessed value, silent record drop, inferred guided rewrite, Level2 reader preference or implicit deduplication is allowed merely to make the migration pass.

## Rollback proof

`scripts/test-shared-engine-migration-rehearsal.mjs` takes the exact raw source snapshot returned by the rehearsal, mutates an isolated in-memory clone, then restores every audited source key from those captured raw strings.

The test requires byte/string parity for every audited source key after the simulated rollback, now including Level2 history. It separately verifies that school-local device identity is outside the source snapshot and remains untouched.

This rehearsal snapshot remains rollback **evidence**, not a production write migration. The established restore-point framework now has a separate exact local snapshot with verified rollback. Before any new canonical key is written, that key must first be added to the applicable school local-restore profile and covered by its exact-restore gate.

## Required build gates

The normal production build now runs these shared-engine learner-state safety gates before the existing WaseShibu regression suite:

1. `test:shared-engine-compat`
2. `test:shared-engine-shadow`
3. `test:shared-engine-activity`
4. `test:shared-engine-daily`
5. `test:shared-engine-planner-shadow`
6. `test:shared-engine-planner-parity`
7. `test:shared-engine-prep`
8. `test:shared-engine-guided`
9. `test:shared-engine-remediation`
10. `test:shared-engine-level2`
11. `test:shared-engine-backup`
12. `test:shared-engine-local-restore`
13. `test:shared-engine-sync-boundary`
14. `test:shared-engine-dual-read`
15. `test:shared-engine-migration-rehearsal`

A failure in any of these blocks the PR/deploy build.

## Next migration step

Before a production write path is designed, the unresolved portable legacy/merge policies must be made no-loss and the audited sync identity profile must be wired into the existing runtime under exact parity. Only then should the branch add a candidate write migration with restore-point creation, exact local rollback and post-write parity verification.
