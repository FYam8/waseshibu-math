# External progress-sync boundary audit

## Scope

This phase defines and tests the boundary between reusable engine concepts and WaseShibu's existing external progress-sync adapter. `progressSync.ts` now reads its concrete identity from the WaseShibu school profile; IndexedDB values, registration credentials, cloud payloads, the deployed endpoint and learner-visible behaviour are unchanged.

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

`test:shared-engine-sync-boundary` is build-required. It pins the current WaseShibu sync profile and deployed endpoint, requires the active adapter to obtain database/app/environment/override identity through that profile, confirms the fixed year/target projection remains explicitly school-owned, protects the raw-answer/content exclusion, and checks that the generic engine contract contains no WaseShibu-specific constants.

The existing `test-progress-cloud-sync.mjs` remains in the workflow as an independent regression gate.

## Runtime cutover completed

The active adapter now resolves its IndexedDB name/version, cloud app ID, environment-key binding and browser override key from `WASESHIBU_SYNC_PROFILE`. The Vite environment value remains a statically analyzable `import.meta.env.VITE_PROGRESS_API_BASE` access and is bound under the profile-declared key, preserving the existing production build behavior.

No projection policy moved into the generic engine, and no production canonical learner-state write cutover is authorized by this step. Rikkyo must provide a distinct profile and examId/A-B-aware projection. Portable-backup legacy/merge policy remains a separate blocker.
