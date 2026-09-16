# Shared Math Engine Architecture

Status: foundation / no production runtime change

## Goal

`FYam8/waseshibu-math` is the canonical master for the reusable Math learning engine. School applications remain in separate repositories. Improvements to the canonical engine are propagated to downstream school apps only after that school's regression suite passes.

The first downstream consumer is `FYam8/rikkyo-uk-math`.

The architecture decision for data is now explicit: **Rikkyo will converge on the same canonical runtime data format as WaseShibu.** Existing Rikkyo analysed content remains authoritative, but its current serialization is migration input rather than a permanent second runtime schema. See `DATA_FORMAT_POLICY.md`.

## Non-negotiable safety rules

1. **WaseShibu users must not be affected by extraction work.** Refactoring is developed on a branch/PR and merged only after the existing WaseShibu verification/build suite is green.
2. **Existing WaseShibu persistence identities remain byte-for-byte compatible.** Current `waseshibu-math-*` localStorage keys, backup package identity, migration semantics, version guards, IndexedDB names, BroadcastChannel/event identities, and Cloudflare progress-sync identities remain WaseShibu-specific unless an explicit compatible migration has been proven.
3. **Rikkyo never reads or writes WaseShibu learner state.** Rikkyo uses the same logical learner-state format but a different localStorage/backup identity, IndexedDB database, update channel, cloud app/tenant identity, endpoint and credentials.
4. **School content values are not shared.** Past-paper content, authored explanations, figures, practice-bank items, answer authority, school-specific scoring assumptions and learning-plan values stay school-owned even though both apps use the same data contract.
5. **Engine propagation is gated, not blind.** A WaseShibu engine change can update Rikkyo automatically, but Rikkyo tests must pass before its deployable branch is advanced.
6. **Path separation is not a data-isolation mechanism.** Browser localStorage, IndexedDB and BroadcastChannel are origin-scoped. If separate project sites are served under the same web origin, all persistence/sync names still have to be unique per school.

The exact audited identities are recorded in `COMPATIBILITY_BASELINE.md`; path ownership is recorded in `PATH_OWNERSHIP.md`; shared-format policy is recorded in `DATA_FORMAT_POLICY.md`.

## Repository roles

### Canonical master: `FYam8/waseshibu-math`

Owns:
- React/Vite app shell and navigation framework
- learner workflow primitives (Today, route/progression, remediation, reinforcement, review)
- answer-input and deterministic grading interfaces
- canonical content/learner-state contracts
- history/attempt abstractions
- safe update / backup / migration framework
- reusable UI components
- engine-level tests and compatibility contracts

Also owns WaseShibu's **school package**, which contains WaseShibu-only configuration and content values.

### Downstream school app: `FYam8/rikkyo-uk-math`

Owns:
- Rikkyo identity/brand and school-specific learning route values
- FY24/FY25/FY26 A/B source exams and source-page assets
- Rikkyo question/explanation values normalized to the common contract
- Rikkyo fixed practice-bank values normalized to the common contract
- Rikkyo answer authority and `REVIEW_REQUIRED` flags
- Rikkyo school-specific tests, migration policy, persistence/sync identities and deploy config

The existing Rikkyo analysed mathematics is authoritative and must be preserved rather than regenerated merely to fit the engine. What changes is its runtime **shape**, not the already-audited mathematical content.

## Rikkyo preservation baseline

The current Rikkyo release contains:
- 212 past-paper problem IDs
- 212/212 authored source-grounded explanations
- 411 fixed practice items
  - L1: 100
  - L2: 168
  - Clean Transfer: 77
  - Retention: 66
- 623 total problem IDs
- 31 source-page images
- FY26A Q5(3) retained as `REVIEW_REQUIRED`

These are migration invariants. Schema normalization must not silently delete, replace or lose lineage for any of them.

The current Rikkyo browser-state schema (`rikkyoMathFull:${NS}:v3` with prod/qa/test namespaces and v1/v2 legacy keys) is also preserved as **migration input**. At Rikkyo cutover it will be explicitly migrated into the same logical learner-state model used by the shared WaseShibu engine, under Rikkyo-only identities.

## One canonical data contract

The shared engine must consume one canonical contract rather than one permanent WaseShibu format plus one permanent Rikkyo format.

Phase 1 first makes the WaseShibu engine-facing shapes explicit while preserving current WaseShibu behaviour. The common contract covers at least:

- app identity/display strings
- supported years / exam forms
- learning phase plan and phase-role vocabulary
- school target/priority semantics through injected school rules
- exam/problem catalog
- practice/remediation catalog
- answer authority / grading metadata
- hints / guided explanations
- figure/source-page resolver
- field/topic taxonomy
- attempt/exam-score/daily/route state
- guided/remediation/mastery history
- persistence namespace, backup identity and schema version
- update-event / BroadcastChannel identities
- IndexedDB and cloud-progress identities
- optional remote progress-sync endpoint
- cloud-progress projection logic
- school-specific exclusions/review flags

`src/engine/appProfile.ts` contains shared profile types. `src/schools/waseshibu/appProfile.ts` contains current WaseShibu values. Neither is wired into production runtime at this foundation stage.

Shared engine code must not import a global WaseShibu singleton. The WaseShibu composition layer injects WaseShibu configuration; the Rikkyo composition layer injects Rikkyo configuration using the same contract.

## Rikkyo normalization strategy

Rikkyo's current files remain authoritative migration/source inputs:

- `data/questions.json`
- `data/practice_bank.json`
- `data/exams.json`
- `data/registry.json`
- `assets/source-pages/*`

Before shared-engine cutover, their data is normalized into the same engine-facing schema as WaseShibu. A permanent runtime translation layer between two unrelated school schemas is not the target architecture.

