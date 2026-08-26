# WaseShibu Math 70 — v0.7 最終精査済みGitHub同期版

早稲田渋谷シンガポール校の2019〜2026年度数学過去問を、問題本文の再配布ではなく「出題構造・技能・得点戦略」として整理した非公式の学習用Webアプリです。

## GitHubだけで端末間同期

- GitHub Pages：Webアプリ本体
- GitHub Private Repository：学習データ
- GitHub REST API：端末間同期
- localStorage：学習データの即時・オフライン保存
- sessionStorage：fine-grained PAT（ブラウザを閉じると消える）
- 409 Conflict：最新版を再取得してマージ後に再PUT
- ブラウザCORS互換：`X-GitHub-Api-Version` を送らず、GitHubの既定サポートAPI versionを利用
- 同期中に新規学習データが増えた場合、未同期フラグを誤って消さないrevision管理
- 解答履歴：UUID系の一意IDで和集合マージ
- 履歴削除：resetVersionで古い端末からの復活を防止
- 解答履歴：月別JSON
- 日次進捗：完了数を優先してマージし、時計ずれによる巻き戻しを抑制
- 同期時に内容が変わらない月はPUTせず、不要なcommitを作らない

## GitHub構成

```text
Public Repository
└─ waseshibu-math
   └─ GitHub Pages

Private Repository
└─ waseshibu-math-sync
   └─ data/
      ├─ profile.json
      ├─ past-exams.json
      ├─ attempts/
      │  └─ YYYY-MM.json
      └─ daily/
         └─ YYYY-MM.json
```

## 初回セットアップ

1. GitHubで同期専用Private Repository（例：`waseshibu-math-sync`）を作ります。
2. **READMEを追加して初期化**し、`main` ブランチを作ってください。
3. fine-grained personal access tokenを作成します。
4. Repository accessを **Only select repositories** にして同期Repositoryだけを選択します。
5. Repository permissionsは **Contents: Read and write** にします。
6. Webアプリの「端末間同期」でユーザー名・Repository名・PATを入力します。
7. 「接続テスト」→「今すぐ同期」を実行します。
8. 別端末でも同じRepositoryを指定し、そのブラウザセッションでPATを入力して同期します。

## PATの扱い

v0.6ではPATをlocalStorageへ永続保存しません。`sessionStorage` のみに保存します。
GitHub Pagesは同一の `github.io` origin配下で他のページを運用することがあるため、ブラウザへ長期保存する秘密情報を減らす設計にしています。

## 同期競合

Repository Contents APIで更新時に必要なSHAを使用します。
409 Conflictが発生した場合、最新版をGET → マージ → 再PUTを最大3回行います。

## リセット

練習履歴や過去問得点を削除したときは`resetVersion`を上げます。
古い端末のデータは、そのversionより古ければ再同期時に復活させません。
同期途中に別端末でリセットが起きた場合も、最終Profile確認後にもう一度履歴を掃除します。

## オフライン

解答はまず端末内へ保存されます。ネット接続がなくても練習できます。
GitHub同期は「今すぐ同期」でまとめて行います。

## ローカル起動

```bash
npm install
npm run dev
```

## ビルド

```bash
npm run build
```

## GitHub Pages

`.github/workflows/deploy.yml` を同梱しています。
GitHubで **Settings → Pages → Source: GitHub Actions** に設定してください。

## セキュリティ上の位置づけ

この方式は**個人が自分のPC・iPad・スマホで使う用途向け**です。
不特定多数の利用者にPATを入力させる公開サービスには向きません。

## 過去問データ

過去問PDF・学校の問題本文・公式解答そのものはRepositoryへ保存しません。
過去問分析メタデータと自作類題のみを利用します。

## ライセンス
アプリコードはMIT Licenseです。


## ブラウザからGitHub APIを呼ぶ際の注意

GitHub REST API自体はCORSをサポートしていますが、ブラウザのpreflightで許可されるrequest headersには
`Authorization` と `Content-Type` などが含まれる一方、`X-GitHub-Api-Version` は含まれません。
そのためv0.7ではブラウザからそのversion headerを送らず、GitHubの既定API versionを利用します。
