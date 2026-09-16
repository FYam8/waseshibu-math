# Canonical Model Gap Audit

Status: reviewed foundation finding / no production runtime change

Date: 2026-09-16

## Purpose

The decision is that Rikkyo uses the same canonical runtime data format as WaseShibu. This audit checks whether the **current** WaseShibu source/state shapes can already serve as that contract without losing Rikkyo information.

Conclusion: **not yet**. The master WaseShibu repository should define the canonical format, but the contract must first lift several legacy WaseShibu assumptions. This is still one common WaseShibu-owned format; it is not permission for a permanent Rikkyo-specific runtime schema.

The target is therefore the **post-extraction canonical contract defined in WaseShibu**, not a byte-for-byte copy of every current WaseShibu JSON/TypeScript structure.

## Gap 1 — exam identity cannot be year-only

Current WaseShibu exam/runtime logic is largely year-keyed. Existing exam score state stores a `year`, and exam configuration is keyed by year.

Rikkyo has multiple distinct exams in one year: A and B forms. They have separate roles and must have separate learner state, source metadata and scoring/evaluation histories.

### Canonical requirement

Every exam-capable record must support an opaque stable `examId` as the primary exam identity.

The exam catalog should expose structured metadata such as:

- `examId`
- `year`
- optional `form` / `examType`
- label
- role
- source metadata
- answer-authority metadata

`year` remains useful metadata but must not be the sole primary key in generic engine code.

WaseShibu can map one exam per year to deterministic exam IDs while preserving all existing production behaviour during migration.

## Gap 2 — target identity cannot be fixed to 60/70/75 in the shared contract

Current WaseShibu preferences use score targets 60 / 70 / 75. Rikkyo analysis currently expresses target policy as `minimum` / `stable` / `safe` with MUST/SHOULD-style relevance.

These are school policy values, not engine structure.

### Canonical requirement

The common state/data contract should use a school-defined opaque `targetId` plus school profile definitions for labels, ordering and policy.

Examples of school values may be:

- WaseShibu: `60`, `70`, `75`
- Rikkyo: `minimum`, `stable`, `safe`

The engine must not attach universal mathematical meaning to any particular target ID.

Existing WaseShibu persisted numeric target values remain compatibility data and require a behaviour-preserving mapping when the canonical target abstraction is introduced.

## Gap 3 — the canonical problem model must be leaf-problem based

Current WaseShibu content is spread across multiple historical structures:

- major-question metadata and subquestion classification
- per-subquestion guided solutions
- Level2/practice materialized records
- separate answer/grading and figure support

Rikkyo source data is already strongly leaf-oriented and carries detailed answer specifications, source references, hints, explanations, verification/ambiguity metadata and stable problem IDs.

Flattening Rikkyo into only the current WaseShibu `questions.json` aggregate shape would lose audited information and is therefore prohibited.

### Canonical requirement

The post-extraction WaseShibu master contract should define one leaf-problem identity with enough structured fields to represent both schools losslessly, including at least:

- opaque `problemId`
- explicit source/lineage ID
- `examId` where applicable
- structured year/form/major/minor/label location
- field/topic classification
- role / usage purpose
- difficulty or priority band
- answer specification used by deterministic grading
- accepted-answer/form requirements where applicable
- prompt or source-page/figure reference
- hints
- explanation/guided steps
- source/provenance metadata
- content/grading revision metadata
- ambiguity/review flags

WaseShibu's existing split files can be normalized into this contract without changing learner-visible behaviour; Rikkyo will then normalize into the exact same contract.

## Gap 4 — answer authority differs by school

WaseShibu has official-answer-based material in its current corpus. Rikkyo's current release explicitly uses source PDF + independent solution + mathematical recheck because official answers are unavailable.

### Canonical requirement

The common answer model must represent authority/verification explicitly instead of assuming that every correct answer is official.

It must support at least:

- answer/grading specification
- verification status
- authority source/model
- ambiguity/review status

Rikkyo `REVIEW_REQUIRED` cases must survive normalization unchanged.

## Gap 5 — learner attempt/session mode is currently WaseShibu-specific

Current WaseShibu attempt types include legacy interaction labels such as `q1` and `multi`. Rikkyo learning design distinguishes diagnostic, training, transfer, retention, evaluation and confirmation uses.

### Canonical requirement

Attempt history should identify the problem/exam and use a generic interaction/learning-purpose field rather than making WaseShibu's current UI route labels the universal data model.

Legacy WaseShibu mode values remain migratable compatibility data, but new generic engine logic must not require only `q1|multi`.

## Gap 6 — common code must not parse school-specific IDs

Rikkyo IDs such as `R25-MATH-A-Q...` intentionally encode useful lineage, while WaseShibu IDs use different historical patterns.

### Canonical requirement

Problem/exam IDs are opaque identifiers. Generic engine logic must use explicit fields (`examId`, year, form, major, minor, role, field ID) and must not infer semantics by parsing an ID string.

Any migration mapping must be deterministic and one-to-one.

## Gap 7 — canonical contract version must be explicit

App version, learner-state migration version and content-contract version solve different problems.

### Canonical requirement

The extracted engine should version the canonical data contract independently from application release numbers and school content revisions. A downstream Rikkyo sync must pin both:

- the WaseShibu master engine commit; and
- the canonical contract version accepted by its normalized school data.

An engine sync that requires an unsupported contract version must fail closed before deploy.

## Rikkyo normalization acceptance rules

Before Rikkyo can switch to the common runtime format:

1. all 212 past-paper source problem IDs map exactly once;
2. all 411 fixed-practice source IDs map exactly once;
3. all 623 source identities retain explicit lineage;
4. 212/212 source-grounded explanations remain available;
5. answer specifications survive with deterministic grading equivalence;
6. 31 source-page assets remain resolvable;
7. FY26A Q5(3) remains review-required;
8. no required canonical field is filled with an unaudited guessed placeholder;
9. current Rikkyo learner data has an explicit migration to the canonical learner-state shape;
10. Rikkyo persistence/sync identities remain distinct from WaseShibu despite identical logical shapes.

## Phase-1 implementation consequence

Before Rikkyo conversion begins, WaseShibu Phase 1 should produce explicit canonical types/providers for:

- exam catalog
- leaf problem catalog
- target definitions
- deterministic answer specification
- source/figure resolution
- learner attempt/exam/daily/route state
- guided/remediation/mastery state
- backup/migration contract
- progress-sync projection

Each extraction change must preserve current WaseShibu behaviour and current persisted learner data through tests/migration guards.

## Foundation safety status

This audit changes only foundation documentation/type vocabulary. It does not wire the profile into production runtime, change current WaseShibu storage, change scoring, change content, or deploy Rikkyo.
