# Shared math input

The canonical master owns `mathInput.ts` and its generated browser runtime. WaseShibu's React component and Rikkyo's DOM adapter consume the same key definitions, selection replacement, insertion cursor and backspace functions.

Normalization and grading stay in their existing school adapters. No persistence keys, content, learner records or scoring are changed. This is shared input editing, not a claim that the full answer renderer or grading implementation is shared.

Rollback baseline: WaseShibu 8c66bb6859646759bbe30b47f1218ef0e720626d; Rikkyo 99e60cc5217f5b50dbe9bfe278ad15f5ec2551bb.

The parity test exercises legacy selection behavior across every valid selection for representative answers, including stale positions. The browser regression runs against isolated local builds at mobile and desktop widths, including draft resume. Downstream updates must pin a tested master commit and run their complete regression before deployment.

Baseline issue: the optional browser-bug guard still expected APP_VERSION 0.18.0 while the unchanged production version is 0.18.1. Updated only the stale assertion; version and persistence remain unchanged. Baseline build and mobile/desktop input regression pass.
