# v0.17.8 中心技能監査 最終進捗

- 監査対象元問題: **160/160**
- 各元問題: `coreSkill` + **異なる類題4問**
- source-specific bank 合計: **160**
- 類題合計: **640**
- `guidedSolutions.json` の `takeaway.pattern` と `remediation.ts` の `coreSkill` を1対1同期
- A=60 / B=70 / C=75 の学習設計を維持

## 自動監査

- `npm run audit:core-skill`: **PASS (160/160)**
- `npm run audit:remediation-content`: **PASS (160 banks / 640 questions)**
- `npm run audit:remediation`: **PASS**
- `npm run syntax-check`: **PASS (48 TS/TSX)**
- `npm run verify-critical`: **PASS**
- `npm run test:v0178-required20`: **PASS**
- その他 package.json に登録された非build系テスト: **すべてPASS**

## v0.17.8で確認・修正した主な項目

- 類題の現在位置と連続正解を元問題単位で永続化
- 同一類題の重複正解を4連続に数えない
- 再誤答時は補強進捗をリセット
- Homeへ戻っても2/4等の未完了補強を保持
- Guided Solutionの埋め草入力を拒否
- 必須年度の未解決課題を任意の旧年度より優先
- 任意旧年度を必須ETAから除外
- A≤B≤CのETA単調性
- 160元問題すべてに専用中心技能bank
- 640類題すべてにprompt/answer/explanationを保持
- 2024公式正答のpreflight誤記を修正

## 未解消の実行環境制約

`npm run build` は、このコンテナ内の `node_modules` が不完全で、React/Babel等の型定義本体が欠落しているため `tsc -b` で停止する。
一方、ソース監査・critical verification・runtime回帰テストはすべてPASSしている。

したがって、**ソース修正・160/160中心技能実装・登録済み回帰テストは完了**。
ただし「このコンテナで本番build成功」という条件だけは環境依存で未確認。
