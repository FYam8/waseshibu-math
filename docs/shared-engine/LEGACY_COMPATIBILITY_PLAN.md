# Legacy Compatibility Bridge

Status: Phase-1 migration plan / no production runtime change

## Purpose

The canonical engine will use `examId`, school-defined `targetId`, generic attempt purposes, and optional score evidence. Current WaseShibu production cannot switch those identities abruptly because existing URLs and learner state are year/score based.

This bridge defines how WaseShibu remains behaviour-compatible while the internal engine becomes capable of representing Rikkyo A/B forms losslessly.

## Current WaseShibu compatibility surfaces

The current app has several year-based public/runtime identities that must be treated as compatibility inputs rather than copied into the universal contract:

- Past Papers navigation selects the paper with `?year=YYYY`.
- exam drafts in `waseshibu-math-exam-drafts-v2` are stored under year keys.
- exam-score records identify an exam primarily by `year`.
- required-route sequencing, completion locks and reinforcement selection are largely year-keyed.
- exposure/attempt helper IDs contain the year.
- current target preference is persisted as numeric `60 | 70 | 75`.

These existing values are valid WaseShibu data and must continue to work after extraction.

## Canonical internal identity

Generic engine code will use:

- opaque `examId` for concrete exams;
- opaque school-defined `targetId` for learner targets;
- opaque `problemId` for leaf problems;
- explicit exam/problem fields instead of parsing ID strings;
- exam-result evidence with optional numeric score and explicit score authority.

For WaseShibu, current one-paper-per-year data maps deterministically to exam IDs such as:

```text
2024 -> waseshibu-2024
2025 -> waseshibu-2025
2026 -> waseshibu-2026
```

Rikkyo can then use distinct IDs such as `R25-MATH-A` and `R25-MATH-B` without any year collision.

## URL compatibility

WaseShibu's existing learner-visible URLs should not be broken merely to generalize the engine.

During Phase 1:

1. the WaseShibu composition layer continues accepting existing `?year=YYYY` navigation;
2. it resolves that year to the deterministic WaseShibu `examId`;
3. shared engine components operate on `examId` internally;
4. existing WaseShibu links/bookmarks remain valid;
5. a future canonical `examId` URL form may be added only as an alias unless there is a separately tested product reason to change the visible URL.

Rikkyo is not required to imitate the legacy WaseShibu year-only URL and may navigate directly by `examId`.

## Draft and route-state compatibility

Existing WaseShibu learner records must not be rewritten blindly.

A compatibility reader/migration layer will map old year-keyed state to canonical exam-keyed state, for example:

```text
legacy draft["2025"]
  -> canonical draft["waseshibu-2025"]

legacy completedCoreByTarget["70"] = [2024, 2023]
  -> canonical completion[targetId="70"] = ["waseshibu-2024", "waseshibu-2023"]
```

The migration must preserve a rollback/restore point and must be covered by preservation tests before runtime cutover.

Rikkyo starts the shared-engine cutover with exam-keyed canonical state so A/B forms never share one year bucket.

## Target compatibility

WaseShibu numeric targets remain valid compatibility input:

```text
60 -> targetId "60" with scoreThreshold 60
70 -> targetId "70" with scoreThreshold 70
75 -> targetId "75" with scoreThreshold 75
```

The shared engine does not infer the threshold by parsing the target ID. The WaseShibu school profile supplies `scoreThreshold` explicitly.

Rikkyo may define `minimum`, `stable`, and `safe` targets with no score threshold at all. Its school policy evaluates target progress from the evidence the Rikkyo data actually supports.

## Score compatibility

WaseShibu continues to use its current score-oriented model and 0–100 results where supported by its school data.

The canonical exam-result contract makes score optional so Rikkyo is not forced to fabricate official small-question points. Missing score is `unavailable`, not zero.

Generic progression logic must therefore ask the school policy for target/progress evaluation instead of universally calculating `targetScore - score`.

## Acceptance gate before WaseShibu runtime wiring

The Phase-1 runtime bridge is not mergeable until tests prove all of the following:

1. existing `?year=YYYY` WaseShibu navigation still opens the same paper;
2. existing year-keyed drafts resume the same answers and timer state;
3. existing exam-score history is preserved and maps to the correct canonical `examId`;
4. existing route completion/locks map to the correct exam IDs and targets;
5. numeric 60/70/75 target preferences retain the same learner-visible behaviour;
6. current WaseShibu score calculations and target strategy are unchanged;
7. no existing localStorage key is silently renamed before a tested migration;
8. Rikkyo A/B forms remain independent in exam result, draft, route, lock and reinforcement state;
9. Rikkyo does not write any WaseShibu persistence/IndexedDB/channel/cloud identity.

## Principle

The migration direction is:

```text
WaseShibu legacy representation
        ↓ compatibility adapter / tested migration
canonical engine identity
        ↑
Rikkyo canonical school data
```

The legacy bridge belongs to the WaseShibu school layer. It must not become a permanent requirement that every downstream school pretend one year equals one exam.
