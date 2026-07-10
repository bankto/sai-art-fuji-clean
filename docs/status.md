# 進行状況ダッシュボード

最終更新: 2026-07-10（1件目デモ 実装レビューShould反映）

## 現在のフェーズ

**Phase 5: 実装**(1件目デモ: ソフトウェア完了・レビューShould反映済み / 実機確認待ち)

## フェーズ進捗

| フェーズ | 担当 | 状態 | 成果物 | メモ |
|---|---|---|---|---|
| 1. リサーチ | Claude Code + Codex(並走) | 完了 | `docs/research/2026-07-02_廃棄物クリエイティブ事例/`(主) + `_codex/`(並走) | 本格モード完走。収集・分析・検証・判断材料整理・seed CSV まで完了。ユーザー判断により Phase 3 へ進行(2026-07-06) |
| 2. まとめサイト | Codex | 完了 | [公開サイト](https://bankto.github.io/sai-art-fuji-clean/) / `research-site/` + `.github/workflows/pages.yml` | GitHub Pages デプロイ済み。ユーザー判断により Phase 3 へ進行(2026-07-06) |
| 3. アイデア出し | Cursor 指揮(Claude Code 発散 / Codex 整形) | 完了(壁打ち終了) | `docs/decisions/2026-07-06_技術ベース確定.md` | 技術ベース9種+体験の芯3本確定。壁打ち30+案。2026-07-10 ユーザー判断で一旦終了→検証用デモ2本へ |
| 4. 仕様書作成 | Cursor 指揮(Codex 作成 / Claude Code レビュー) | 完了 | `docs/specs/2026-07-10_camera-ar-gomi-demo.md` + レビュー | ユーザー承認(2026-07-10)で確定。M2までを初回実装範囲に |
| 5. 実装 | Cursor 指揮(Codex 実装 / Claude Code レビュー) | 完了(ソフト) | `apps/camera-ar-gomi-demo/` | M1〜M3 実装済み。実装レビューShould反映済み。M3.5実物試作・実機確認は未 |

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
- [x] 判断(`04_decision.md`): ユーザー判断によりリサーチ完了・Phase 3 へ進行(2026-07-06)
- [x] CSV生成(Cursor): 採用事例を「国&地域 / タイトル / URL / 概要 / カテゴリ / 検証状態」でCSV化（`2026-07-04_採用事例一覧_seed.csv`）
- [x] CSV生成(Codex): ニッチ技術照合33件を seed CSV と同一列・UTF-8 BOM付きCSVで出力（`2026-07-06_ニッチ技術照合事例一覧.csv`）
- [x] ニッチ抽出(Claude Opus): フル92事例から seed 非収録中心に33件抽出。選定理由を概要に含む（handoff: `2026-07-06_ニッチ抽出_handoff.md`）
- [x] Phase 3 技術ベース確定(ユーザー): ラズパイ/NFC/サーマル/UV・レーザー/重量センサー/LED/触覚UI/複数端末連携/映像同期（`docs/decisions/2026-07-06_技術ベース確定.md`）
- [x] Phase 3 体験の芯3本確定(ユーザー): ローカルマップ+GPS / カメラ+AIゴミ判別 / p5.js偶然性×規則性
- [x] Phase 3 壁打ち終了(ユーザー 2026-07-10): 検証用デモ2本を優先。1本目=カメラ認識×ARゴミデモ
- [ ] Phase 3 採用判断: 正式なアイデアシート化は見送り。デモ2本を直接仕様化
- [x] Phase 3 技術実現性調査: D2「カメラ+AIゴミ判別」拡張案として、スマホWebでの画像認識・Web AR・NFC・デバイス内音/画像生成の実現性を整理（`docs/research/2026-07-10_camera-ar-gomi-demo-feasibility.md`）
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
- [x] Phase 2 公開確認: [https://bankto.github.io/sai-art-fuji-clean/](https://bankto.github.io/sai-art-fuji-clean/) にデプロイ済み。ユーザー判断により Phase 2 完了・Phase 3 へ進行(2026-07-06)
- [x] Phase 3 壁打ち: リサーチ示唆を起点にアイデアを発散（Cursor/Codex/Claude Opus で30+案。技術ベース・体験の芯は部分確定）
- [x] 運用体制改定完了(2026-07-05): 全フェーズ共通のオーケストレーション体制へ改定。正本は `docs/workflows/orchestrate.md`、経緯は `docs/decisions/2026-07-05_全フェーズオーケストレーション改定.md`
- [x] README.md を人間向け運用マニュアルに再構成(2026-07-05): 人間タスクのフェーズ別一覧・iOS(Remote Control)運用手順・プロンプト集・AI利用Tips(別PC/セッション乗り換え/コンテキスト対処)を追加
- [x] 横展開テンプレート `D:\workspace\bankto\_templates\ai-dev-workflow` のレビューと改善反映(2026-07-06): 通知hookをワークスペース標準(ps1)に統一、robocopyコピー手順・スモークテスト・小規模案件ショートカット・版記録運用を追加。テンプレは git 管理開始(コミット `7fb97e4`)
- [x] テンプレ改善の逆輸入(2026-07-06): 自律実行/STOP条件・レビュー判定の機械読み・Git運用・作業報告(`docs/reports/`)・ハング対策・`docs/prompts.md` を本家に反映。経緯は `docs/decisions/2026-07-06_テンプレ改善の逆輸入.md`
- [x] マイルストーン粒度基準の追加(2026-07-06): 仕様書はマイルストーンを極力小さく分ける(1委譲で完了・単独で動作確認できる粒度・M1は最小の縦切り)を `spec.md` / `specs.mdc` / `spec-review.md` に追加。テンプレ側にも同内容を反映(コミット `d5f92f2`)
- [x] 横展開テンプレート完成(2026-07-06): モデル・effort 自動判断ルール(ユーザー追加分)もコミットし、テンプレ作りを一旦完了(最終コミット `3115845`、作業ツリー クリーン)

- [x] ニッチ技術照合CSV/研究サイト更新(2026-07-06): CSVを「概要」と「選定理由」分離の7列へ変更し、research-site/GASで選定理由・検証状態を表示対応
- [x] 選定理由の文体改訂(2026-07-06): 33件を口語・主観寄り2文に書き換え。CSVは6列（検証状態削除）。サイト名を「技術調査とリサーチ」に変更、ヘッダーに気になっている技術を表示
- [x] ニッチ技術照合CSVのURL列差し替え(2026-07-07): ファクトチェック済み指定に従い、該当7件のURL列のみ更新。修正ログ `2026-07-06_選定理由URL整合チェック.md` を追加
- [x] ニッチ照合CSV再編(2026-07-07): 藤クリーン再現可能性で33→15件。選定理由を実務寄りに書き直し、URLは1件化。経緯は `docs/decisions/2026-07-07_ニッチ照合CSV再編.md`
- [x] ニッチ照合15件の検証(Claude Code): 選定理由・FC・URL整合。判定=条件付き承認（OK10/要修正3/要差替2）。`2026-07-07_ニッチ照合15件_検証.md`
- [x] ニッチ照合15件の検証反映(Codex): 要対応5件をCSVへ反映（URL2・選定理由3）
- [x] research-site 表記修正・デプロイ(2026-07-07): 「UV・レーザー」→「UV・レーザープリンター」。commit `b51e4cb`、Pages Actions #28837594921 成功
- [x] 仕様書下書き(Codex): カメラ認識 × AR ゴミデモの仕様書を作成。`docs/specs/2026-07-10_camera-ar-gomi-demo.md`
- [x] 仕様書レビュー(Claude Code): `docs/reviews/2026-07-10_camera-ar-gomi-demo_review.md` を作成。判定=条件付き承認
- [x] 仕様書 Must 反映(Codex): レビュー Must 3件(+可能なら Should)を `docs/specs/2026-07-10_camera-ar-gomi-demo.md` へ反映
- [x] ユーザー確認(2026-07-10): 仕様確定・実装を問題ないところまで進めてよい → M2まで(URL/QR)を初回実装範囲、M2.5以降は後続
- [x] 実装 M2.5〜M3(Codex): NFC書き込み・AR画面・PWA・Pages workflow 更新
- [x] 作業報告 M2.5〜M3(Codex): `docs/reports/2026-07-10_camera-ar-gomi-demo_m2_5-m3.md`
- [x] 実装レビュー(Claude Code): `docs/reviews/2026-07-10_camera-ar-gomi-demo_implement_review.md` を作成。判定=条件付き承認
- [x] 実装レビュー Should 反映(Codex): カメラ拒否案内、アプリ内ブラウザ案内、PWA CACHE_NAME v4、README手順追記。lint/build成功
- [ ] 実機確認: GitHub Pages HTTPS でカメラ/NFC/AR（要 gomi-target.mind 生成）
- [ ] M3.5 実物試作: レーザー彫刻/印刷の人間作業（`public/ar-targets/README.md` 参照）

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
| 2026-07-05 | 全フェーズ共通のオーケストレーション体制へ改定(Cursor=指揮 / Codex=作成 / Claude Code=調査・検証・レビュー)。「Phase 1〜3 は任意のAI」を廃止 | ユーザー決定。Cursor Agents Window + iOS 遠隔運用のため。詳細: `docs/decisions/2026-07-05_全フェーズオーケストレーション改定.md`(実施: Claude Code、ルール改定作業として例外的に直接編集) |
| 2026-07-06 | Phase 1(リサーチ)・Phase 2(まとめサイト)を完了とし、Phase 3(アイデア出し)へ進行 | ユーザー判断。公開サイト: https://bankto.github.io/sai-art-fuji-clean/ |
| 2026-07-06 | 横展開テンプレの通知hookをワークスペース標準(`agent-alert.ps1` + グローバル設定)に統一。テンプレ改善の運用ルールを本家へ逆輸入(実施: Codex 2ラウンド、検証: Cursor) | ユーザー承認。二重通知の回避と運用の一元化。詳細: `docs/decisions/2026-07-06_テンプレ改善の逆輸入.md` |
| 2026-07-06 | Phase 3 技術ベース9種と体験の芯3本を確定。上層向け「選定理由」説明のためニッチ技術照合CSV(33件)を追加 | ユーザー指示。抽出: Claude Opus / CSV: Codex。詳細: `docs/decisions/2026-07-06_技術ベース確定.md` |
| 2026-07-09 | テンプレ更新を取り込み: テンプレ版 `3c269ed 2026-07-09`(D:\workspace\_templates\ai-dev-workflow)。通知hookをプロジェクト単位に一本化して復元(.agent-hooks / .cursor/hooks.json / .codex/hooks.json / Claude 雛形)、モデル・effort 自動判断+記録必須化、委譲ファースト、push・確立済みデプロイの自律化、セッション切り替え基準、ASCII slug ファイル名(新規分から)、orchestrator-judgment スキル同梱、Codex 委譲を --sandbox workspace-write に更新 | ユーザー指示(取り込み実施: Claude Code)。次回取り込みはこの版からの差分を見る |
| 2026-07-10 | Phase 3 壁打ちを一旦終了。検証用デモ2本を優先(1本目=カメラ認識×ARゴミデモ) | ユーザー判断 |
| 2026-07-10 | カメラ認識 × AR ゴミデモの仕様書下書きを作成(使用AI / モデル / effort: Codex / 既定 / xhigh) | ユーザー直接依頼。上流は技術ベース確定D2/D3と実現性調査。ステータスは下書きで、確定前にレビューとユーザー確認が必要 |
| 2026-07-10 | 技術実現性調査(カメラ認識×ARゴミデモ)を追加(使用AI / モデル / effort: Claude Code / 既定 / —) | 仕様化前のハードル評価。第三者fact-checkは未実施 |
| 2026-07-10 | 仕様書レビュー完了(使用AI / モデル / effort: Claude Code / 既定(Fable 5) / —)。判定=条件付き承認 | Must 3件: NFCマイルストーン矛盾・シード再現性定義・HTTPS配信手段。Codex 反映後にユーザー確認(M2/M3・NFC/QR) |
| 2026-07-10 | 仕様書確定・初回実装範囲=M2まで(URL/QR)。M2.5(NFC)/M3(AR)/M3.5(彫刻)は後続 | ユーザー承認(2026-07-10)「問題ないところまで実装してよい」 |
| 2026-07-10 | M1〜M2 実装(Codex / 既定 / xhigh)。`apps/camera-ar-gomi-demo/` | カメラ・デモ認識/TF.js・シード生成・URL/QR。lint/build通過。実機HTTPS確認は未 |
| 2026-07-10 | 作業報告(Codex / 既定 / medium): `docs/reports/2026-07-10_camera-ar-gomi-demo_m1-m2.md` | report-only 委譲 |
| 2026-07-10 | M2.5〜M3 実装(Codex / 既定 / xhigh): NFC・MindAR AR・PWA・Pages統合デプロイ | 1件目デモのソフトウェア完了。公開URL: https://bankto.github.io/sai-art-fuji-clean/camera-ar-gomi-demo/ |
| 2026-07-10 | 作業報告(Codex / 既定 / medium): `docs/reports/2026-07-10_camera-ar-gomi-demo_m2_5-m3.md` | report-only 委譲。M2.5/M3/PWA/Pagesの実装済み範囲と未検証事項を整理 |
| 2026-07-10 | 実装レビューShould反映(Codex / 既定 / medium): `docs/reviews/2026-07-10_camera-ar-gomi-demo_implement_review.md` のShould 4件を対応済みに更新 | カメラ拒否・アプリ内ブラウザ案内を追加。`CACHE_NAME`をv4へ更新しREADMEにデプロイ時のバンプ手順を明記。`npm run lint` / `npm run build` 成功 |



