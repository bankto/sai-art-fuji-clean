# 進行状況ダッシュボード

最終更新: 2026-07-05

## 現在のフェーズ

**Phase 1: リサーチ**(進行中・本格モード) / **Phase 2: まとめサイト**(進行中)

## フェーズ進捗

| フェーズ | 担当 | 状態 | 成果物 | メモ |
|---|---|---|---|---|
| 1. リサーチ | Claude Code + Codex(並走) | 進行中 | `docs/research/2026-07-02_廃棄物クリエイティブ事例/`(主) + `_codex/`(並走) | 本格モード。03完了、01/02への反映済み。`04_decision.md` / `05_next_actions.md` 初版と seed CSV 作成済み。残り: シート反映→必要なら境界線上事例を追加 |
| 2. まとめサイト | Codex | 進行中 | `research-site/` + `.github/workflows/pages.yml` | 添付デザイン3ファイルを本体化。ActionsでAPI URLを置換してGitHub Pagesへ静的配信する構成へ変更済み |
| 3. アイデア出し | 任意のAI | 未着手 | - | |
| 4. 仕様書作成 | Codex / Claude Code | 未着手 | - | |
| 5. 実装 | Codex / Claude Code | 未着手 | - | |

状態: 未着手 / 進行中 / レビュー待ち / 完了

## 直近のアクション

- [x] リサーチテーマを決める(廃棄物×クリエイティブ事例、本格モード)
- [x] ブリーフ(`00_brief.md`)をユーザーが承認(2026-07-03)
- [x] 収集R1: 広域34件+ニッチ10件+補欠昇格4件を `01_raw_sources.md` に統合
- [x] 収集R2(ユーザー指示): hunter海外重点38件+ニッチ深掘り10件を統合(計96エントリ・実質92事例)
- [x] 一次情報の検証 #1〜16(official-source-researcher 第1パス、30事実)
- [x] 一次情報の検証 #17〜36(official 第2パス、27事実。計36項目=Yes17/部分14/No5)
- [x] 分析(`02_analysis.md`)完了(Claude版: 10類型・92事例 / Codex版: 11パターン・約85事例)
- [x] Codex 並走トラック完走(`_codex/` フォルダ、独立収集・分析)
- [x] 両トラックの突き合わせ(`02b_crosscheck.md`): 重なり26件・食い違い7件を特定
- [x] 検証(`03_fact_check.md`): 完走(02b_crosscheck の食い違い7件 + 公式候補10件の現行性確認まで完了)
- [x] 検証指摘の反映: 01/02 の要修正箇所(FREITAG数値・El Anatsui表記・02の三分法化など)を修正
- [x] 判断材料の整理: `04_decision.md` / `05_next_actions.md` の初版を作成
- [ ] 判断(`04_decision.md`): 採用事例の範囲・境界線上の事例(工業材料系など)の採否をユーザーが決定
- [x] CSV生成(Cursor): 採用事例を「国&地域 / タイトル / URL / 概要 / カテゴリ / 検証状態」でCSV化（`2026-07-04_採用事例一覧_seed.csv`）
- [x] シート反映(ユーザー): Google スプレッドシートにCSVをインポート(今回の実装は公開CSVを正として進行)
- [x] Phase 2 着手(`/research-site`): シートをDBとした一覧サイトを構築
- [x] Phase 2 初期構築: `research-site/` にCSV取得・検索/絞り込みUI・READMEを作成
- [x] Phase 2 要件変更対応: ビルド時取得ではなく、ブラウザ表示時に公開CSVを取得する方式へ変更。カード一覧、サムネイル自動取得試行、5分間隔の自動再取得を追加
- [x] Phase 2 GitHub Pages公開対応: `.github/workflows/pages.yml` を追加し、`research-site/index.html` / `styles.css` / `app.js` をActions内の `public/` にコピーしてGitHub Pagesへデプロイする構成にした
- [x] Phase 2 公開サイト取得エラー切り分け: 公開CSVへの直接HTTP確認は401かつCORS許可ヘッダなし。GitHub Pages上のブラウザfetchでは失敗しうるため、直接CSV fetchを廃止
- [x] Phase 2 中継API対応: `research-site/apps-script/Code.gs` を追加し、Apps Script Web Appがシートを読みJSON/JSONPを返す構成を用意。サイト側は `RESEARCH_SITE_DATA_API_URL` から中継API URLを受け取り、カード一覧へ流し込む
- [x] Phase 2 UI仕様変更: キーワード検索、国・地域フィルタ、カテゴリフィルタ、絞り込み解除を削除。取得後は全件をカード一覧で表示し、再取得と最終取得表示だけを残す
- [x] Phase 2 本番仕上げ: 添付デザインの `index.html` / `styles.css` / `app.js` を `research-site/` 直下の本体にし、npm build不要の3ファイル構成へ変更。GitHub Actionsで `RESEARCH_SITE_DATA_API_URL` を置換してPagesへ配信する方式に整理
- [x] Phase 2 GASレスポンス調整: `research-site/apps-script/Code.gs` を `ok` / `generatedAt` / `records` 形式に合わせ、`records[]` は `id` / `title` / `summary` / `region` / `category` / `urls` を返すよう更新
- [ ] Phase 2 実データ取得確認: Apps Script Web Appをデプロイし、GitHub Actions Variable `RESEARCH_SITE_DATA_API_URL` にURLを設定後、公開サイトで取得確認する
- [x] Phase 2 GitHub Pages本番確認: GitHub Pagesへのデプロイ成功を確認済み(ユーザー報告)。残る問題は公開サイト上のデータ取得

## 決定事項ログ

AI間の委譲・レビューのラウンドもここに記録する(誰が・何を・何ラウンド)。

| 日付 | 決定内容 | 理由 |
|---|---|---|
| 2026-07-02 | プロジェクト構成を作成 | 初期セットアップ |
| 2026-07-02 | 役割分担を設定(Cursor=オーケストレーター、Codex=作成、Claude Code=レビュー) | マルチAI体制の整理 |
| 2026-07-03 | リサーチ収集の候補は極力残す(補欠候補も本編に昇格して収録) | ユーザー指示。網羅・保全を絞り込みより優先 |
| 2026-07-03 | 同一ブリーフで Codex 並走トラックを実施(マルチベンダー比較) | 単一モデルのバイアス検出。結果は相補的(Claude=アート/地域、Codex=プロダクト/素材) |
| 2026-07-03 | 統合方針: Claude 版フォルダを正とし、検証・判断後に Codex 採用分を追記 | 02b_crosscheck.md 参照 |
| 2026-07-03 | まとめサイトは Google スプレッドシートをDBにする(fact-check完走 → 04判断 → CSV生成 → ユーザーがシートへインポート → サイト構築の順) | ユーザー決定。シートは人間も編集できる公開用DB、md は調査の完全記録として役割分担 |
