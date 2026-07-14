# 進行状況ダッシュボード

最終更新: 2026-07-14（camera-ar-gomi-demoの生成音声初期音量を35%へ調整。Phase 5 は現地キャリブ・出張撮影待ちを継続）

このファイルは再開用の短いダッシュボード(目安: 全体120行まで)。状態+1行要約+成果物へのリンクだけを書き、詳細の転記と節の新設はしない。履歴系2節(決定事項ログ / 直近のAI実行ログ)はデータ行20行を超える前に `docs/history/YYYY-MM.md` へ移す(運用の正本: `docs/workflows/orchestrate.md`「docs/status.md の運用」)。

## 現在のフェーズ

**Phase 5: 実装**(2件目 local-map-gps-demo: SW完了・**現地キャリブ待ち** / 1件目: 認識モデルは出張撮影待ち)

## フェーズ進捗

| フェーズ | 担当 | 状態 | 成果物 | メモ |
|---|---|---|---|---|
| 1. リサーチ | Claude Code + Codex(並走) | 完了 | `docs/research/2026-07-02_廃棄物クリエイティブ事例/` | 本格モード完走 |
| 2. まとめサイト | Codex | 完了 | [公開サイト](https://bankto.github.io/sai-art-fuji-clean/) | Pages デプロイ済み |
| 3. アイデア出し | Cursor 指揮 | 完了 | `docs/decisions/2026-07-06_技術ベース確定.md` + 2件目アイデア | 検証用デモ2本へ |
| 4. 仕様書作成 | Cursor 指揮 | 完了(2件目含む) | `docs/specs/2026-07-13_local-map-gps-demo.md` + r1/r2 | 2件目確定。1件目も確定済 |
| 5. 実装 | Cursor 指揮 | 進行中 | `apps/local-map-gps-demo/` + `apps/camera-ar-gomi-demo/` | 2件目 M1〜M3 SW完了(レビュー承認)。1件目認識モデル待ち |

状態: 未着手 / 進行中 / レビュー待ち / 承認待ち / ブロック中 / 中断 / 完了

## 直近のアクション

- [ ] テンプレ改善提案: `docs/template-improvements/2026-07-14_consolidated.md` の Must と新バリアント方針を採否判断 — **人間判断待ち**
- [ ] 2件目 local-map-gps-demo: 現地で基準点GPS測定 → `src/data/calibration.ts` / `zones.ts` 差し替え → 実機確認 — **人間作業待ち**
- [ ] 認識モデル(Teachable Machine): 出張撮影 → 学習 → `public/models/` — **待ち(出張後)**
- [-] AR本格確認(M3) / M3.5 レーザー — **保留**

## 再開情報

- 現在のタスクID・対象: local-map-gps-demo 現地キャリブレーション（並走: 1件目認識モデルは出張待ち）
- ブランチ / upstream: main / origin/main
- 最後に成功した検証コマンド・日時: `apps/local-map-gps-demo` で `npm run lint` / `npm run test`(11 pass) / `npm run build` (2026-07-13)
- ブロッカー / 担当: 人間作業待ち（現地基準点の緯度経度測定）。ソフトウェアは完了
- 再開条件・次に実行する具体的操作: READMEの「人間が行う現地作業」に沿って基準点を測定 → データ差し替えをAIへ依頼。公開する場合は commit/push を承認

## Git・リリース方針

2026-07-12 ユーザー決定: push・確立済み再デプロイとも**承認制**(テンプレ 2026.07.11.1 既定。従来の push 自律運用はここで終了)。

| 操作 | 方針 | 対象・条件 |
|---|---|---|
| commit | 許可 | 承認済み成果物のみ。対象パス指定で stage。`git add -A` / `git add .` 禁止 |
| push | **承認制(既定)** | 自動許可へ変える場合は remote / branch / 保護ブランチ条件を明記 |
| 確立済み再デプロイ | **承認制(既定)** | 本案件は push 連動: GitHub Actions `pages.yml` → https://bankto.github.io/sai-art-fuji-clean/ |
| 初回公開・課金・DNS | 常に承認制 | 2件目の初回公開も承認が必要 |

## 決定事項ログ

直近の重要決定だけを置く(データ行20行まで)。超える更新では、同じ更新の中で古い行から `docs/history/YYYY-MM.md` へ移す。

| 日付 | 決定内容 | 理由 |
|---|---|---|
| 2026-07-12 | テンプレ 2026.07.11.1 取り込み。push・確立済み再デプロイは承認制 | ユーザー指示・決定 |
| 2026-07-12 | 実機フィードバック反映。NFC/QR/URL/AR/レーザー導線は一時非表示 | ユーザー指示 |
| 2026-07-12 | テンプレート `2026.07.12.1`・`2026.07.12.2` を順に取り込み | Claude委譲実モデル確認・status短縮 |
| 2026-07-12 | camera-ar-gomi-demoを「カメラ起動→自動認識→生成」へ統一 | ユーザー追加要望 |
| 2026-07-13 | 認識安定化(4回連続確認)・カメラUI整理(生成のみ) | 実機フィードバック |
| 2026-07-13 | カメラ→生成の操作感OK。種類/％はデモフォールバック合意。次はTeachable Machine | ユーザー判断 |
| 2026-07-13 | 認識モデル作業は出張撮影完了まで待ち | ユーザー判断。手順: `docs/decisions/2026-07-13_teachable-machine-shooting-checklist.md` |
| 2026-07-13 | 2件目デモ=施設ローカルマップ×GPS。技術=自前マップ+Geolocation(Mapboxなし)。GitHub Pages同居 | ユーザー承認。詳細: `docs/decisions/2026-07-13_local-map-gps-demo.md` |
| 2026-07-13 | 2件目仕様確定・M1〜M3実装完了。実装レビュー=承認。次は現地キャリブ | ユーザー「人間作業まで自律進行」+ r2/実装レビュー承認 |

## 直近のAI実行ログ

| 日時 | タスク・ラウンド | 実行指定AI / モデル / effort | 実行確認AI / モデル / effort | 結果・成果物 |
|---|---|---|---|---|
| 2026-07-13 | camera-ar-gomi-demo 認識安定化 | Codex / 既定 / high | Codex / GPT-5 / high | 4回連続確認等。lint/build成功 |
| 2026-07-13 | push・再デプロイ(ユーザー承認) | Cursor / — / — | Cursor / — / — | 認識安定化を origin/main へ |
| 2026-07-13 | camera-ar-gomi-demo カメラUI整理 | Codex / 既定 / medium | Codex / GPT-5 / medium | 1ボタン化。lint/build成功 |
| 2026-07-13 | push・再デプロイ(ユーザー承認) | Cursor / — / — | Cursor / — / — | カメラUI整理を origin/main へ |
| 2026-07-13 | local-map-gps-demo アイデア+仕様 | Codex / 既定 / high | Codex / gpt-5.6-sol / high | ideas/ + specs/ |
| 2026-07-13 | 仕様レビュー r1 | Claude Code / sonnet / high | Claude Code / claude-sonnet-5 / high | 条件付き承認。Must1/Should3 |
| 2026-07-13 | 仕様レビュー反映 | Codex / 既定 / medium | Codex / gpt-5.6-sol / medium | Must/Should反映 |
| 2026-07-13 | 仕様レビュー r2 | Claude Code / sonnet / medium | Claude Code / claude-sonnet-5 / medium | 承認 |
| 2026-07-13 | local-map-gps-demo M1〜M3実装 | Codex / 既定 / high | Codex / gpt-5.6-sol / high | apps/ + pages.yml + report。lint/test/build成功 |
| 2026-07-13 | 実装レビュー r1 | Claude Code / sonnet / high | Claude Code / claude-sonnet-5 / high | 承認。Mustなし |
| 2026-07-13 | push・再デプロイ(ユーザー承認) | Cursor / — / — | Cursor / — / — | `233f7df` を origin/main へ。URL: …/local-map-gps-demo/ |
| 2026-07-14 | テンプレ改善提案(Claude視点) | Claude Code / sonnet / high | Claude Code / claude-sonnet-5 / high | `docs/template-improvements/2026-07-14_claude-code.md` |
| 2026-07-14 | テンプレ改善提案の三者統合 | Codex / 既定 / high | Codex / gpt-5.6-sol / high | `docs/template-improvements/`(README・Cursor・Codex・統合) |
| 2026-07-14 | camera-ar-gomi-demo 初期音量調整 | Codex / 既定 / medium | Codex / GPT-5 / medium | 初期音量35%。lint/build成功。`docs/reports/2026-07-14_camera-ar-gomi-demo-default-volume.md` |
