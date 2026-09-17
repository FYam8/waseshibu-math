# Device-Local Restore Point Audit

Status: implemented behind the existing WaseShibu restore-point UI; portable backup/import behavior and schema remain unchanged.

## Boundary

A restore point now contains two deliberately different representations:

- `payload`: the existing portable `BackupPackage`, suitable for JSON download and import on another device;
- `localSnapshot`: an internal exact-string snapshot used only by the current installation.

The portable payload continues to exclude `waseshibu-math-device-id` and `waseshibu-math-sync-meta`. The local snapshot includes both. There is no download path for `localSnapshot`; the existing restore-point JSON button still serializes only `point.payload`.

## Exact local scope

The WaseShibu local profile captures every current portable learner-data key plus:

- the legacy draft source key, so a pre-migration value can be restored byte-for-byte;
- `waseshibu-math-device-id`, the installation identity;
- `waseshibu-math-sync-meta`, including attempt/result reset epochs and `lastSyncAt`.

Values are stored as exact raw strings or explicit `null` for absence. Capture does not parse, normalize, migrate or deduplicate data. This is intentional: a rollback point must reproduce the source installation state, including legacy or temporarily malformed values, rather than reinterpret it through the current portable schema.

The external progress-sync IndexedDB (`waseshibu-progress-sync`) is not copied. Its registration credentials, control rows, outbox, dead-letter rows and seen revisions belong to the live school-specific external adapter. The local learner reset/tombstone authority currently consumed by `storage.ts` is `waseshibu-math-sync-meta`, and that state is covered exactly. Changing the external IndexedDB identity remains a separate sync-profile step.

## Verified restore operation

Before applying a local snapshot, the contract:

1. validates the profile ID, schema version, exact key set and raw value types;
2. captures the complete current value of the same key set;
3. writes every target value, including removals for explicit `null`;
4. rereads every key and requires byte/string equality;
5. on any write or verification error, rewrites the pre-operation values and verifies that rollback before returning an error.

This provides an all-covered-keys-or-verified-rollback operation for synchronous Web Storage failures. A browser/process termination can still interrupt Web Storage between individual calls; the independently persisted restore point remains available for the next recovery attempt. No claim of a cross-storage transaction with IndexedDB or the cloud is made.

## Compatibility

Existing stored restore points that contain only the historical portable payload remain readable. They use their original payload checksum and restore through the existing portable replace path. Newly created points checksum the portable payload and local snapshot together and restore through the exact local path.

No learner-visible storage key, portable backup key, backup schema version, import rule, Cloud payload or endpoint changes in this step.

## Build gate

`test:shared-engine-local-restore` verifies:

- the WaseShibu local profile includes device identity and sync reset/tombstone metadata;
- exact raw strings and explicit absence round-trip;
- an injected mid-write failure rolls every covered key back and verifies it;
- new stored restore points recover device ID, sync meta and learner data together;
- the portable payload still excludes both runtime keys;
- restore-point JSON download still serializes only the portable payload.
