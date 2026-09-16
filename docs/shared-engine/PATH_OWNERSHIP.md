# Shared Engine Path Ownership

Status: target layout for behaviour-preserving extraction

The updater must never decide what is shared by comparing whole repositories. Shared ownership has to be explicit at the path level so a WaseShibu-only change cannot overwrite Rikkyo school data.

## Target ownership in `FYam8/waseshibu-math`

The Phase-1 extraction should converge on a structure equivalent to:

```text
src/
  engine/                 # canonical shared implementation + canonical data contracts
  schools/
    waseshibu/            # WaseShibu profile/content bindings
  main.tsx                # WaseShibu composition/bootstrap only
```

The exact filenames may evolve during extraction, but ownership must remain equivalent.

### Canonical shared paths

May be propagated downstream after tests:

- reusable app-shell/navigation primitives
- reusable learning workflow/state-machine primitives
- generic answer-input and grading interfaces
- canonical engine-facing content types
- canonical learner-state types / migration framework
- generic remediation/reinforcement/review components
- generic backup/migration framework interfaces
- generic storage/sync abstractions that require school identities as injected configuration
- engine-level tests and public adapter/profile types

### WaseShibu-only paths

Must never be copied into Rikkyo by the engine updater:

- WaseShibu question/past-paper values and figures
- WaseShibu school labels and learning-plan values
- `waseshibu-math-*` persistence identities
- `waseshibu-progress-sync` IndexedDB identity
- WaseShibu cloud endpoint/window override/credentials
- WaseShibu target/year projection rules
- WaseShibu deploy workflow and school-specific tests

## Target ownership in `FYam8/rikkyo-uk-math`

Rikkyo should contain the pinned canonical engine plus Rikkyo-owned source data and normalized school data. Conceptually:

```text
src/
  engine/                 # vendored from a pinned WaseShibu master SHA
  schools/
    rikkyo/               # Rikkyo profile + normalized canonical school package

source-data/ or retained data/
  ...                     # current Rikkyo analysis/source records used for conversion/audit

assets/source-pages/      # Rikkyo source assets; never overwritten by engine sync
docs/                      # Rikkyo analysis/audits remain school-owned
```

The exact Rikkyo directory migration will be decided during Phase 2. The important distinction is ownership:

- **Rikkyo source/audit values are Rikkyo-owned and never overwritten by engine sync.**
- **Rikkyo production data must conform to the same canonical engine contract as WaseShibu.**

The current files `data/questions.json`, `data/practice_bank.json`, `data/exams.json`, and `data/registry.json` remain migration/source inputs until normalization is complete. They are not a reason to keep a separate permanent runtime schema.

## Canonical format, separate values

The updater may carry shared TypeScript types, parsers, validators and migration framework into Rikkyo. It must never carry WaseShibu school records themselves.

A useful target split is:

```text
src/engine/               # shared code + contracts
src/schools/waseshibu/    # WaseShibu values, only in master app
src/schools/rikkyo/       # Rikkyo values, only in Rikkyo app
```

Both school packages satisfy the same interfaces.

## Rikkyo source-to-canonical conversion

The Phase-2 converter/normalizer is school-owned code. It may read Rikkyo's current source JSON and emit canonical engine data, but it must preserve source lineage and all audited mathematics.

Required source-lineage invariants:

- 212 past-paper records mapped exactly once
- 411 fixed practice records mapped exactly once
- 623 total source IDs traceable in canonical output
- all 212 explanations preserved
- all source-page references preserved
- `REVIEW_REQUIRED` preserved

If canonical output uses a different runtime identifier during transition, the original Rikkyo ID must remain explicitly stored and deterministically mapped.

## Learner-state ownership

The logical learner-state model is shared, but persistence identity is not.

Therefore shared engine code may own Attempt/ExamScore/Daily/Route/Guided/Remediation/Mastery structures and migration helpers, while each school owns:

- localStorage key namespace
- backup package `app` identity
- BroadcastChannel and CustomEvent names
- IndexedDB database name
- cloud app/tenant identity and endpoint

The old `rikkyoMathFull:${NS}:v3` family is a Rikkyo-only migration input. After cutover Rikkyo should use the canonical logical state format under Rikkyo-specific identities.

## Propagation manifest

Rikkyo should eventually carry a small machine-readable manifest such as `engine-source.json` containing at least:

```json
{
  "masterRepository": "FYam8/waseshibu-math",
  "masterCommit": "<pinned-sha>",
  "sharedPath": "src/engine",
  "contractVersion": 1
}
```

The updater may refresh only the declared shared path(s). School-owned paths are deny-listed from engine synchronization even if filenames happen to match.

## Update flow

1. WaseShibu `main` advances.
2. Updater detects that one or more canonical shared paths changed.
3. It creates a Rikkyo sync candidate pinned to that WaseShibu SHA.
4. Rikkyo canonical-format validation and content/scoring/storage/isolation tests run.
5. Only a green candidate may advance the Rikkyo deployable branch.

A WaseShibu-only school-data change outside canonical shared paths does not create a Rikkyo engine update.

## Why this is required

The desired ownership is one-way: WaseShibu is the master implementation and master data contract, while Rikkyo remains a separate school app. Explicit path ownership gives that relationship without making the repositories mirrors of each other, and without sacrificing Rikkyo's already-audited 623 problem records.