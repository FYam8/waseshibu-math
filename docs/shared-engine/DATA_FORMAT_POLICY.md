# Shared Math Engine Data Format Policy

Status: architecture decision / no production runtime change

## Decision

**Rikkyo will use the same canonical runtime data format as WaseShibu.**

`FYam8/waseshibu-math` remains the master implementation and defines the common engine data contract. `FYam8/rikkyo-uk-math` will not keep a permanently separate runtime schema with a large translation layer. Its existing analysed data is migration input and audit evidence; before shared-engine cutover it will be normalized into the same engine-facing shapes used by WaseShibu.

This decision applies to both:

1. school/content data consumed by the learning engine; and
2. learner-state shapes such as attempts, scores, daily state, guided progress, remediation progress, learning route, backup/export and migration records.

The **shape and semantics of the engine contract are shared**. The **school identity, content values and browser/cloud namespaces remain separate**.

## What “same format” means

The target is the WaseShibu **post-extraction canonical engine contract**, not a blind copy of every current WaseShibu source file or legacy state type.

WaseShibu currently has school-specific assumptions distributed across `src/data/*`, history/migration modules and progress sync. Phase 1 will extract and, where needed, generalize those engine-facing shapes while proving that current WaseShibu behaviour and stored learner data remain compatible. Rikkyo will then be converted to those same canonical shapes.

The concrete legacy assumptions found by the first audit are recorded in `CANONICAL_MODEL_GAPS.md`. In particular, the canonical contract must not remain year-only for exam identity, must not hard-wire target identity to 60/70/75, and must not treat WaseShibu's current split content files as the final universal problem schema.

The common contract must cover at least:

- app/school profile
- exam catalog with opaque `examId` plus year/form/role/source metadata
- leaf problem identity and structured location (year, exam/form, major/minor)
- topic/field classification
- learning priority/difficulty band
- school-defined target identity/rules (`targetId`)
- answer input and deterministic grading specification
- answer-authority / verification metadata
- hints and guided/explanation steps
- source-page / figure references
- practice/remediation/transfer/retention/evaluation/confirmation role
- review/ambiguity flags
- attempt records without requiring legacy WaseShibu-only route labels
- exam-score records keyed by exam identity rather than year alone
- daily/route state
- guided/remediation/mastery history
- backup/export package
- migration versioning
- independent canonical-contract versioning
- optional progress-sync projection

## Rikkyo content preservation while changing format

The current Rikkyo RC2 data remains authoritative for content. Normalization must preserve, at minimum:

- 212 past-paper problem records
- 212/212 authored source-grounded explanations
- 411 fixed practice items
  - L1: 100
  - L2: 168
  - Clean Transfer: 77
  - Retention: 66
- 623 total problem identities
- 31 source-page images
- existing answer specifications and independent-QA evidence
- FY26A Q5(3) `REVIEW_REQUIRED`

Changing schema must not mean re-authoring or replacing already-audited Rikkyo mathematics.

### IDs

Existing Rikkyo problem IDs are lineage invariants. The common engine should treat problem IDs as opaque identifiers and rely on explicit structured fields for year/form/question location wherever possible.

If a temporary canonical runtime ID is ever required for a WaseShibu legacy assumption, the Rikkyo original ID must remain as an explicit stable source ID with a deterministic one-to-one mapping. No silent renumbering is allowed.

## Rikkyo normalization source

The current Rikkyo files are migration/source inputs:

- `data/questions.json`
- `data/practice_bank.json`
- `data/exams.json`
- `data/registry.json`
- `assets/source-pages/*`
- existing audit documents and release manifest

They may remain in the repository as source/audit artifacts, but the production shared-engine runtime should consume normalized canonical data rather than maintain a second permanent application model.

## Missing-field policy

When the WaseShibu canonical contract requires a field that the current Rikkyo analysis does not contain:

1. first derive it deterministically from existing Rikkyo fields when the mapping is lossless;
2. if it cannot be derived safely, create the missing Rikkyo data explicitly in a data-completion step;
3. record provenance / audit status for created values;
4. run mathematical/content QA before the field is accepted;
5. never insert a guessed placeholder merely to satisfy a TypeScript or JSON schema.

Examples of generally mappable Rikkyo fields include year, A/B form, major/minor location, skill labels, difficulty, answer type/specification, explanation steps, source-page references and learning-role metadata. School-specific target semantics must not be silently reinterpreted as WaseShibu score semantics; the shared format is the same while the school profile supplies different target IDs, labels and rules.

## Learner-state alignment

Rikkyo will also converge on the same logical learner-state model and migration framework as WaseShibu so future engine changes do not require two unrelated persistence implementations.

However, browser/cloud identities remain isolated. Conceptually the suffixes/shapes may match while the school namespace differs, for example:

```text
WaseShibu: waseshibu-math-attempts
Rikkyo:    rikkyo-uk-math-attempts
```

The exact Rikkyo namespace will be frozen before cutover.

The current Rikkyo v3 family (`rikkyoMathFull:${NS}:v3`, with v1/v2 legacy keys) therefore becomes a **migration source**, not the permanent target schema. A one-time Rikkyo-only migration will convert it into the canonical learner-state shapes under Rikkyo-specific keys. It must never write to `waseshibu-math-*` keys.

The canonical learner-state contract must support `examId` so A/B forms do not collide, and it must use school-defined target identity rather than making WaseShibu's numeric score targets universal. Existing WaseShibu serialized values remain compatibility inputs and are migrated without learner-data loss.

## What remains school-specific

Even with one data format, these values remain school-owned:

- school name / branding
- supported exam years and A/B forms
- exam and problem content
- stable/source problem IDs
- answer authority and review flags
- target IDs/labels and school-specific priority semantics
- source-page assets
- persistence namespace
- backup `app` identity
- BroadcastChannel / CustomEvent names
- IndexedDB database name
- cloud app/tenant identity, endpoint and credentials

Shared schema does not mean shared learner data.

## Migration gates

Before Rikkyo may cut over to the canonical format, tests must prove:

1. no Rikkyo source problem or practice item is lost;
2. the 623 source identities have a complete one-to-one mapping;
3. answers, grading specs, explanations and source references survive normalization;
4. `REVIEW_REQUIRED` and other quality flags survive normalization;
5. the normalized data satisfies the WaseShibu canonical engine contract;
6. A/B exam forms remain distinguishable in catalog, score and attempt history;
7. target policy remains school-correct without silently converting minimum/stable/safe into WaseShibu 60/70/75 semantics;
8. current Rikkyo v3 learner data has an explicit migration path into the common learner-state format;
9. Rikkyo persistence/sync identities are distinct from every WaseShibu identity;
10. the Rikkyo content/scoring/storage/release/isolation regression suites are green.

## Direction of ownership

The final relationship is:

```text
WaseShibu master
  ├─ canonical engine code
  ├─ canonical engine data contracts
  └─ WaseShibu school package
          │
          └── pinned shared-engine update
                ↓
Rikkyo repository
  ├─ same canonical engine code
  ├─ same canonical data contract
  └─ Rikkyo school package/data values
```

One engine and one runtime data model; separate repositories, school content and learner namespaces.
