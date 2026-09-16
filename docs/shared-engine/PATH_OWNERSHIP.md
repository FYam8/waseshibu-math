# Shared Engine Path Ownership

Status: target layout for behaviour-preserving extraction

The updater must never decide what is shared by comparing whole repositories. Shared ownership has to be explicit at the path level so a WaseShibu-only change cannot overwrite Rikkyo school data.

## Target ownership in `FYam8/waseshibu-math`

The Phase-1 extraction should converge on a structure equivalent to:

```text
src/
  engine/                 # canonical shared implementation
  schools/
    waseshibu/            # WaseShibu adapter/profile/content bindings
  main.tsx                # WaseShibu composition/bootstrap only
```

The exact filenames may evolve during extraction, but ownership must remain equivalent:

### Canonical shared paths

May be propagated downstream after tests:

- reusable app-shell/navigation primitives
- reusable learning workflow/state-machine primitives
- generic answer-input and grading interfaces
- generic remediation/reinforcement/review components
- generic backup/migration framework interfaces
- generic storage/sync abstractions that require school identities as injected configuration
- engine-level tests and public adapter types

### WaseShibu-only paths

Must never be copied into Rikkyo by the engine updater:

- WaseShibu question/past-paper data and figures
- WaseShibu school labels and learning-plan values
- `waseshibu-math-*` persistence identities
- `waseshibu-progress-sync` IndexedDB identity
- WaseShibu cloud endpoint/window override/credentials
- WaseShibu target/year projection rules
- WaseShibu deploy workflow and school-specific tests

## Target ownership in `FYam8/rikkyo-uk-math`

After the React/Vite consumer is introduced, Rikkyo should contain the same canonical engine subtree plus Rikkyo-owned adapters/data. Conceptually:

```text
src/
  engine/                 # vendored from a pinned WaseShibu master SHA
  schools/
    rikkyo/               # Rikkyo adapter/profile/loaders

data/                     # Rikkyo Source of Truth; never overwritten by engine sync
assets/source-pages/       # Rikkyo Source of Truth; never overwritten by engine sync
docs/                      # Rikkyo analysis/audits remain school-owned
```

The existing Rikkyo `data/questions.json`, `data/practice_bank.json`, `data/exams.json`, `data/registry.json`, source-page assets and audit material remain Rikkyo-owned throughout the migration.

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
4. Rikkyo adapter/content/scoring/storage/isolation tests run.
5. Only a green candidate may advance the Rikkyo deployable branch.

A WaseShibu-only change outside canonical shared paths does not create a Rikkyo engine update.

## Why this is required

The user's desired ownership is one-way: WaseShibu is the master implementation, while Rikkyo remains a separate school app. Explicit path ownership gives that relationship without making the repositories mirrors of each other and without risking replacement of Rikkyo's already-audited 623 problem IDs.