# BUILD STATUS — v0.17.9

## Final status
- App version: **0.17.9**
- Data version: **6**（schema変更なし・既存学習履歴を非破壊で維持）
- Required route: **2024 → 2023 → 2022 → 2025 → 2026**
- 2019〜2021: optional reinforcement / optional full-year practice
- GitHub source verification: **PASS**
- Production build: **PASS**
- GitHub Pages deploy: **PASS**
- Publication status: **PUBLISHED**

## GitHub clean-environment verification
2026-09-01 UTC、GitHub Actions のクリーン環境で実施。

- `npm ci`: **PASS**（0 vulnerabilities）
- `npm run syntax-check`: **PASS**（48 TS/TSX files）
- `npm run test:v0178:all`: **PASS**（22 non-build commands）
- `npm run self-check`: **PASS**
- `npm run verify-critical`: **PASS**
- migration preservation: **PASS**
- core-skill audit: **160/160 PASS**
- remediation content audit: **160 banks / 640 questions PASS**
- required five-year flow regression: **PASS**
- `npm run build` (`tsc -b && vite build`): **PASS**

## Pre-publication fixes found by the clean build gate
1. 転送時に `src/targetEta.ts` の末尾 `}` が1文字欠けた状態を検出し、ZIP原本と照合して修正。
2. ZIP原本に存在した `GuidedReview.tsx` の `assessGuidedStep` import漏れをproduction buildが検出。既存exportをimportするだけの最小修正を行い、全回帰テストを再実行。

修正後は、22本の非build回帰テストをすべて通過したうえでproduction buildが成功している。

## Data safety
- `dataVersion` は6のまま。
- attempts / preferences / daily / exam scores / exam drafts / learning route / Guided Review / Guided Progress / remediation progress / prep / daily plans を削除しない。
- migration前バックアップとbest-effort rollbackを維持。
- A/B/C目標変更では学習履歴を削除しない。

## Publication verification
GitHub Pages workflow run #123: **SUCCESS**
`public/version.json`: **0.17.9**

実ブラウザのユーザー視点2周は、ソース自動監査・公開確認とは別工程として扱う。
