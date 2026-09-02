# WaseShibu Math 70 — v0.17.12

早稲田渋谷シンガポール校の数学対策用に作成した非公式の学習用Webアプリです。

## 現在の保存方式

学習データは通常利用時、ブラウザの `localStorage` に保存されます。GitHubアカウント、Private Repository、PAT、GitHub REST APIへの接続は学習機能に必要ありません。

```text
数学Webアプリ
  ↓
localStorage
  ↓
JSON Export / Import
  ↓
復元ポイント
```

旧バージョンのGitHub学習履歴同期機能は、v0.17.12で数学アプリ本体から分離しました。過去の同期設定や同期メタデータがブラウザに残っていても自動削除せず、通常利用では参照しません。

## データ保護

- アプリバージョン：`0.17.12`
- 学習データ形式：`6`（v0.17.11から変更なし）
- 既存の学習用localStorageキーを維持
- `deviceId` / `resetVersion` は既存データ互換のため維持
- 学習データ形式を変えていないため、この変更専用のmigrationは追加しない
- 更新前バックアップ、復元ポイント、Safety Mode、version protectionを維持
- JSON Export / Import の replace / merge を維持

## GitHubの用途

GitHubは次の用途にのみ使用します。

- ソースコード管理
- GitHub PagesによるWebアプリ配信

利用者の学習履歴をGitHubへ読み書きする機能は製品コードに含めません。

## 旧 `/sync` URL

過去のブックマーク互換のため `/sync` は残していますが、GitHub同期画面ではなく `/data` と同じデータ管理画面を表示します。通常ナビゲーションには同期項目を表示しません。

## ローカル起動

```bash
npm install
npm run dev
```

## 検証

```bash
npm run self-check
npm run verify-critical
npm run build
```

`npm run build` ではユーザ視点回帰テスト、TypeScript/Vite buildに加え、GitHub同期専用コード・文字列が製品ソースとproduction bundleへ残っていないことを監査します。同期専用CSS、旧同期README表現、同期版を示すpackage名の再混入も検出対象です。

## GitHub Pages

`.github/workflows/deploy.yml` を使用します。既存の公開URLとoriginを維持することで、ブラウザ内の既存学習履歴を引き継げる前提を守ります。

## 検索エンジン

本アプリはURLを知っている利用者向けの運用方針で、`noindex` と `robots.txt` の検索除外設定を維持します。

## 過去問データ

公開してよいデータだけをRepositoryへ置き、非公開対象の学校公式本文・音源・ロゴ・Privateデータ・APIキー等は公開しません。

## ライセンス

アプリコードはMIT Licenseです。
