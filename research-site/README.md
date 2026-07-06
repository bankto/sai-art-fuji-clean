# research-site

Phase 2 の「技術調査とリサーチ」サイトです。ブラウザ表示時に Google Apps Script の中継APIから Google スプレッドシートのデータを取得し、全事例をカード一覧で表示します。

サイト本体は以下の3ファイルです。Vanilla HTML/CSS/JavaScriptのみで、npm buildや外部パッケージは使いません。

- `index.html`
- `styles.css`
- `app.js`

## データソース

正のデータソースは以下の Google スプレッドシートです。サイトは公開CSVをブラウザから直接 `fetch` せず、Apps Script Web App を中継してJSONを取得します。

https://docs.google.com/spreadsheets/d/1YJvTTgZVr9lKFffyKpsqkbbNWuNzyMDlao0iZhgF8t0/export?format=csv&gid=0

現在の想定列は以下です。

- `国&地域`
- `タイトル`
- `URL`
- `概要`
- `選定理由`
- `カテゴリ`

`docs/research/` のMarkdownから直接サイトを生成しません。サイト側でも、シートに無い事実は書き足しません。

補足:

- `URL` に `|` 区切りで複数URLが入っている場合は、出典リンクを複数表示します。
- `概要` と `選定理由` は別フィールドとしてカード上に表示します。`選定理由` が空欄の場合は表示しません。
- 欠損行や一部空欄があっても、空欄表示として扱い、全体の生成は止めません。
- ページ表示時と「再取得」ボタン押下時に中継APIからデータを取得します。表示中は5分ごとに自動再取得します。
- 検索・絞り込みUIは持たず、取得した全件をそのまま表示します。

## Apps Script 中継API

公開CSVをGitHub Pages上のブラウザから直接取得すると、Google側の認証状態やCORSヘッダの影響で失敗することがあります。そのため、Apps Script Web App を中継APIとして公開し、サイトはそのURLからJSONを読みます。

中継APIのコードは `research-site/apps-script/Code.gs` にあります。

APIレスポンスは以下の形式です。

```json
{
  "ok": true,
  "generatedAt": "2026-07-05T12:00:00.000Z",
  "records": [
    {
      "id": "case-1",
      "title": "FREITAG",
      "summary": "事例の概要文（1〜2文）",
      "selectionReason": "選定理由の本文",
      "region": "スイス",
      "category": "ブランド・製品",
      "verificationStatus": "公式確認済",
      "urls": [{ "raw": "https://www.freitag.ch/", "href": "https://www.freitag.ch/" }]
    }
  ]
}
```

初回設定:

1. Google Apps Script で新規プロジェクトを作成する
2. `research-site/apps-script/Code.gs` の内容を貼り付ける
3. Deploy → New deployment → Web app を選ぶ
4. Execute as を `Me`、Who has access を `Anyone` にする
5. 初回承認を完了し、Web app URL `/exec` をコピーする
6. GitHub の Repository Settings → Secrets and variables → Actions → Variables に `RESEARCH_SITE_DATA_API_URL` を追加し、Web app URLを入れる
7. GitHub Actions の `Deploy research site to GitHub Pages` を再実行する、または `main` にpushする

ローカルで `index.html` を直接開くと、API URL未設定時のプレビュー用ダミーデータが表示されます。本番ではGitHub Actionsが `__RESEARCH_SITE_DATA_API_URL__` を置換します。

## GitHub Pages 公開

このリポジトリでは GitHub Actions で GitHub Pages にデプロイします。

- workflow: `.github/workflows/pages.yml`
- source files: `research-site/index.html`, `research-site/styles.css`, `research-site/app.js`
- deploy target: Actions内で作成する `public/`

`main` ブランチへ `research-site/index.html` / `research-site/styles.css` / `research-site/app.js` / `research-site/apps-script/**` / `.github/workflows/pages.yml` の変更を push すると、Actions が3ファイルを `public/` にコピーし、`index.html` 内の `__RESEARCH_SITE_DATA_API_URL__` を Repository Variable `RESEARCH_SITE_DATA_API_URL` で置換してから Pages artifact としてアップロードします。手動実行は GitHub Actions の `Deploy research site to GitHub Pages` から `workflow_dispatch` で実行できます。

初回だけ GitHub 側で以下を確認してください。

1. Repository Settings → Pages を開く
2. Build and deployment の Source を `GitHub Actions` にする
3. Repository Settings → Secrets and variables → Actions → Variables に `RESEARCH_SITE_DATA_API_URL` を設定する
4. Actions の実行権限と Pages のデプロイ権限が有効になっていることを確認する

GitHub Pages の project page、つまり `https://<user>.github.io/<repo>/` でも動くように、HTML内のCSS/JS参照は `./styles.css` と `./app.js` の相対パスのままにしています。base path の追加設定は不要です。

## シート更新後の反映

1. Google スプレッドシートを更新する
2. Apps Script中継APIが更新後のシートを読めることを確認する
3. ページを再読み込みする、または画面の「再取得」ボタンを押す

データ更新だけなら再デプロイは不要です。HTML/CSS/JSを変更した場合だけ push して GitHub Actions で再デプロイします。

ページ上で `データを取得できませんでした` と表示される場合は、Apps Script Web App URL、Web Appのアクセス権限、GitHub Actions Variable `RESEARCH_SITE_DATA_API_URL` を確認してください。`中継APIのURLが未設定です` と表示される場合は、GitHub Actions Variable が未設定、または再デプロイ前の状態です。
