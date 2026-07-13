# 進行状況ダッシュボード

最終更新: 2026-07-13（カメラUI整理を push・Pages再デプロイ待ち）

このファイルは再開用の短いダッシュボード(目安: 全体120行まで)。状態+1行要約+成果物へのリンクだけを書き、詳細の転記と節の新設はしない。履歴系2節(決定事項ログ / 直近のAI実行ログ)はデータ行20行を超える前に `docs/history/YYYY-MM.md` へ移す(運用の正本: `docs/workflows/orchestrate.md`「docs/status.md の運用」)。

## 現在のフェーズ

**Phase 5: 実装**(1件目デモ: ソフト完了・カメラUI整理済み / **再デプロイ後の実機再確認待ち** / AR・M3.5は保留)

## フェーズ進捗

| フェーズ | 担当 | 状態 | 成果物 | メモ |
|---|---|---|---|---|
| 1. リサーチ | Claude Code + Codex(並走) | 完了 | `docs/research/2026-07-02_廃棄物クリエイティブ事例/`(主) + `_codex/`(並走) | 本格モード完走。収集・分析・検証・判断材料整理・seed CSV まで完了。ユーザー判断により Phase 3 へ進行(2026-07-06) |
| 2. まとめサイト | Codex | 完了 | [公開サイト](https://bankto.github.io/sai-art-fuji-clean/) / `research-site/` + `.github/workflows/pages.yml` | GitHub Pages デプロイ済み。ユーザー判断により Phase 3 へ進行(2026-07-06) |
| 3. アイデア出し | Cursor 指揮(Claude Code 発散 / Codex 整形) | 完了(壁打ち終了) | `docs/decisions/2026-07-06_技術ベース確定.md` | 技術ベース9種+体験の芯3本確定。壁打ち30+案。2026-07-10 ユーザー判断で一旦終了→検証用デモ2本へ |
| 4. 仕様書作成 | Cursor 指揮(Codex 作成 / Claude Code レビュー) | 完了 | `docs/specs/2026-07-10_camera-ar-gomi-demo.md` + レビュー | ユーザー承認(2026-07-10)で確定。M2までを初回実装範囲に |
| 5. 実装 | Cursor 指揮(Codex 実装 / Claude Code レビュー) | 完了(カメラUI整理済み) | `apps/camera-ar-gomi-demo/` | 空メッセージを完全非表示にし、カメラ操作を「生成」のみに整理。再デプロイ後の実機再確認待ち。NFC/QR/URL/AR/レーザー導線は一時非表示 |

状態: 未着手 / 進行中 / レビュー待ち / 承認待ち / ブロック中 / 中断 / 完了

## 直近のアクション

未完了だけを置く。完了した項目は次の更新で消す(履歴は「直近のAI実行ログ」と `docs/reports/` が持つ)。

- [ ] 再デプロイ後の実機再確認: GitHub Pages HTTPS で空メッセージ時の黒枠非表示・「生成」のみの操作・自動認識・生成をiPhone/Androidで確認 — **優先**
- [-] AR本格確認(M3): `.mind` 生成・印刷ターゲット・追跡重畳 — **保留**(2026-07-11。体験方針が未確定のため)
- [-] M3.5 実物試作: レーザー彫刻/印刷 — **保留**(2026-07-11。レーザー可否検討中)

## 再開情報

- 現在のタスクID・対象: camera-ar-gomi-demo カメラUI整理の再デプロイと実機再確認
- ブランチ / upstream: main / origin/main
- 最後に成功した検証コマンド・日時: `npm run lint` / `npm run build` (2026-07-13)
- ブロッカー / 担当: なし
- 再開条件・次に実行する具体的操作: カメラUI整理を push 済み。Pages再デプロイ後、人間が更新後URLで黒枠非表示・「生成」のみ・自動認識・生成を確認。URL/QR/NFC/AR/レーザー導線は一時非表示

ブロッカーが無ければ「なし」。`ブロック中`・`中断`では、次のセッションが追加質問なしで再開できる粒度まで書く。

## Git・リリース方針

2026-07-12 ユーザー決定: push・確立済み再デプロイとも**承認制**(テンプレ 2026.07.11.1 既定。従来の push 自律運用はここで終了)。

| 操作 | 方針 | 対象・条件 |
|---|---|---|
| commit | 許可 | 承認済み成果物のみ。対象パス指定で stage。`git add -A` / `git add .` 禁止 |
| push | **承認制(既定)** | 自動許可へ変える場合は remote / branch / 保護ブランチ条件を明記 |
| 確立済み再デプロイ | **承認制(既定)** | 自動許可へ変える場合はコマンド / 環境 / 確認 URL を明記(本案件は push 連動: GitHub Actions `pages.yml` → https://bankto.github.io/sai-art-fuji-clean/) |
| 初回公開・課金・DNS | 常に承認制 | 人間作業を手順として明示する |

## 決定事項ログ

直近の重要決定だけを置く(データ行20行まで)。超える更新では、同じ更新の中で古い行から `docs/history/YYYY-MM.md` へ移す(手順は `docs/history/README.md`)。恒久的な体制・方針の変更は `docs/decisions/` にも経緯を残す。

| 日付 | 決定内容 | 理由 |
|---|---|---|
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
| 2026-07-11 | AR本格確認(M3)・M3.5レーザー彫刻試作を保留 | ユーザー判断。体験で何をするか未確定。M1〜M2.5の実機確認は後日実施予定。ARコード(M3)は実装済みのまま据え置き |
| 2026-07-11 | 1件目デモの次工程を M1〜M2.5 実機確認に優先 | ユーザー判断。AR/M3.5は保留のまま、カメラ・生成・持ち帰り(NFC含む)でベースを固める |
| 2026-07-12 | テンプレ 2026.07.11.1 取り込み(実施: Claude Code 単体実行、実行確認AI / モデル: Claude Code / Fable 5): hook 新スキーマ+`last_assistant_message` 対応、モデル・effort の委譲コマンド毎回明示(Claude は `--model`/`--effort`)、「実行指定/確認AI」の分離記録、レビュー名の種別・ラウンド付き化(今後の新規分から。既存はリネームしない)、push・確立済み再デプロイは承認制で記入(ユーザー決定)、status に再開情報/Git・リリース方針/直近のAI実行ログ節を追加、`docs/history/` 追加、`.template-version`=2026.07.11.1 | ユーザー指示。テンプレ正本 D:\workspace\ai-templates(HEAD `a3b6d48`)。次回取り込みは `.template-version` からの差分を見る |
| 2026-07-12 | 実機フィードバックを反映し、現在のデモ画面をカメラ認識→端末内生成へ集中。NFC/QR/URL/AR/レーザー導線は削除せず一時非表示 | ユーザー指示。戻し方はアプリREADMEと作業報告に記録 |
| 2026-07-12 | テンプレート `2026.07.12.1`・`2026.07.12.2` を順に取り込み | Claude委譲の実モデル確認フローと、statusを短く保つ履歴退避ルールを反映。参照元 `D:\workspace\ai-templates` HEAD `df15ef1` |
| 2026-07-12 | camera-ar-gomi-demoの手動選択・デモ表記を廃止し、モデル有無とも「カメラ起動→自動認識→生成」へ統一 | ユーザーの実機確認後の追加要望。モデル未配置時はカメラフレーム由来の内部フォールバックを使用。詳細: `docs/reports/2026-07-12_camera-ar-gomi-demo_production-ux.md` |
| 2026-07-13 | camera-ar-gomi-demoの自動認識を4回連続確認で安定化し、手動更新は現在フレームを即時確定 | 実機で種類・％が頻繁に変わり、更新操作の反応が分かりにくいというフィードバック。詳細: `docs/reports/2026-07-13_camera-ar-gomi-demo_recognition-stability.md` |
| 2026-07-13 | camera-ar-gomi-demoの空メッセージ枠を非表示にし、カメラ操作を「生成」のみに整理 | ユーザー実機フィードバック。自動認識があるため手動更新を削除。詳細: `docs/reports/2026-07-13_camera-ar-gomi-demo_camera-ui-cleanup.md` |

## 直近のAI実行ログ

指定値と実際に確認できた値を分ける。確認手段: Claude Code は委譲 stdout JSON(`--output-format json`)の `modelUsage`、Codex はセッション開始ログの `model:` / `reasoning effort:`(正本: `docs/workflows/orchestrate.md`「実行確認モデルの取得」)。エイリアス解決・fallback後のモデルを確認できない場合は「不明」とする。データ行20行まで。超える更新では、同じ更新の中で古い行から `docs/history/YYYY-MM.md` へ移す(手順は `docs/history/README.md`)。

| 日時 | タスク・ラウンド | 実行指定AI / モデル / effort | 実行確認AI / モデル / effort | 結果・成果物 |
|---|---|---|---|---|
| 2026-07-12 | テンプレ 2026.07.11.1 取り込み(単体実行) | Claude Code / —(ユーザー対話) / — | Claude Code / Fable 5 / — | ルール系ファイル一式を更新。commit はユーザー実施 |
| 2026-07-12 | camera-ar-gomi-demo 実機フィードバック反映(単体実行) | Codex / 既定 / high | Codex / GPT-5 / high | UI改善、上司向け説明、作業報告を作成。lint/build成功。実機再確認待ち |
| 2026-07-12 | push(ユーザー承認) | Cursor / — / — | Cursor / — / — | `5db077c` を `origin/main` へ push。Pages 再デプロイ待ち |
| 2026-07-12 | テンプレート 2026.07.12.1〜2026.07.12.2 取り込み(単体実行) | Codex / 既定 / 既定 | Codex / 不明 / 不明 | ルール系ファイル更新、status棚卸し、`.template-version`更新。Claude CLIのJSON・`modelUsage`検証成功。commitは未実施 |
| 2026-07-12 | Claude CLI実行確認モデル取得テスト | Claude Code / haiku / medium | Claude Code / claude-haiku-4-5-20251001 / medium | stdoutはJSON 1オブジェクト、`result=CLI_OK`、`modelUsage` 1件を確認 |
| 2026-07-12 | camera-ar-gomi-demo 本番同等認識UX(単体実行) | Codex / 既定 / high | Codex / GPT-5 / high | 手動選択・デモ表記を廃止し、自動認識フォールバックを実装。lint/build成功。実機再確認待ち |
| 2026-07-12 | push・再デプロイ(ユーザー承認) | Cursor / — / — | Cursor / — / — | `ec3a992` を `origin/main` へ push。Pages 再デプロイ待ち |
| 2026-07-13 | camera-ar-gomi-demo 認識安定化(単体実行) | Codex / 既定 / high | Codex / GPT-5 / high | 4回連続確認・信頼度抑制・手動即時更新・文言/タイトル/PWA更新。lint/build成功。commit・再デプロイ・実機確認待ち |
| 2026-07-13 | push・再デプロイ(ユーザー承認) | Cursor / — / — | Cursor / — / — | 認識安定化を `origin/main` へ push。Pages 再デプロイ待ち |
| 2026-07-13 | camera-ar-gomi-demo カメラUI整理(単体実行) | Codex / 既定 / medium | Codex / GPT-5 / medium | 空メッセージ非表示、認識更新削除、1ボタン化、README/PWA更新。lint/build成功。commit・再デプロイ・実機確認待ち |
| 2026-07-13 | push・再デプロイ(ユーザー承認) | Cursor / — / — | Cursor / — / — | カメラUI整理を `origin/main` へ push。Pages 再デプロイ待ち |
