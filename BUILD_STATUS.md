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
`npm ci` で依存関係をクリーンインストール後、`assessGuidedStep` の import 漏れを修正しました。

- `npm run test:v0178:all` : PASS（修正後2回連続）
- `npm run build` : PASS（修正後2回連続）
- production bundle : `dist/` 生成確認

## Publication gate
Completed locally:
1. clean `npm ci`
2. `npm run build` PASS twice consecutively
3. automated user-perspective/regression/audit suite PASS twice consecutively without code/data/test-condition changes

Final publication confirmation:
4. GitHub Actions verify/deploy success
5. GitHub Pages confirms v0.17.8 is the served build


## 精査ループ
- 非buildテスト21コマンドは修正後に2回連続PASS確認対象。
- `npm run build` は依存パッケージ欠損環境では完了判定しない。
