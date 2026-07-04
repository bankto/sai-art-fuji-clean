# research-site

Phase 2 のリサーチまとめサイトです。ブラウザ表示時に Google Apps Script の中継APIから Google スプレッドシートのデータを取得し、全事例をカード一覧で表示します。

## データソース

正のデータソースは以下の Google スプレッドシートです。サイトは公開CSVをブラウザから直接 `fetch` せず、Apps Script Web App を中継してJSONを取得します。

https://docs.google.com/spreadsheets/d/1YJvTTgZVr9lKFffyKpsqkbbNWuNzyMDlao0iZhgF8t0/export?format=csv&gid=0

現在の想定列は以下の5列です。

- `国&地域`
- `タイトル`
- `URL`
- `概要`
- `カテゴリ`

`docs/research/` のMarkdownから直接サイトを生成しません。サイト側でも、シートに無い事実は書き足しません。

補足:

- `URL` に `|` 区切りで複数URLが入っている場合は、出典リンクを複数表示します。
- 将来 `検証状態` 列が戻った場合は、値がある行だけカード上に表示します。
- 欠損行や一部空欄があっても、空欄表示として扱い、全体の生成は止めません。
- ページ表示時と「再取得」ボタン押下時に中継APIからデータを取得します。表示中は5分ごとに自動再取得します。
- 検索・絞り込みUIは持たず、取得した全件をそのまま表示します。
- サムネイルは各カードの最初の出典URLから OGP image / Twitter image の取得を試みます。ブラウザのCORS制約などで取得できない場合はプレースホルダを表示します。

## Apps Script 中継API

公開CSVをGitHub Pages上のブラウザから直接取得すると、Google側の認証状態やCORSヘッダの影響で失敗することがあります。そのため、Apps Script Web App を中継APIとして公開し、サイトはそのURLからJSONを読みます。

中継APIのコードは `research-site/apps-script/Code.gs` にあります。

初回設定:

1. Google Apps Script で新規プロジェクトを作成する
2. `research-site/apps-script/Code.gs` の内容を貼り付ける
3. Deploy → New deployment → Web app を選ぶ
4. Execute as を `Me`、Who has access を `Anyone` にする
5. 初回承認を完了し、Web app URL `/exec` をコピーする
6. GitHub の Repository Settings → Secrets and variables → Actions → Variables に `RESEARCH_SITE_DATA_API_URL` を追加し、Web app URLを入れる
7. GitHub Actions の `Deploy research site to GitHub Pages` を再実行する、または `main` にpushする

ローカルで確認する場合は、ビルド時に同じ環境変数を指定します。

PowerShell:

```powershell
cd research-site
$env:RESEARCH_SITE_DATA_API_URL="https://script.google.com/macros/s/XXXX/exec"
npm run build
```

macOS/Linux:

```bash
cd research-site
RESEARCH_SITE_DATA_API_URL="https://script.google.com/macros/s/XXXX/exec" npm run build
```

## ビルド方法

Node.js 18 以上で実行します。外部依存はありません。ビルドは `src/` を `dist/` へコピーし、`RESEARCH_SITE_DATA_API_URL` があれば `index.html` に中継API URLを埋め込みます。シートのデータ本体は埋め込みません。

```bash
cd research-site
npm run build
```

生成結果は `research-site/dist/` に出力されます。

- `dist/index.html`: 閲覧用HTML
- `dist/styles.css`: スタイル
- `dist/app.js`: データ取得・カード描画用JS

## GitHub Pages 公開

このリポジトリでは GitHub Actions で GitHub Pages にデプロイします。

- workflow: `.github/workflows/pages.yml`
- build working directory: `research-site/`
- build command: `npm run build`
- deploy target: `research-site/dist/`

`main` ブランチへ `research-site/**` または `.github/workflows/pages.yml` の変更を push すると、Actions が `research-site/` でビルドし、`research-site/dist/` を Pages artifact としてアップロードしてデプロイします。手動実行は GitHub Actions の `Deploy research site to GitHub Pages` から `workflow_dispatch` で実行できます。

初回だけ GitHub 側で以下を確認してください。

1. Repository Settings → Pages を開く
2. Build and deployment の Source を `GitHub Actions` にする
3. Actions の実行権限と Pages のデプロイ権限が有効になっていることを確認する

GitHub Pages の project page、つまり `https://<user>.github.io/<repo>/` でも動くように、HTML内のCSS/JS参照は `./styles.css` と `./app.js` の相対パスのままにしています。base path の追加設定は不要です。

## シート更新後の反映

1. Google スプレッドシートを更新する
2. Apps Script中継APIが更新後のシートを読めることを確認する
3. ページを再読み込みする、または画面の「再取得」ボタンを押す

データ更新だけなら再ビルドや再デプロイは不要です。HTML/CSS/JSを変更した場合だけ push して GitHub Actions で再デプロイします。

ページ上で `データを取得できませんでした` と表示される場合は、Apps Script Web App URL、Web Appのアクセス権限、GitHub Actions Variable `RESEARCH_SITE_DATA_API_URL` を確認してください。`中継APIのURLが未設定です` と表示される場合は、GitHub Actions Variable が未設定、または再デプロイ前の状態です。
