# Shared Math Engine Architecture

Status: foundation / no production runtime change

## Goal

`FYam8/waseshibu-math` is the canonical master for the reusable Math learning engine. School applications remain in separate repositories. Improvements to the canonical engine are propagated to downstream school apps only after that school's adapter/data regression suite passes.

The first downstream consumer is `FYam8/rikkyo-uk-math`.

## Non-negotiable safety rules

1. **WaseShibu users must not be affected by extraction work.** Refactoring is developed on a branch/PR and merged only after the existing WaseShibu verification/build suite is green.
2. **Existing WaseShibu persistence identities remain byte-for-byte compatible.** Current `waseshibu-math-*` localStorage keys, backup package identity, migration semantics, version guards, IndexedDB names, BroadcastChannel/event identities, and Cloudflare progress-sync identities remain WaseShibu-specific unless an explicit compatible migration has been proven.
3. **Rikkyo never reads or writes WaseShibu learner state.** Rikkyo uses its own localStorage/backup identity, IndexedDB database, migration history, update channel, cloud app/tenant identity, and cloud endpoint/credentials if cloud sync is enabled.
4. **School content is not part of the shared engine.** Past-paper data, authored explanations, figures, practice-bank items, answer authority, school-specific scoring assumptions, and learning-plan dates stay in each school's repository/profile.
5. **Engine propagation is gated, not blind.** A WaseShibu engine change can update Rikkyo automatically, but Rikkyo tests must pass before its deployable branch is advanced.
6. **Path separation is not a data-isolation mechanism.** Browser localStorage, IndexedDB, and BroadcastChannel are origin-scoped. If separate project sites are served under the same web origin, all persistence/sync names still have to be unique per school.

The exact audited identities are recorded in `docs/shared-engine/COMPATIBILITY_BASELINE.md` and are treated as Phase-1 regression invariants. Canonical/shared versus school-owned path rules are recorded in `docs/shared-engine/PATH_OWNERSHIP.md`.

## Repository roles

### Canonical master: `FYam8/waseshibu-math`

Owns:
- React/Vite app shell and navigation framework
- learner workflow primitives (Today, route/progression, remediation, reinforcement, review)
- answer-input and deterministic grading interfaces
- history/attempt abstractions
- safe update / backup / migration framework
- reusable UI components
- engine-level tests and compatibility contracts

Also owns WaseShibu's **school package**, which contains WaseShibu-only configuration and content.

### Downstream school app: `FYam8/rikkyo-uk-math`

Owns:
- Rikkyo identity/brand and school-specific learning route
- FY24/FY25/FY26 A/B source exams and source-page assets
- Rikkyo question/explanation data
- Rikkyo fixed practice bank
- Rikkyo answer authority and REVIEW_REQUIRED flags
- Rikkyo school-specific tests, migration policy, persistence/sync identities, and deploy config

The existing Rikkyo analysed content is authoritative school data and must be preserved rather than regenerated merely to fit the engine.

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

These counts/IDs are migration invariants. Adapter work may transform shape at load time, but must not silently delete, renumber, or replace this content.

The current Rikkyo browser-state schema is also school-owned. Its v3 storage family (`rikkyoMathFull:${NS}:v3` with prod/qa/test namespaces and v1/v2 legacy keys) must either remain compatible or receive an explicit Rikkyo-only migration. It must never be interpreted as WaseShibu learner state.

## Engine / school boundary

The shared engine must consume a school adapter instead of importing school content directly. The adapter contract will cover at least:

- app identity and display strings
- supported years / exam forms
- learning phase plan and phase-role vocabulary
- school target/priority semantics
- question catalog loader
- practice/remediation catalog loader
- answer authority / grading metadata
- figure/source-page resolver
- field/topic taxonomy
- persistence namespace, backup identity, and schema version
- update-event / BroadcastChannel identities
- IndexedDB and cloud-progress identities
- optional remote progress-sync endpoint
- cloud-progress projection logic when year/target semantics differ by school
- school-specific exclusions/review flags

`src/engine/appProfile.ts` now contains only the shared profile types. `src/schools/waseshibu/appProfile.ts` contains the current WaseShibu values. Neither is wired into production runtime at this foundation stage.

This split is deliberate: shared engine code must not import a global WaseShibu singleton. The WaseShibu composition layer will inject the WaseShibu profile; a Rikkyo composition layer will inject a Rikkyo profile.

