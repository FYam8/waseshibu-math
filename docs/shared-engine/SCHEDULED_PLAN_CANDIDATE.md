# Scheduled plan candidate — production write HOLD

Baseline: WaseShibu `2f0a5c227ec1c31f3d0f093eb683d200443a4ac7`, Rikkyo `09b3f0420193e48ca7babb219b2cc54d228e3784`.

`scheduledPlan.ts` operates on the existing CanonicalScheduledTaskPlan contract. It is a tested pure candidate, not a production scheduler cutover. No production module imports it and no legacy plan is rewritten.

Rules proved by candidate tests:
- Disappearance from available UI actions never counts as completion. Unresolved tasks remain pending.
- Completion requires an assigned task ID plus an explicit evidence record ID; school adapters must verify the referenced record actually proves completion.
- No automatic same-day refill. Completed IDs remain preserved and cannot overlap pending IDs.
- Task/target/date identities are opaque. No year, score or problem-ID parsing.
- Promotion preserves the complete study-ahead snapshot and refuses to overwrite an existing daily plan.
- Legacy fallback identity mapping fails closed. Raw migration input must be retained externally; the candidate does not discard it.

## Concrete downstream boundary findings

Rikkyo previously used separate UI IDs for an exam start and its resumable session, producing two rows for one unfinished exam. Reinforcement switched from a source-session ID to a resume-session ID while still active. Therefore legacy disappearance-based completion cannot be used to freeze Rikkyo plans.

The production-safe prerequisite is a school adapter mapping explicit examId / sourceSessionId / reviewItemId / sessionId to stable task identities, followed by common priority-preserving deduplication (`uniqueCanonicalTodayCandidates`). This does not modify any session or learner record.

## Remaining cutover gates

1. Verify school completion evidence for full exam, source correction, fixed set, review, and ordinary practice separately. A record ID alone is not evidence validation.
2. Define target-change policy without dropping pending/completed history, and date-boundary policy including conflicting ahead/today plans.
3. Add persistence and portable backup/import handling for new Rikkyo plans, with exact restore and rollback proof.
4. Run dual-read/shadow parity and browser date/target/reload cases before candidate writes.

Current WaseShibu legacy inference and storage identities remain unchanged. The scheduler candidate is deliberately not exported as the production Today implementation.
