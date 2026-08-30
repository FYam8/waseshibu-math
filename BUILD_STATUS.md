# Build status

- `node scripts/audit-guided-solutions.mjs`: PASS
- `node scripts/test-migration-preservation.mjs`: PASS
- `node scripts/self-check.mjs`: PASS
- `node scripts/verify-critical.mjs`: not executable in this container because the npm dependency `esbuild` is absent.
- `npm run build`: cannot be completed in this container because npm dependencies / React type packages are incomplete.
- `npm ci --offline`: cannot restore the missing dependency because `yallist-3.1.1.tgz` is not present in the local npm cache.

The source package itself includes `package-lock.json`; on a normal networked development machine, run `npm ci && npm run build && node scripts/verify-critical.mjs` before deployment.
