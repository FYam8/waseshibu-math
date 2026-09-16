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
- WaseShibu target/year/score projection rules
- WaseShibu deploy workflow and school-specific tests

## Target ownership in `FYam8/rikkyo-uk-math`

Rikkyo should contain the pinned canonical engine plus Rikkyo-owned normalized school data. Conceptually:

```text
src/
  engine/                 # vendored from a pinned WaseShibu master SHA
  schools/
    rikkyo/               # Rikkyo profile + canonical-format school package

legacy-source/ or retained source-data/
  ...                     # frozen RC2-era source serialization / audit evidence

assets/source-pages/      # Rikkyo source assets; never overwritten by engine sync
docs/                     # Rikkyo analysis/audits remain school-owned
```

The exact Rikkyo directory migration will be decided during Phase 2. The important distinction is ownership:

- **Rikkyo school values are Rikkyo-owned and never overwritten by engine sync.**
- **Rikkyo production data must conform to the same canonical engine contract as WaseShibu.**
- **The current RC2 serialization is migration input, not a permanent second production schema.**

The current files `data/questions.json`, `data/practice_bank.json`, `data/exams.json`, and `data/registry.json` remain authoritative migration/source inputs until normalization is accepted. They are not a reason to keep a separate permanent runtime schema.

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
- answer/grading authority preserved
- no unsupported 100-point score fabricated
- `REVIEW_REQUIRED` preserved

If canonical output uses a different runtime identifier during transition, the original Rikkyo ID must remain explicitly stored and deterministically mapped.

## Source-of-Truth lifecycle

The migration must not leave two editable Rikkyo schemas indefinitely.

### Before canonical cutover

The existing RC2 files and release manifest are the Rikkyo content Source of Truth. Canonical output is generated on a migration branch and must not replace production until all conversion gates pass.

### At canonical cutover

A new Rikkyo release is created whose active school package is in the canonical WaseShibu-owned data contract. The conversion is accepted only after counts, lineage, answers, explanations, source references, flags and learner-state migration are verified.

The old RC2 release manifest remains evidence for the RC2 snapshot/tag; it must not be silently rewritten to describe the new release.

### After canonical cutover

The canonical Rikkyo school package becomes the active editable Source of Truth for future Rikkyo application data. The old RC2 serialization is frozen/archive/audit material and is not maintained in parallel as a second live model.

New Rikkyo questions, explanations, practice items and metadata are authored directly in the canonical format. If source documents or audit evidence are retained separately, they support verification but do not define a competing runtime schema.

This lifecycle is required to make “Rikkyo follows the WaseShibu data format” true operationally, not just at render time.

## Learner-state ownership

The logical learner-state model is shared, but persistence identity is not.

Therefore shared engine code may own canonical Attempt/ExamResult/Daily/Route/Guided/Remediation/Mastery structures and migration helpers, while each school owns:

- localStorage key namespace
- backup package `app` identity
- BroadcastChannel and CustomEvent names
- IndexedDB database name
- cloud app/tenant identity and endpoint
- school-specific target/result interpretation

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
3. It creates a Rikkyo sync candidate pinned to that WaseShibu SHA and contract version.
4. Rikkyo canonical-format validation and content/scoring/storage/isolation tests run.
5. Only a green candidate may advance the Rikkyo deployable branch.

A WaseShibu-only school-data change outside canonical shared paths does not create a Rikkyo engine update.

## Why this is required

The desired ownership is one-way: WaseShibu is the master implementation and master data contract, while Rikkyo remains a separate school app. Explicit path ownership gives that relationship without making the repositories mirrors of each other, without sacrificing Rikkyo's already-audited 623 problem records, and without preserving a second live Rikkyo runtime schema after cutover.
