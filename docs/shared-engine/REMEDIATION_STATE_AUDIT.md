# Remediation state audit

## Scope

This phase audits `waseshibu-math-remediation-progress-v1` without changing the active WaseShibu reader, writer, storage key, UI, scoring, selection strategy or mastery rules.

The shared contract models only generic remediation semantics: an opaque source problem ID, optional source-activity time, status, streak, attempt count, the concrete problem IDs counted in the current streak, and update time. WaseShibu-only fields such as `field`, A/B/C `rank`, and `currentIndex` remain under `schoolEvidence.legacyRecord` together with any additional normalized legacy fields. They are not promoted to generic engine policy.

## Runtime parity

`remediationLegacyReader.ts` is a read-only mirror of the current `loadRemediationProgressState()` normalization. `remediationShadow.ts` independently reads the same persisted bytes, applies the canonical projection and reports migration blockers. `remediationAudit.ts` compares both projections and verifies that the source string is unchanged.

The build-required test source-pins the current runtime normalization for source-ID re-keying, rank fallback, streak clamping, cursor/attempt normalization, the last-four correct IDs rule, and completion semantics. It also verifies zero writes.

## Loss-prevention gates

The canonical shadow deliberately blocks migration when legacy data would otherwise be silently lost or guessed. In particular it reports invalid JSON/root shape, non-object entries silently skipped by the runtime, two raw entries that normalize to the same source problem, non-finite normalized counters/cursors, and invalid timestamp evidence.

The effective shadow still mirrors current last-entry-wins runtime behavior when a collision exists, so parity can be diagnosed without silently approving the collision. Exact normalized legacy records are retained as school evidence.

## Aggregate migration rehearsal

Remediation is now part of `migrationRehearsal.ts` contract version `6`. The aggregate `ready` gate includes remediation reader/shadow parity, validates source-problem identity and normalized counters, captures the exact remediation storage string as rollback evidence, and keeps `waseshibu-math-level2-history-v1` explicitly outside the rehearsal until its own parity contract exists.

The rollback test corrupts remediation only in an isolated in-memory clone and restores the exact captured string. A collision or a record that today's runtime would silently drop makes the aggregate rehearsal fail closed while leaving the original bytes untouched.

## Not changed

This audit does not authorize a storage migration or make the canonical remediation state authoritative at runtime. The active WaseShibu key and write path remain unchanged. Level2 state, backup/export/import conflict semantics, cloud/IndexedDB sync projection, and Rikkyo production remain separate follow-up gates.
