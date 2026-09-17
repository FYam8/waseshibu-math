# Guided State Audit

Status: read-only guided shadow/parity gate implemented and integrated into aggregate migration rehearsal; production guided writes remain legacy

## Persisted surfaces

WaseShibu currently keeps two guided-learning records:

- `waseshibu-math-guided-review-v1`
- `waseshibu-math-guided-progress-v2`

They are not interchangeable copies.

`guided-progress-v2` is the current active mastery/progress state. It stores step-level answers, hint usage, reproduction/independent success, practice streak and mastery.

`guided-review-v1` is still read and written by the Guided Review UI as compatibility evidence and as a final-answer fallback. It therefore cannot be deleted as "old data", but it must also not be treated as a second authoritative mastery timeline.

The existing data migration only creates `guided-progress-v2` from v1 when upgrading old data and when v2 is absent. After that point current flows can legitimately update v2 without making every v1 field semantically identical.

## Canonical boundary

The shared contract defines:

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

## Aggregate migration integration

Guided state is now part of `CanonicalLearnerStateMigrationCandidate` and the aggregate migration rehearsal.

The integration deliberately preserves the authority split:

1. `guidedLearning.progressByProblemId` contains only v2 active mastery/progress;
2. v1 review records remain only under `guidedLearning.schoolEvidence.legacyReviewByProblemId`;
3. both exact raw strings are included in `WASESHIBU_REHEARSAL_SOURCE_KEYS`;
4. rollback restores both strings byte-for-byte;
5. current-version cutover never infers or regenerates either v1 or v2 from the other.

The rehearsal contract marker is version `5` after this integration.

`scripts/test-shared-engine-migration-rehearsal.mjs` includes a deliberately divergent but valid v1/v2 pair. It verifies that v2 mastery remains authoritative while the differing v1 final answer/outcome survives as compatibility evidence. It then corrupts/removes both guided source keys in an isolated clone and restores the exact original strings from the raw rollback snapshot.

A malformed v2 record whose map key and stored `questionId` disagree blocks the aggregate rehearsal while retaining the exact raw source for rollback/manual policy.

## What is unchanged

This checkpoint does not modify:

- `src/guidedReview.ts` runtime readers or writers;
- Guided Review UI behavior;
- mastery transitions;
- hint/reproduction/consolidation logic;
- current localStorage keys or JSON write shapes;
- data-version migration behavior.

All guided audits and the aggregate rehearsal perform zero production storage writes.

## Next safe step

Proceed to remediation state using the same sequence: inventory the current persisted shape and reader normalization first, then add a strict raw shadow, active/read-only parity gate, fail-closed rules and only after those pass fold remediation into the aggregate rehearsal. Level2, backup/export/import and sync remain later gates.
