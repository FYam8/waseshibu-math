# Guided State Audit

Status: read-only guided state shadow/parity gate implemented; aggregate migration integration intentionally deferred

## Persisted surfaces

WaseShibu currently keeps two guided-learning records:

- `waseshibu-math-guided-review-v1`
- `waseshibu-math-guided-progress-v2`

They are not interchangeable copies.

`guided-progress-v2` is the current active mastery/progress state. It stores step-level answers, hint usage, reproduction/independent success, practice streak and mastery.

`guided-review-v1` is still read and written by the Guided Review UI as compatibility evidence and as a final-answer fallback. It therefore cannot be deleted as "old data", but it must also not be treated as a second authoritative mastery timeline.

The existing data migration only creates `guided-progress-v2` from v1 when upgrading old data and when v2 is absent. After that point current flows can legitimately update v2 without making every v1 field semantically identical.

## Canonical boundary

The shared contract now defines:

- `CanonicalGuidedLearningState`
- `CanonicalGuidedProblemProgress`
- `CanonicalGuidedStepProgress`
- the current guided mastery states.

Only active guided progress is promoted to the generic `progressByProblemId` map.

WaseShibu's v1 compatibility records remain under `schoolEvidence.legacyReviewByProblemId`. This preserves their fallback value without allowing generic mastery analytics to double-count them as a second progress source.

Problem IDs and step IDs remain opaque. WaseShibu-only `dependencyMode` and historical `migratedFrom` evidence remain school evidence rather than universal fields.

## Read-only parity

`guidedLegacyReader.ts` mirrors the current forgiving read semantics of `loadGuidedReviews()` and `loadGuidedProgressState()` without importing the content-heavy guided runtime or executing any write path.

`test:shared-engine-guided` source-pins those mirrors to the current reader expressions in `src/guidedReview.ts`, so reader drift blocks the build until the compatibility layer is reviewed deliberately.

`guidedShadow.ts` independently reads the exact persisted strings and maps them strictly into the canonical boundary.

`guidedAudit.ts` compares:

- legacy v1 reader projection vs canonical v1 compatibility evidence;
- legacy v2 reader projection vs canonical active guided progress;
- persisted bytes before vs after the audit.

The audit never requires v1 outcome/final-answer values to equal v2 mastery/final-answer values. Legitimate divergence is tested explicitly.

## Fail-closed rules

The current runtime readers accept any parseable object and perform almost no shape validation. Migration safety is deliberately stricter.

The guided audit fails closed on, among other cases:

- corrupt JSON;
- unsupported record fields;
- record-key / `questionId` mismatches;
- malformed step-progress entries;
- unsupported mastery/self-assessment values;
- fractional or negative counters that cannot be trusted as attempt counts;
- invalid timestamps.

The historical `migratedFrom` field created by the existing data migration is explicitly recognized and preserved rather than being mistaken for unknown data.

No malformed or unreachable record is silently removed merely to make canonical conversion succeed.

## What is unchanged

This checkpoint does not modify:

- `src/guidedReview.ts` runtime readers or writers;
- Guided Review UI behavior;
- mastery transitions;
- hint/reproduction/consolidation logic;
- current localStorage keys or JSON write shapes;
- data-version migration behavior.

The audit performs zero storage writes.

## Aggregate migration status

Guided state is **not yet** part of `CanonicalLearnerStateMigrationCandidate` or the aggregate migration rehearsal.

That is intentional. Before adding it, the branch must keep the following distinction explicit:

1. v2 is the active mastery timeline;
2. v1 remains preserved compatibility/fallback evidence;
3. rollback must restore both raw strings exactly;
4. neither record may be inferred from the other during a current-version cutover.

Once this independent gate is green, the next step is to add both source keys to the aggregate raw snapshot and add one canonical guided-learning state to the rehearsal candidate without duplicating mastery semantics.
