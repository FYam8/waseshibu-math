# v0.17.9 build / verification status

- App version: 0.17.9
- Data version: 6（schema変更なし）
- Required route: 2024 → 2023 → 2022 → 2025 → 2026
- 2019〜2021: optional reinforcement / optional full-year practice

# BUILD STATUS — v0.17.8

## Source / automated verification
- `npm run test:v0178:all` : PASS
- 21 non-build commands PASS
- `self-check` : PASS
- `verify-critical` : PASS
- migration preservation : PASS
- core-skill audit : 160/160 PASS
- remediation content : 160 banks / 640 questions PASS
- required regression 1–20 : PASS
- completeness supplements : PASS

## Additional completeness checks added
- app/package/package-lock version consistency
- remediation progress export/import validation
- migration backup + rollback guards
- A/B/C target switching does not delete learning history
- first-look/reference continuity and warning-only exposure guard
- 2025/2026 untouched checkpoint role
- 2019–2023 optional-year separation from required route/ETA
- 2019/2020 scope guard (no Pythagorean theorem as learning content)
- critical official-answer guards
- `未解決` terminology guard

## Build
`npm run build` was executed in this environment and is currently BLOCKED by the local dependency installation, not by an application TypeScript diagnostic.

Missing/empty type packages reported:
- @types/babel__core
- @types/babel__generator
- @types/babel__template
- @types/babel__traverse
- @types/estree
- @types/prop-types
- @types/react
- @types/react-dom

The local `node_modules` package directories are present but empty. A clean dependency install is required before final production build verification.

## Publication gate
Do not call this release production-complete until:
1. clean `npm ci`
2. `npm run build` PASS
3. actual-browser user-perspective test pass #1 = 0 issues
4. actual-browser user-perspective test pass #2 = 0 issues without code/data/test-condition changes
5. GitHub Pages confirms v0.17.8 is the served build


## 精査ループ
- 非buildテスト21コマンドは修正後に2回連続PASS確認対象。
- `npm run build` は依存パッケージ欠損環境では完了判定しない。
