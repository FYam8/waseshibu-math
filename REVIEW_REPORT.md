# v0.17.8 REVIEW REPORT

## 基準
- v0.17.7 を起点にしたパッチ
- 学習目標 A=60 / B=70 / C=75 は不変
- dataVersion 6
- 既存 localStorage を削除しない非破壊更新

## 修正対象
1. 類題 2/4 の途中リロードで出題位置が戻る
2. Home に類題再開導線がない
3. 元問題と類題の中心発想が一致しない
4. Guided STEP を無関係入力で突破できる
5. 2025/2026 の途中年度が必須弱点修正を横取りする
6. 2019〜2023 任意演習が必須 ETA を膨らませる

## 追加で確認した完成条件
- 初見スコア / 参考スコア判定を維持
- A/B/C 切替では履歴を削除しない
- 2025/2026 は未露出年度を確認年度として優先可能
- 2019〜2023 は任意演習と補強予約を分離
- 2019/2020 由来の学習内容に三平方の定理を主解法として持ち込まない
- 公式正答 critical 値を固定検証
- 「未解決」表記を維持
- package / lock / UI version を 0.17.8 へ統一

## データ保護
- migration 前の raw localStorage backup を保存
- migration 失敗時は best-effort rollback
- Guided Review 旧形式は残し、新形式を派生作成
- 類題進捗を export/import 対象に追加
- 類題進捗の restore validation を追加
- 目標変更は preferences のみを書き換え、答案・得点・Guided・類題・mastery・年度露出を削除しない

## 監査
- 全160元問題に source-specific coreSkill bank
- 各4類題、計640類題
- 2024-Q1-2 は三角柱・柱体の表面積の中心技能へ固定
- 今日の必須課題は最大10件・1問単位
- 2019〜2023の任意年度通しは必須キュー/ETAから分離


## 精査ループで追加修正した点
- v5以前の `practiceStreak` は、旧不具合により同じ類題の再正解を含む可能性があるため、Guided履歴としては保持するが、v6の「4つの異なる類題」mastery証明には流用しない。v6類題進捗は安全側の0/4から開始する。
- 類題進捗のリセット条件を「新しい未解決の元問題attempt」に限定し、新しい正解attemptだけでは既存の4/4や途中進捗を消さない。
- 上記2点を migration / remediation progress / required20 の回帰テストへ追加した。

## 公開前に必要
- `npm run build`
- `npm run test:v0178:all`
- 実ブラウザで同一条件のユーザー視点テストを2周連続0件
- GitHub Pages の配信物が v0.17.8 であることを確認
