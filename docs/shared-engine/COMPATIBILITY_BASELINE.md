# Shared Engine Compatibility Baseline

Status: audited foundation baseline before runtime extraction

This file records identities and data-shape boundaries that must be preserved or deliberately migrated before `waseshibu-math` runtime code is generalized.

## WaseShibu production baseline

Baseline source commit: `11bb2acad74888831fdd6a9fde7b7d6a912296bf` (`main` when the shared-engine foundation branch was created).

### App/runtime

- app version: `0.18.1`
- supported exam years: 2019–2026
- target scores currently used by the app: 60 / 70 / 75
- update BroadcastChannel: `waseshibu-math-updates`
- current custom-event prefix: `waseshibu-`
  - `waseshibu-route-change`
  - `waseshibu-write-blocked`
  - `waseshibu-preferences-change`

### localStorage and backup identity

The current learner-data family uses the `waseshibu-math-*` identity. Existing keys are compatibility data, not cosmetic names. Examples that are currently migration/backup relevant include:

- `waseshibu-math-attempts`
- `waseshibu-math-preferences`
- `waseshibu-math-daily`
- `waseshibu-math-exam-scores`
- `waseshibu-math-exam-drafts-v2`
- `waseshibu-math-learning-route-v1`
- `waseshibu-math-prep-check-v1`
- `waseshibu-math-daily-required-plan-v2`
- `waseshibu-math-study-ahead-plan-v1`
- `waseshibu-math-guided-review-v1`
- `waseshibu-math-guided-progress-v2`
- `waseshibu-math-remediation-progress-v1`
- `waseshibu-math-level2-history-v1`
- `waseshibu-math-data-version`

Other WaseShibu-only state also exists for version guards, migration journals, restore points and sync metadata. Extraction must inventory those exact names before changing persistence code.

Backup package identity is currently:

- `app: "waseshibu-math"`
- backup schema version: 5
- data version: 8

A shared-engine refactor must preserve these exact WaseShibu identities.

### Current learner-state shapes

The WaseShibu implementation already has typed/stateful structures for attempts, exam scores, daily state, learning route, guided progress, remediation progress, Level2 history, backup/export and versioned migrations. Those logical shapes are the starting point for the canonical learner-state contract.

The canonical contract may be cleaned up during behaviour-preserving extraction, but WaseShibu data must remain migration-compatible and lossless.

### Cloud-progress isolation identities

The current progress-sync implementation also has origin-scoped state outside localStorage:

- IndexedDB database: `waseshibu-progress-sync`
- IndexedDB version: 7
- cloud event `appId`: `math`
- build-time API env: `VITE_PROGRESS_API_BASE`
- window override: `__WASESHIBU_PROGRESS_API__`
- current production endpoint injected by deploy workflow: `https://waseshibu-progress-api.fyam8.workers.dev`

These values are WaseShibu compatibility identities. In particular, the IndexedDB database name must never be reused by Rikkyo.

## Same-origin risk for separate GitHub Pages repositories

Separate repositories and separate URL paths are not a sufficient learner-data boundary when apps are served from the same web origin. Browser localStorage, IndexedDB and BroadcastChannel are origin-scoped rather than path-scoped.

Therefore Rikkyo must use different values for at least:

- localStorage key family / backup identity
- IndexedDB database name
- BroadcastChannel name
- custom-event namespace where cross-app collision is possible
- cloud endpoint/credentials and cloud app/tenant identity

This isolation must be tested explicitly before Rikkyo is allowed to deploy the shared engine.

## Rikkyo current preservation baseline

The existing `FYam8/rikkyo-uk-math` release is not disposable scaffolding. Its analysed school content remains the Rikkyo Source of Truth:

- 212 past-paper problem IDs
- 212/212 authored source-grounded explanations
- 411 fixed practice items
  - L1: 100
  - L2: 168
  - Clean Transfer: 77
  - Retention: 66
- 623 total problem IDs
- 31 source-page images
- FY26A Q5(3): `REVIEW_REQUIRED`

Its current content files are rich Rikkyo-specific migration/source inputs, not the long-term runtime data format:

- `data/questions.json`
- `data/practice_bank.json`
- `data/exams.json`
- `data/registry.json`

Before shared-engine cutover, these values will be normalized into the WaseShibu-derived canonical engine contract. Existing mathematical content, explanations, answer specs, source references and lineage IDs must survive that normalization.

### Current Rikkyo learner-state source

Current Rikkyo local persistence is separately named:

- current key: `rikkyoMathFull:${NS}:v3`
- environments: `prod`, `qa`, `test`
- legacy keys: `rikkyoMathMvp:${NS}:v2`, `rikkyoMathMvp:${NS}:v1`
- current schema version: 3

This v3 family is now treated as a **migration source**. The target is the same logical learner-state format used by the shared WaseShibu engine, but under a Rikkyo-specific namespace and backup identity.

The migration must be Rikkyo-only and must never read or write `waseshibu-math-*` learner keys.

## Shared-format decision

The target architecture uses:

- one canonical engine data contract derived from WaseShibu;
- one canonical logical learner-state model and migration framework;
- separate school content values;
- separate school persistence/sync identities.

“Same format” does not mean sharing the same localStorage keys, backup app ID, IndexedDB database, BroadcastChannel or cloud tenant.

## Phase-1 acceptance invariants

Before any behaviour-preserving extraction is merged into WaseShibu `main`, the regression gate must prove all of the following:

1. WaseShibu routes and visible learning flow are unchanged.
2. Existing WaseShibu localStorage keys retain exact names and semantics.
3. Backup import/export identity and data-version migration remain compatible.
4. IndexedDB progress-sync DB name and cloud `appId` remain unchanged for WaseShibu.
5. BroadcastChannel/custom-event identities remain unchanged for WaseShibu.
6. Existing learner-history migration tests remain green, including the v3→v8 preservation case.
7. Cloud-sync tests remain green and no Rikkyo identity appears in the WaseShibu production build.
8. Shared engine contracts do not require parsing WaseShibu-only ID syntax when explicit structural fields can be used.

## Rikkyo normalization acceptance invariants

Before Rikkyo cutover:

1. 212 past-paper records and 411 practice records have complete one-to-one source lineage.
2. 212/212 explanations remain present.
3. 623 total source problem identities remain traceable.
4. Answer specifications and mathematical QA status survive normalization.
5. Source-page links remain resolvable.
6. FY26A Q5(3) remains `REVIEW_REQUIRED`.
7. Missing canonical fields are explicitly created/audited rather than filled with guessed placeholders.
8. The old `rikkyoMathFull:${NS}:v3` state has a tested migration into canonical learner-state shapes.
9. Rikkyo uses its own persistence/sync names for every origin-scoped store/channel.

Only after these invariants are automated should Rikkyo run the shared engine in production.