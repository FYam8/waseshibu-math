# Portable backup / import transport audit

## Scope

This phase audits the existing WaseShibu JSON backup/export/import boundary without changing `collectBackup()`, `restoreBackup()`, the backup schema version, learner-visible UI or any persisted key.

Device-local rollback is specified separately in `LOCAL_RESTORE_POINT_AUDIT.md`. Internal restore points retain an exact local snapshot, including device identity and sync reset/tombstone metadata, while their downloadable payload remains this portable package.

The goal is to distinguish **portable learner data** from **school-local runtime identity/sync state**, then expose current merge cases that are not demonstrably lossless enough for a future canonical cutover.

## Runtime identity boundary

`waseshibu-math-device-id` and `waseshibu-math-sync-meta` remain deliberately outside the portable backup package.

- the current device ID is a local runtime identity and must not be copied to another installation;
- sync meta contains local reset/tombstone epochs and `lastSyncAt`, so copying it blindly could import one device's reconciliation state into another;
- per-record `deviceId` is different: it is record provenance and may remain on an exported attempt/result;
- per-record `resetVersion` is required for a record to be self-contained when raw sync meta does not travel.

This distinction is important because the active runtime still supports old attempts/results that omit `deviceId` and `resetVersion`. `loadAttempts()` / `loadExamScores()` materialize those values from `legacy-device` plus the **current local** sync meta. `collectBackup()` reads raw storage instead of those normalized loaders, so a legacy record can currently be exported without the metadata needed to reproduce the same runtime interpretation on another installation.

`backupAudit.ts` therefore reports such a package as not yet self-contained for canonical transport. It does not rewrite the current export.

## Replace restore

For a clean package whose attempt/result records already carry explicit provenance and reset epochs, the build test performs a full replace restore into an isolated storage with a different current device ID and different sync meta.

The test requires:

- source device/sync keys are absent from the package;
- destination device ID remains unchanged;
- destination sync meta remains unchanged;
- learner attempt/result records round-trip exactly;
- the restored package remains self-contained on re-export.

This proves the current replace transport can preserve the audited logical records without copying local runtime identity, for the self-contained subset.

## Merge conflict audit

Current merge mode is intentionally permissive and learner-friendly, but several rules are incoming-wins or reconstruct state. A future canonical migration cannot silently treat all such cases as lossless.

The read-only audit currently flags:

- differing attempts/results with the same record ID;
- differing child entries overwritten by the shallow merge used for drafts, planner state, guided state and remediation state;
- preferences/daily/prep values where merge mode is effectively replacement;
- conflicting reinforcement-map entries or other route fields that are overwritten rather than unioned;
- Level2 attempts with the same `attemptId` but different payloads;
- Level2 sessions with the same map key but different records;
- Level2 mastery events that share the current reduced dedup identity but differ in preserved evidence;
- any non-empty Level2 `questionStats` participating in a two-sided merge, because the current merge regenerates stats from attempts and can discard aggregate-only/additive evidence;
- extra Level2 root fields that the current merge result would discard.

These are **cutover blockers for an eventual canonical import/merge policy**, not runtime errors. The existing WaseShibu merge behavior is unchanged.

## Build gate

`test:shared-engine-backup` is build-required. It compiles the current backup implementation plus the read-only audit and verifies:

- portable runtime-identity isolation;
- current legacy attempt/result fallback assumptions are source-pinned;
- self-contained replace round-trip behavior;
- legacy missing-metadata packages are detected;
- duplicate portable record IDs are detected;
- same-ID and shallow-map merge conflicts are detected;
- Level2 merge/reconstruction loss risks are detected.

## Still unresolved before production cutover

The audit deliberately does not choose a policy for legacy portable records or destructive merge conflicts. Before canonical learner-state writes are enabled, the branch still needs an explicit import policy for legacy records that depend on local reset epochs, plus a no-loss conflict policy for merge mode.

The next major safety surface is IndexedDB/cloud projection. WaseShibu's sync database, app ID, endpoint, reset-version reconciliation and route/year projections are school-specific and must remain isolated when the reusable engine is extracted.
