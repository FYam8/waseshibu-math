# Canonical Learner-State Migration Rehearsal

Status: Phase-1 read-only rehearsal includes audited activities, daily/planner state, preparation-check state, guided state and remediation state; production learner-state writes remain legacy

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
- remediation progress, projected by opaque source problem while WaseShibu field/rank/cursor details remain school evidence.

The attempts container is not treated as one universal attempt schema. Its audited canonical projection distinguishes `problem-attempt`, `exam-exposure` and `mastery-marker` records so marker/exposure evidence cannot be counted as an answer attempt.

Daily practice and the scheduler plans remain separate canonical concepts. The scheduler keeps task IDs opaque and preserves WaseShibu-only route/presentation/queue-version details only as school evidence.

Preparation state also remains content-neutral. The canonical state stores an opaque item cursor, answer/try maps and completion flags; the WaseShibu five fixed prep prompts and their answer rules remain school-owned content.

Guided state deliberately has one generic active mastery map. `waseshibu-math-guided-progress-v2` supplies that map. `waseshibu-math-guided-review-v1` remains preserved under guided `schoolEvidence` because the current UI still reads/writes it and may use its final answer as fallback, but it is not promoted into a second mastery timeline.

Remediation is a separate state family, not guided mastery and not a generic answer-attempt stream. Its canonical projection keeps source problem identity, source-attempt time, status, streak, attempt count and the concrete correct problem IDs in the current streak. WaseShibu `field`, A/B/C `rank`, `currentIndex` and any additional normalized legacy fields stay in `schoolEvidence.legacyRecord`.

The exact legacy source strings captured as rollback evidence are:

- `waseshibu-math-attempts`
- `waseshibu-math-daily`
- `waseshibu-math-daily-required-plan-v2`
- `waseshibu-math-study-ahead-plan-v1`
- `waseshibu-math-prep-check-v1`
- `waseshibu-math-guided-review-v1`
- `waseshibu-math-guided-progress-v2`
- `waseshibu-math-remediation-progress-v1`
- `waseshibu-math-preferences`
- `waseshibu-math-exam-scores`
- `waseshibu-math-exam-drafts-v2`
- `waseshibu-math-learning-route-v1`
- `waseshibu-math-sync-meta`
- `waseshibu-math-data-version`

This list is still intentionally narrower than the final learner-state migration. The following are **not yet declared migrated by this rehearsal**:

- Level2 history/mastery state;
- backup/export/import package semantics;
- progress-sync IndexedDB/cloud projection.

No production cutover may occur while those remaining state surfaces are outside the canonical migration gate.

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
9. reject the candidate if any audit reports a mismatch, filtered record, collision, corruption or unmappable value;
10. combine the audited projections into one in-memory candidate, adding one generic guided mastery timeline and generic remediation state;
11. validate canonical exam IDs, target IDs, planner identities, preparation state, guided problem/step identities and remediation source identity/counters;
12. reject duplicate exam-result IDs and duplicate activity IDs until explicit no-loss identity policies exist;
13. capture the source strings again and fail if the rehearsal changed any persisted value;
14. return the canonical candidate only as an in-memory value object.

The rehearsal contract marker is version `6` because remediation state joined the aggregate candidate and rollback source set. This marker is independent from WaseShibu app/data versions and from the future shared content contract version.

A `ready: true` rehearsal means only that the **currently audited scope** is safe to advance to the next migration-engine step. It does not mean WaseShibu learner state is ready for production cutover.

## Activity safety rules

The activity layer preserves current WaseShibu normalization such as legacy device/reset fallbacks while avoiding false universal semantics. `q1|multi` stays WaseShibu legacy evidence; synthetic `year-*` work is not treated as a real exam merely because its ID contains a year; and records silently filtered by today's reader are treated as migration data-loss risks.

## Daily/planner safety rules

The aggregate candidate keeps `dailyPractice`, `todayRequiredPlan` and `studyAheadPlan` separate. The planner audit does **not** invoke high-level reconciliation. The existing 10-task cap, no-11th-refill behavior, target-switch replacement and next-day promotion remain WaseShibu runtime policy and are not executed or rewritten by the migration rehearsal.

Corrupt JSON, unsupported fields, invalid targets or malformed daily/planner shapes fail closed even where the current forgiving runtime would regenerate or ignore them. That stricter rule protects migration from silently losing persisted information without changing current learner-visible behavior.