If the canonical contract needs a field absent from current Rikkyo analysis, the field is first derived deterministically when possible. If it cannot be derived safely, it is explicitly created and audited. Guessed placeholders are not acceptable.

Existing Rikkyo problem IDs remain lineage invariants. The engine should use explicit year/form/major/minor fields instead of parsing school-specific ID syntax. If any temporary runtime mapping is unavoidable during migration, it must be deterministic and retain the original Rikkyo ID explicitly.

## Persistence rule

The **logical state format is common**; the **identity is school-specific**.

The common engine may expose persistence/migration helpers, but it must not assume all historical keys can be rebuilt from one prefix. Existing WaseShibu keys are compatibility data. Rikkyo's old v3 record is migration input, after which Rikkyo uses the canonical state shapes with Rikkyo-specific names.

Example conceptually:

```text
WaseShibu: waseshibu-math-attempts
Rikkyo:    rikkyo-uk-math-attempts
```

This gives one persistence model without cross-school data access.

## Cloud-progress rule

The current WaseShibu progress-sync implementation contains school-specific identities and assumptions, including its IndexedDB name, cloud `appId`, API override name, supported-year projection and target-label projection. Those are injected school concerns, not generic constants.

Rikkyo must not initialize shared progress sync until its own distinct identities are configured and an isolation test passes.

## Propagation model

Preferred model: **vendored canonical engine + pinned source commit**.

Rikkyo stores the WaseShibu engine source revision it was generated from. An updater checks WaseShibu `main`, refreshes only declared shared-engine paths, runs the full Rikkyo regression suite, and advances Rikkyo only on green.

```text
WaseShibu main (master engine)
        ↓
Rikkyo sync candidate pinned to master SHA
        ↓
Rikkyo format/content/storage/isolation regression gate
        ↓
Rikkyo deploy
```

A Rikkyo failure never blocks or mutates WaseShibu production. A WaseShibu engine change also does not mutate a running Rikkyo site immediately; it creates a testable candidate update.

## Rollout phases

### Phase 0 — foundation (this branch)
- document canonical ownership and safety invariants
- split shared profile types from WaseShibu school values
- record exact WaseShibu and Rikkyo compatibility baselines
- establish WaseShibu-derived canonical data-format policy
- do not change production runtime behaviour

### Phase 1 — behaviour-preserving extraction in WaseShibu
- make WaseShibu's current runtime data shapes explicit as canonical engine contracts
- move brand/year/learning-plan literals behind injected WaseShibu profile values
- move event/storage/update/sync identities behind injected school configuration while preserving exact existing WaseShibu strings
- remove engine dependence on parsing WaseShibu-specific problem-ID syntax where practical; use explicit fields
- parameterize school-specific target/year/cloud projections
- add tests proving existing WaseShibu storage keys, backup identity, IndexedDB identity, routes, scoring, learner-history migration and cloud sync are unchanged

### Phase 2 — Rikkyo data normalization and school package
- retain current Rikkyo source/audit files and stable lineage IDs
- convert Rikkyo questions/practice/exam metadata to the canonical WaseShibu engine format
- create and audit only genuinely missing canonical fields
- implement Rikkyo profile and Rikkyo-only persistence/sync identities
- add explicit migration from the current Rikkyo v3 browser record to canonical learner-state shapes
- preserve all 623 problem identities and quality flags
- do not copy WaseShibu content or learner identities into Rikkyo

### Phase 3 — sync automation
- pin the Rikkyo engine source to a WaseShibu commit SHA
- refresh only declared shared-engine paths; never overwrite Rikkyo school-owned source/content paths
- run WaseShibu engine tests plus Rikkyo format/content/scoring/storage/release/isolation tests before accepting an update
- no deploy on a failed regression

### Phase 4 — controlled cutover
- deploy Rikkyo from the common engine and common runtime data model
- verify parity of counts, lineage IDs, grading behaviour, explanations, source-page links and learner-history migration
- verify in-browser namespace isolation between the two school apps
- keep WaseShibu production unchanged except for behaviour-equivalent internal refactoring already proven by its own suite

## Required regression gates

### WaseShibu gate

Before a shared-engine extraction PR can merge:
- current WaseShibu verify workflow is green
- existing route behaviour is unchanged
- migration-preservation tests are green
- existing storage/backup names are unchanged
- progress-sync IndexedDB/app identity is unchanged
- WaseShibu grading/content behaviour is unchanged
- no Rikkyo data or identity is imported by WaseShibu production runtime

### Rikkyo gate

Before normalized Rikkyo data or a propagated engine update can deploy:
- normalized data passes the canonical engine contract
- all 212 past-paper source identities are mapped exactly once
- 212/212 source-grounded explanations remain present
- all 411 practice source identities are mapped exactly once
- 623 total identities have complete lineage
- source-page assets remain resolvable
- answer/grading data survives normalization
- `REVIEW_REQUIRED` handling remains intact
- current Rikkyo v3 learner data has an explicit canonical-state migration
- Rikkyo persistence/sync identities are distinct from WaseShibu
- no Rikkyo runtime writes WaseShibu learner keys/IndexedDB/channel
- all Rikkyo content/scoring/storage/release/isolation tests are green

## What is explicitly not shared

Even with one runtime schema, these remain separate:

- WaseShibu question/past-paper values and assets
- Rikkyo question/source-page values and assets
- learner records
- localStorage namespaces
- browser IndexedDB learner/sync databases
- cloud learner records/endpoints/credentials
- school-specific stable/source IDs
- school-specific target/scoring assumptions
- Rikkyo answer-review exceptions

The engine and data contract are shared; **school content values, learner data and persistence/sync identities are isolated**.