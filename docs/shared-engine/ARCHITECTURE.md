# Shared Math Engine Architecture

Status: foundation / no production runtime change

## Goal

`FYam8/waseshibu-math` is the canonical master for the reusable Math learning engine. School applications remain in separate repositories. Improvements to the canonical engine are propagated to downstream school apps only after that school's adapter/data regression suite passes.

The first downstream consumer is `FYam8/rikkyo-uk-math`.

## Non-negotiable safety rules

1. **WaseShibu users must not be affected by extraction work.** Refactoring is developed on a branch/PR and merged only after the existing WaseShibu verification/build suite is green.
2. **Existing WaseShibu storage identities remain byte-for-byte compatible.** Current `waseshibu-math-*` localStorage keys, migration semantics, version guards, BroadcastChannel/event identities, and Cloudflare progress sync remain WaseShibu-specific unless an explicit compatible migration has been proven.
3. **Rikkyo never reads or writes WaseShibu learner state.** Rikkyo uses its own storage namespace, migration history, update channel, and cloud endpoint/credentials if cloud sync is enabled.
4. **School content is not part of the shared engine.** Past-paper data, authored explanations, figures, practice-bank items, answer authority, school-specific scoring assumptions, and learning-plan dates stay in each school's repository/profile.
5. **Engine propagation is gated, not blind.** A WaseShibu engine change can update Rikkyo automatically, but Rikkyo tests must pass before its deployable branch is advanced.

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
- Rikkyo school-specific tests, migration policy, storage namespace, and deploy config

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

## Engine / school boundary

The shared engine must consume a school adapter instead of importing school content directly. The adapter contract will cover at least:

- app identity and display strings
- supported years / exam forms
- learning phase plan
- school target/priority semantics
- question catalog loader
- practice/remediation catalog loader
- answer authority / grading metadata
- figure/source-page resolver
- field/topic taxonomy
- persistence namespace and schema version
- optional remote progress-sync endpoint
- school-specific exclusions/review flags

`src/appProfile.ts` is the first explicit profile contract. At this foundation stage it mirrors current WaseShibu values and is intentionally not wired into production runtime yet.

## Propagation model

Preferred model: **vendored canonical engine + pinned source commit**.

Rikkyo stores the WaseShibu engine source revision it was generated from. An updater workflow checks WaseShibu `main`, refreshes only the declared shared-engine paths, runs the full Rikkyo adapter/content test suite, and advances Rikkyo only on green.

This gives the desired direction of ownership:

`WaseShibu main (master engine)` → `Rikkyo sync candidate` → `Rikkyo regression gate` → `Rikkyo deploy`

It deliberately does **not** create reverse dependencies from WaseShibu onto Rikkyo and does not let a Rikkyo failure block WaseShibu production.

## Rollout phases

### Phase 0 — foundation (this branch)
- document canonical ownership and safety invariants
- add a typed school-profile contract with the current WaseShibu values
- do not change runtime behaviour

### Phase 1 — behaviour-preserving extraction in WaseShibu
- move brand/year/learning-plan literals behind the profile
- move event/storage/update namespaces behind a persistence profile while preserving the exact existing WaseShibu strings
- introduce engine-facing content provider interfaces
- add tests proving existing WaseShibu storage keys, routes, scoring, and learner-history compatibility are unchanged

### Phase 2 — Rikkyo adapter
- retain the current Rikkyo data files and stable IDs
- implement loaders/adapters from `data/questions.json`, `data/practice_bank.json`, `data/exams.json`, `data/registry.json`
- implement Rikkyo-specific profile and persistence namespace
- fill only fields genuinely required by the shared contract that are absent from existing analysis

### Phase 3 — sync automation
- pin the Rikkyo engine source to a WaseShibu commit SHA
- add an updater workflow
- run WaseShibu engine tests plus Rikkyo content/scoring/storage/release tests before update acceptance
- no deploy on a failed adapter/content regression

### Phase 4 — controlled cutover
- deploy Rikkyo from the common engine
- verify parity of content counts, stable IDs, grading behaviour, source-page links, and learner-history migration
- keep WaseShibu production unchanged except for behaviour-equivalent internal refactoring already proven by its own suite

## What is explicitly not shared

- WaseShibu question data or past-paper PDFs
- Rikkyo question data or source pages
- learner localStorage records
- cloud learner records/endpoints
- school-specific stable problem IDs
- school-specific scoring assumptions
- Rikkyo's answer-review exceptions

The engine is shared; **school data and learner data are isolated**.
