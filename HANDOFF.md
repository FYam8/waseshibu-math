# v0.17.8 HANDOFF

このソースは v0.17.7 からの非破壊パッチ候補です。

## バージョン
- app/package: 0.17.8
- dataVersion: 6

## 重要な保存データ
attempts / preferences / daily / exam scores / exam drafts / learning route /
Guided Review / Guided Progress / remediation progress / prep / daily plans を削除しないこと。

## 類題
`waseshibu-math-remediation-progress-v1` に元問題IDごとの
currentIndex / streak / attemptCount / correctQuestionIdsInCurrentStreak /
sourceAttemptAt / status / updatedAt を保存します。
同一問題の再正解は streak を進めません。新しい元問題誤答は 0/4 に戻します。

## ルーティング
必須の未解決元問題 > 進行中類題・補強 > 確認年度 > 任意年度ドラフト。
2019〜2023の通し演習は任意枠で、主確認得点と必須ETAを上書きしません。

## 初見判定
警告画面だけでは露出にしません。
問題本体を表示した時点で露出記録を作ります。
同一の初回受験ドラフトを途中保存・再開した場合は firstLookEligible を保持します。
過去に別機会で露出済みなら reference 扱いです。

## テスト
- `npm run test:v0178-required20`
- `npm run test:v0178-completeness`
- `npm run test:v0178:all`
- `npm run build`

公開判定は、build成功に加え、実画面ユーザー視点テストをコード・データ・条件を変えず2周連続で0件にした場合のみ行ってください。


## v0.17.8 最終精査での追加安全策
- 旧practiceStreakは履歴として保持するが、v6のdistinct-question masteryへは認定しない。
- 類題進捗の再開リセットは、新しい未解決（wrong/unanswered）元問題attemptでのみ発生し、正解attemptだけでは消さない。
