# IMPLEMENTATION REVIEW — v0.8

v0.7をさらに実装レベルで精査し、修整後に2回連続で「修整箇所なし」となるまで確認しました。

## 第1回精査
修整あり。

### 同期中のlocalStorage上書き競合
`syncHistoryFiles()` が同期開始時のスナップショットをGitHubとマージした後、`replaceAttempts()` / `replaceExamScores()` でlocalStorage全体を置き換えていました。

この間に同じ端末で新しい解答や過去問得点が追加されると、その新規記録が置換で消える可能性がありました。

修整：
- GitHubとのマージ結果を保存する直前に `loadAttempts()` / `loadExamScores()` を再読込
- 「現在local + GitHub merge結果」を再マージして保存
- 同期実行中の新規記録を保持

## 第2回精査
修整あり。

### 同期中の目標点変更・履歴リセット競合
同期開始後に同じ端末で目標点変更や履歴リセットを行った場合、終了時の古いprofile情報が新しいlocal設定を上書きする可能性がありました。

修整：
- final Profile PUTの各retry時に `loadPreferences()` と `loadSyncMeta()` を再読込
- remote / sync開始時 / 現在local の3者から最新preferencesを選択
- resetVersionも現在localを含めてmaxを取得
- Profile PUT後にも最新local preferenceを再確認し、新しいlocal値を上書きしない

## 第3回精査
修整あり。

### 「正解」表示後・「次へ」前の再読込で二重加点
大問1は正解判定した瞬間にattemptとcorrectCountを保存し、問題queueから外すのは「次へ」押下時でした。
この間にページを再読込すると、同じ問題が再表示されつつcorrectCountだけ増えており、再正解で二重加点できる状態でした。

修整：
- `submit` は正誤表示だけ
- attempt保存・正解/不正解カウント・queueからの除去を「次へ」で一体的に実施
- 大問2〜5も同様に、結果表示だけではattemptを確定しない

## 第4回精査
修整あり。

### 古いオフライン端末からの「履歴リセット」意図
単純な `resetVersion + 1` では、古い端末のversionがremoteより小さい場合、その端末で行った新しいリセットがremoteの大きなversionに負ける可能性がありました。

修整：
- resetVersion更新を `max(current + 1, Date.now())`
- 通常の端末時計範囲では、古い端末から行った新しいリセットも過去世代より前進

注：端末時計が大幅に過去へずれている特殊環境では完全な分散順序保証ではありません。個人利用MVPとしての現実的な対策です。

## 第5回精査
修整箇所なし。

確認：
- CORS互換header
- PAT sessionStorage限定
- Private Repository/branch確認
- SHA/409 retry
- 不要PUT抑制
- UUID系record ID
- 同期中の新規attempt保持
- 同期中の新規exam score保持
- 同期中のpreferences変更保持
- 同期中のreset保持
- dirty revision race保護
- daily progress巻き戻し抑制
- submit/next間の二重加点防止
- resetVersion stale端末対策

## 第6回精査
修整箇所なし。

想定シナリオ：
- PCで同期開始中に別タブで問題を解く
- 同期中に目標70→75へ変更
- 同期中に履歴リセット
- 正解表示後にブラウザ再読込
- PC/スマホ同時PUTで409
- 古いスマホがオフラインで履歴リセット後に再接続
- 今日の8問途中で端末を切替
- 過去月データに変更がない同期
- PATがブラウザ終了で消える

第5回・第6回の2回連続で修整箇所なしとなったため、今回の精査を終了しました。

## 自動確認
`npm run self-check` を拡張し、今回の競合修整も静的に検査します。

## 未実地確認
この環境では実GitHub PAT/Private Repositoryを利用できないため、本物のRepositoryに対するPUT・CORS・409の実地試験は未実施です。
React/Vite依存パッケージのオンライン取得もこの環境では完了しないため、本番buildは未実施です。
