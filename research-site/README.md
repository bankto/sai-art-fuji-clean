# research-site

Phase 2 のリサーチまとめサイトです。ブラウザ表示時に Google スプレッドシートの公開CSVを取得し、検索・絞り込みができる静的ページとして表示します。

## データソース

正のデータソースは以下の公開CSVです。

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
- ページ表示時と「再取得」ボタン押下時にCSVを取得します。表示中は5分ごとに自動再取得します。
- サムネイルは各カードの最初の出典URLから OGP image / Twitter image の取得を試みます。ブラウザのCORS制約などで取得できない場合はプレースホルダを表示します。

## ビルド方法

Node.js 18 以上で実行します。外部依存はありません。ビルドは `src/` を `dist/` へコピーするだけで、CSVデータは埋め込みません。

```bash
cd research-site
npm run build
```

生成結果は `research-site/dist/` に出力されます。

- `dist/index.html`: 閲覧用HTML
- `dist/styles.css`: スタイル
- `dist/app.js`: 検索・絞り込み用JS

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
2. 公開CSVに更新が反映されたことを確認する
3. ページを再読み込みする、または画面の「再取得」ボタンを押す

データ更新だけなら再ビルドや再デプロイは不要です。HTML/CSS/JSを変更した場合だけ push して GitHub Actions で再デプロイします。

ページ上で `CSVを取得できませんでした` と表示される場合は、スプレッドシートの共有またはウェブ公開設定でCSVを匿名アクセスできない状態、またはブラウザのCORS制約で取得できない状態です。公開CSV URLをブラウザのシークレットウィンドウで開ける状態にしてから再読み込みしてください。