## Preparation-check safety rules

The prep compatibility layer reproduces deterministic current normalization such as numeric answers -> strings, finite try-count floor/clamp, index clamping and epoch timestamp fallback. Migration is deliberately stricter where the current runtime can hide information loss.

The aggregate gate stops for unknown prep fields, future/non-v1 prep versions, entries that today's normalizer would silently filter, malformed present flags/timestamps or a fractional item cursor. Absence remains absence rather than inventing a persisted canonical record. See `PREP_STATE_AUDIT.md` for the detailed boundary.

## Guided-state safety rules

The two guided stores are rollback peers but not semantic peers:

- v2 is the active progress/mastery authority;
- v1 remains compatibility/fallback evidence;
- both exact raw strings must survive rollback;
- v1 and v2 are allowed to diverge legitimately;
- current-version migration never reconstructs one store from the other.

The aggregate candidate therefore has one `guidedLearning.progressByProblemId` map and preserves the v1 records under `guidedLearning.schoolEvidence.legacyReviewByProblemId`. WaseShibu-only dependency mode and historical `migratedFrom` metadata remain school evidence.

The aggregate gate fails closed on corrupt guided JSON, unsupported fields, key/`questionId` mismatches, malformed step records, invalid mastery/self-assessment values, invalid counters/timestamps or any guided reader/shadow parity drift. See `GUIDED_STATE_AUDIT.md` for the detailed boundary.

## Remediation safety rules

The remediation legacy reader is unusually forgiving: it coerces identifiers and counters, defaults A/B/C rank, clamps streaks, truncates the current-streak ID list to the last four entries and silently skips non-object records. Distinct persisted keys can also normalize to the same `sourceQuestionId`, with the later entry winning in runtime memory.

The canonical audit preserves those effective normalization semantics for parity but treats silent drops and identity collisions as migration blockers. Non-finite normalized cursors/counters and invalid timestamp evidence also fail closed rather than being guessed. The entire normalized legacy record remains in school evidence so WaseShibu-only policy fields are not lost or accidentally universalized. See `REMEDIATION_STATE_AUDIT.md`.

## Rollback proof

`scripts/test-shared-engine-migration-rehearsal.mjs` takes the exact raw source snapshot returned by the rehearsal, mutates an isolated in-memory clone, then restores every audited source key from those captured raw strings.

The test requires byte/string parity for every audited source key after the simulated rollback, including attempts, daily practice, both scheduler plans, prep check, both guided stores and remediation. It also verifies that still-out-of-scope learner data such as `waseshibu-math-level2-history-v1` remains untouched.

This is rollback **evidence**, not the final production rollback mechanism. Any real write migration must still use the app's established backup/restore-point safety framework and must restore both source keys and any newly introduced canonical keys atomically on failure.

## Fail-closed cases

The current rehearsal blocks advancement when, for example:

- any active/read-only legacy reader and its canonical shadow disagree;
- an exam/year cannot map to a known WaseShibu `examId` where concrete exam identity is required;
- a target cannot map to a known WaseShibu `targetId`;
- a reinforcement plan has inconsistent exam identity;
- duplicate result/activity IDs are present without an explicit migration policy;
- an attempt or prep entry would be silently filtered by the current reader/normalizer;
- daily/planner/prep state is malformed or contains unsupported persisted fields;
- a future prep version would otherwise be silently downgraded to v1;
- guided v1/v2 state is malformed, unsupported or internally misidentified;
- remediation raw entries would be silently dropped, collide on normalized source identity, contain non-finite normalized positions/counters, or carry invalid timestamp evidence;
- the rehearsal itself changes persisted source data.

No guessed value, silent record drop, inferred v1/v2 rewrite or implicit deduplication is allowed merely to make the migration pass.

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
10. `test:shared-engine-dual-read`
11. `test:shared-engine-migration-rehearsal`

A failure in any of these blocks the PR/deploy build.

## Next migration step

Before a production write path is designed, the same shadow/parity/rehearsal pattern must be expanded to Level2 state, followed by backup/export/import semantics and IndexedDB/cloud projection. Only after the full backup-relevant state is covered should the branch add a candidate write migration with restore-point creation, atomic rollback and post-write parity verification.
