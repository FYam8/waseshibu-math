# Level2 durable practice-history audit

## Scope

This phase audits `waseshibu-math-level2-history-v1` without changing the active Level2 reader, writer, question selection, grading, mastery logic, UI or storage key.

The shared contract deliberately calls the concept **practice history**, not “Level2”. It models opaque problem IDs, skill snapshots, answer attempts, per-problem statistics, resumable practice sessions and mastery events. WaseShibu-specific pool names, labels, field taxonomy and selection policy remain school evidence rather than becoming universal engine rules.

## Two current readers must agree

The same persisted Level2 record is consumed through two reader surfaces today:

- `loadLevel2History()` loads the full durable history and performs forgiving session normalization;
- `loadLevel2SessionSummaries()` independently reads raw sessions for route/progress views.

`level2LegacyReader.ts` mirrors both read-only. `level2Shadow.ts` creates a strict canonical projection. `level2Audit.ts` requires the full-history projection and the independent session-summary projection to agree with the canonical shadow for migration-safe data.

This matters because malformed data can produce different current behavior. For example, an array-shaped `sessions` root is ignored by the history reader but traversed by the summary reader. The migration gate exposes that disagreement and fails closed instead of selecting one interpretation.

## Canonical boundary

Generic practice history currently retains:

- answer attempt identity, problem/presentation/session identity and answer time;
- first-submission/correctness/assistance evidence;
- content/grading and skill-assignment revision snapshots;
- per-problem aggregate statistics;
- practice-session source/direct problem IDs, skill snapshot, streak/progress queues, fixed/completed/retry sets and pending assistance;
- mastery-event skill/problem evidence.

WaseShibu-only details such as `questionBank`, the Japanese mastery label, old/future additive record fields and the normalized legacy session record remain inside `schoolEvidence.legacyRecord`. `requiredPracticeCount()` is used only by the WaseShibu compatibility normalizer to reproduce existing fallback behavior; it is not shared-engine policy.

## Loss-prevention gates

The strict shadow reports migration blockers when current forgiving normalization could hide or reinterpret persisted information, including:

- invalid JSON or non-object root state;
- a future/non-1 persisted Level2 schema version that the active reader would report as version 1;
- unknown root fields that the active reader would discard;
- malformed answer attempts, stats or mastery events;
- duplicate attempt IDs or duplicate session IDs across map entries;
- `questionStats` stored as an array;
- non-object session entries silently skipped by the active reader;
- non-string or duplicate problem IDs silently filtered/deduplicated from session arrays;
- malformed pending assistance silently replaced with `null` or assistance flags coerced to false;
- a present `requiredCount` that would be clamped/replaced instead of mapping exactly;
- invalid counters, statuses, identities or timestamps.

Missing legacy session fields that the current runtime intentionally supports are still normalized deterministically. In particular, absent `requiredCount` uses the current WaseShibu source/field fallback and absent `completedQuestionIds` uses the normalized current-streak IDs.

## Build and aggregate migration gates

`test:shared-engine-level2` is build-required. It source-pins the critical normalization expressions in both current readers, verifies the generic projection and preserved school evidence, exercises old-compatible fallbacks, compares both reader surfaces, tests migration blockers and verifies zero storage writes.

Level2 is also included in migration-rehearsal contract version `7` as generic `practiceHistory`. The aggregate rehearsal captures the exact `waseshibu-math-level2-history-v1` source string, requires the Level2 parity audit to pass, validates duplicate/identity/evidence constraints, and restores the exact source string in the isolated rollback proof. School-local device identity remains outside the canonical learner-state snapshot and is explicitly checked as untouched.

A future/non-1 Level2 schema version blocks the aggregate rehearsal while its exact source bytes remain available for rollback/manual policy.

## Not changed

This audit does not authorize a write migration. The active `waseshibu-math-level2-history-v1` reader/writer and all learner-visible behavior remain unchanged. Backup/export/import semantics and IndexedDB/cloud projection remain the next safety gates before any production canonical learner-state cutover.