### Persistence rule

The common engine may expose persistence helpers, but it must not invent keys by assuming that all historical state can be derived from one prefix. WaseShibu's existing keys and backup identity are compatibility data. Rikkyo's existing storage schema is a separate compatibility domain.

### Cloud-progress rule

The current WaseShibu progress-sync implementation contains school-specific identities and assumptions, including its IndexedDB name, cloud `appId`, API override name, supported-year projection, and target-label projection. Those are adapter/profile concerns, not generic engine constants.

A downstream school must not initialize progress sync until all school-specific sync identities are present and its isolation test passes.

## Propagation model

Preferred model: **vendored canonical engine + pinned source commit**.

Rikkyo stores the WaseShibu engine source revision it was generated from. An updater workflow checks WaseShibu `main`, refreshes only the declared shared-engine paths, runs the full Rikkyo adapter/content test suite, and advances Rikkyo only on green.

This gives the desired direction of ownership:

`WaseShibu main (master engine)` → `Rikkyo sync candidate` → `Rikkyo regression gate` → `Rikkyo deploy`

It deliberately does **not** create reverse dependencies from WaseShibu onto Rikkyo and does not let a Rikkyo failure block WaseShibu production.

The pinned-source model also means a WaseShibu engine change does not mutate a running Rikkyo production site immediately. It creates a candidate update whose exact master SHA is known and testable.

## Rollout phases

### Phase 0 — foundation (this branch)
- document canonical ownership and safety invariants
- add a typed shared profile contract and separate WaseShibu school profile
- record exact WaseShibu and Rikkyo compatibility baselines
- do not change runtime behaviour

### Phase 1 — behaviour-preserving extraction in WaseShibu
- move brand/year/learning-plan literals behind the injected WaseShibu profile
- move event/storage/update/sync identities behind an injected persistence profile while preserving the exact existing WaseShibu strings
- parameterize school-specific progress projections rather than sharing WaseShibu year/target assumptions
- introduce engine-facing content provider interfaces
- add tests proving existing WaseShibu localStorage keys, backup identity, IndexedDB identity, routes, scoring, learner-history migration, and cloud sync are unchanged

### Phase 2 — Rikkyo adapter
- retain the current Rikkyo data files and stable IDs
- implement loaders/adapters from `data/questions.json`, `data/practice_bank.json`, `data/exams.json`, `data/registry.json`
- implement Rikkyo-specific profile and persistence/sync identities
- preserve or explicitly migrate the current Rikkyo v3 browser state
- fill only fields genuinely required by the shared contract that are absent from existing analysis
- do not copy WaseShibu content, stable IDs, learner keys, IndexedDB name, update channel, or cloud endpoint into Rikkyo

### Phase 3 — sync automation
- pin the Rikkyo engine source to a WaseShibu commit SHA
- add an updater workflow
- refresh only declared shared-engine paths; never overwrite school-owned data paths
- run WaseShibu engine tests plus Rikkyo content/scoring/storage/release/isolation tests before update acceptance
- no deploy on a failed adapter/content/isolation regression

### Phase 4 — controlled cutover
- deploy Rikkyo from the common engine
- verify parity of content counts, stable IDs, grading behaviour, source-page links, and learner-history migration
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
- no Rikkyo data or identity is imported by the WaseShibu production runtime

### Rikkyo gate

Before a propagated engine update can deploy:
- 212 past-paper IDs remain present
- 212/212 source-grounded explanations remain present
- 411 fixed practice items remain present
- 623 total problem IDs remain stable
- source-page assets remain resolvable
- scoring and release-invariant tests remain green
- `REVIEW_REQUIRED` handling remains intact
- Rikkyo persistence/sync names are distinct from WaseShibu
- no shared-engine update writes to WaseShibu learner keys/IndexedDB/channel from the Rikkyo app

## What is explicitly not shared

- WaseShibu question data or past-paper PDFs
- Rikkyo question data or source pages
- learner localStorage records
- browser IndexedDB learner/sync databases
- cloud learner records/endpoints/credentials
- school-specific stable problem IDs
- school-specific scoring assumptions
- Rikkyo's answer-review exceptions

The engine is shared; **school data, learner data, and persistence/sync identities are isolated**.
