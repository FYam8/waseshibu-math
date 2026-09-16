# External progress-sync boundary audit

## Scope

This phase defines and tests the boundary between reusable engine concepts and WaseShibu's existing external progress-sync adapter. It does **not** change `progressSync.ts`, IndexedDB, registration credentials, cloud payloads, the deployed endpoint or learner-visible behaviour.

The reusable contract is intentionally identity-shaped only. Projection semantics stay school-owned.

## WaseShibu-owned identity

The current WaseShibu sync profile is pinned as:

- school ID: `waseshibu`
- local IndexedDB: `waseshibu-progress-sync`
- DB version: `7`
- external app ID: `math`
- build environment key: `VITE_PROGRESS_API_BASE`
- browser override: `__WASESHIBU_PROGRESS_API__`
- deployed API base: `https://waseshibu-progress-api.fyam8.workers.dev`
- transport kind: summary events

These values are **not** canonical cross-school defaults. A Rikkyo adapter must receive its own database name, app/tenant identity, browser override, endpoint and credentials even if later transport mechanics are shared.

## Projection remains school-owned

Today's `progressSync.ts` projects WaseShibu-specific concepts, including:

- target values 60/70/75;
- a fixed 2019–2026 year loop;
- `completedCoreByTarget` route state;
- `state:summary`, `state:latest-exam` and `state:year:*` records;
- the `math target ...` progress label.

Those assumptions must not be moved into `src/engine`. Rikkyo requires examId-aware A/B-form projection and a different school policy surface.

`src/engine/externalSyncContract.ts` therefore contains only generic external-sync identity/configuration fields and no WaseShibu year, target, endpoint or database constants.

## Data-minimization boundary

The current sync path reads local learner state to build progress summaries and owns a separate IndexedDB/control/outbox queue. The build audit verifies that the source does not introduce raw answer, final-answer, step-progress, question-text, prompt or explanation fields into the external payload path.

It also verifies that the sync module does not call learner-state writers such as `saveAttempt`, `replaceAttempts`, `saveExamScore`, `savePreferences` or `restoreBackup`. This keeps the current external adapter a progress projection rather than a cloud-to-local canonical-state authority.

## Build gate

`test:shared-engine-sync-boundary` is build-required. It source-pins the current WaseShibu sync identity and deployed endpoint, confirms the fixed year/target projection remains explicitly school-owned, protects the raw-answer/content exclusion, and checks that the generic engine contract contains no WaseShibu-specific constants.

The existing `test-progress-cloud-sync.mjs` remains in the workflow as an independent regression gate.

## Next step

The profile is currently an audited specification; `progressSync.ts` still holds its existing literals. A later behaviour-preserving extraction may route those identity constants through the WaseShibu composition root, but only after exact source/runtime parity is protected. Rikkyo must not reuse WaseShibu's sync identity during that extraction.

No production canonical learner-state write cutover is authorized by this audit. Portable-backup legacy/merge policy and eventual local restore-point atomicity remain separate blockers.
