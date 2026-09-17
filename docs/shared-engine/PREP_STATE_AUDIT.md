# Preparation Check State Audit

Status: read-only prep shadow/parity implemented and integrated into aggregate migration rehearsal; production writes remain legacy

## Scope

This checkpoint covers the WaseShibu preparation-check record:

- `waseshibu-math-prep-check-v1`

The current WaseShibu screen contains five fixed school-owned preparation items. The shared engine does **not** adopt those five prompts, their answer rules or their presentation as universal engine content.

## Canonical boundary

The shared learner-state contract defines `CanonicalPreparationCheckState` with only persistence-level concepts:

- current item index;
- opaque item ID -> answer text;
- opaque item ID -> try count;
- completed/skipped flags;
- updated timestamp;
- optional school evidence.

WaseShibu item IDs such as `prep-1` remain opaque. A downstream school is not required to use five items or WaseShibu's preparation questions merely because the state shape is shared.

## Current runtime semantics preserved

`preflight.ts::loadPrepState()` currently reads the persisted record through `normalizePrepRecord()` and then clamps the index into the current five-item range. The compatibility layer independently reproduces the deterministic parts of that behavior:

- numeric/string answer values become strings;
- numeric/string try counts become finite non-negative integers using the current floor/clamp behavior;
- index values use current numeric conversion and the five-item clamp;
- missing completion flags become `false`;
- missing `updatedAt` becomes the epoch timestamp;
- persisted `null` maps to the current runtime default state.

An absent storage key remains `null` in the canonical persisted shadow. The active runtime may create an ephemeral default in memory, but migration does not invent a persisted record that was not present.

## Fail-closed migration rules

The current runtime normalizer is intentionally forgiving and can silently rewrite/filter legacy input. That is acceptable for runtime compatibility but is not sufficient proof for a no-loss migration.

The migration audit therefore blocks on:

- invalid JSON;
- unknown top-level fields (the current normalizer's object spread would otherwise carry them forward while a narrower canonical object could drop them);
- a persisted future/non-v1 prep version, because the current loader forcibly rewrites the in-memory version to 1;
- answer entries that are neither strings nor numbers and would be silently filtered;
- try entries that do not convert to finite numbers and would be silently filtered;
- malformed present boolean/timestamp fields;
- a fractional item index, which current normalization can preserve even though it is not a safe array cursor.

No guessed repair is used to make these cases migrate.

## Read-only parity gate

The WaseShibu adapter is split into:

- `prepCompatibility.ts` — pure legacy normalization/projection;
- `prepShadow.ts` — strict independent raw-storage reader;
- `prepAudit.ts` — compares the active `loadPrepState()` projection with the raw canonical shadow and verifies the raw prep string is unchanged.

`test:shared-engine-prep` covers valid normalization, clamping, absent/persisted-null behavior, corrupt/future/unknown/filtered/fractional state and zero writes.

## Aggregate rehearsal

After the independent prep gate passed, `waseshibu-math-prep-check-v1` was added to `WASESHIBU_REHEARSAL_SOURCE_KEYS` and `preparationCheck` was added to the in-memory canonical migration candidate.

The rehearsal contract marker is now v4. The aggregate rollback test corrupts the prep record in an isolated clone and restores the **exact original raw string** alongside the other audited source keys.

This still does not authorize production learner-state writes. Guided review/progress, remediation, Level2, backup/import semantics and IndexedDB/cloud projection remain outside the complete cutover gate.
