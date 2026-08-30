# Build status

## Passed in this environment
- `node scripts/self-check.mjs`
- `node scripts/test-migration-preservation.mjs`
- `node scripts/test-today-plan.mjs`
- `node scripts/test-mastery-reactivation.mjs`
- `node scripts/audit-guided-solutions.mjs`
- `node scripts/syntax-check.mjs`

The full passing suite was run twice consecutively after the final code correction, with zero corrective changes between the two passes.

## Full Vite build
`npm run build` could not complete in this container because the repository has no installed React / React Router dependencies (`node_modules` is absent). The observed errors start with missing `react-router-dom` and `react/jsx-runtime`.

## verify-critical
`node scripts/verify-critical.mjs` could not run because `esbuild` is not installed in this container.

These are environment dependency limitations, not successful full-build results. On a normal networked machine run:

```bash
npm ci
npm run build
node scripts/verify-critical.mjs
```
