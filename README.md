# sai-art-fuji

リサーチ → まとめサイト → アイデア出し → 仕様書 → 実装 を AI と進めるプロジェクト。
Cursor をオーケストレーターとして、Codex(作成)・Claude Code(レビュー)が分担して動きます。

## AI の役割分担

- **Phase 1〜3(リサーチ・まとめサイト・アイデア出し)**: 役割固定なし。Cursor / Codex / Claude Code のどれで作業してもよい(成果物の置き場所とルールは共通)
- **Phase 4〜5(仕様書・実装)**: 役割固定

| ツール | Phase 4〜5 での役割 |
|---|---|
| Cursor | オーケストレーター。CLI で下記2つに委譲して進行管理 |
| Codex | 仕様書作成・実装(レビュー指摘の反映も担当) |
| Claude Code | 仕様書レビュー・改善提案、実装レビュー(`docs/reviews/` にレポートを書く) |

## 進め方

```
Phase 1          Phase 2            Phase 3         Phase 4            Phase 5
リサーチ    →    まとめサイト   →   アイデア出し →  仕様書作成      →  実装
docs/research/   research-site/     docs/ideas/     docs/specs/        apps/
[任意のAI]       [任意のAI]         [任意のAI]      [Codex ⇄ Claude]   [Codex ⇄ Claude]
```

Phase 4〜5 は「Codex が作成 → Claude Code がレビュー → Codex が反映 → ユーザー承認」のループで進みます。
進行状況は [docs/status.md](docs/status.md) で管理しています。

## あなた(人間)が意思決定すること

AIに任せず、必ず人間が確認・決定するポイントです。AIはここを勝手に進めません。

| フェーズ | 意思決定ポイント |
|---|---|
| リサーチ | テーマとブリーフ(目的・範囲・判断基準)の承認 / 本格リサーチの採用・不採用・保留の最終判断(`04_decision.md`) |
| アイデア出し | アイデアの採用・見送り |
| 仕様書 | スコープと技術スタックの承認 / 仕様書の「確定」 |
| 実装 | マイルストーン完了の確認 / レビューが収束しないときの論点判断 / 公開・リリース |

## 作業項目別のおすすめAI

Phase 1〜3 はどのAIでも作業できますが、品質の観点でのおすすめは以下です。

| 作業項目 | おすすめ | 理由 |
|---|---|---|
| リサーチのブリーフ作り(目的整理) | Cursor | 対話で壁打ちしながら固めやすい |
| 広範囲の事例収集・ニッチ探索 | Claude Code | 専門調査員(`reference-hunter` / `niche-spot-scout` / `official-source-researcher`)を装備済み |
| ファクトチェック | 収集とは別セッションの Claude Code(`fact-checker`)、または ChatGPT / Gemini 等の別AI | 収集したAI自身に検証させるとバイアスがかかる |
| 収集データの整形(CSV化・構造化) | Codex | データ処理・スクリプトが得意 |
| まとめサイト生成 | Cursor または Codex | どちらでも可 |
| アイデア出し・壁打ち | Cursor または Claude Code | 対話向き。複数AIに同じ問いを投げて「意見が割れた箇所」を論点にするのも有効 |
| 仕様書・実装 | Codex(固定) | 役割分担どおり |
| 仕様書・実装のレビュー | Claude Code(固定) | 役割分担どおり |

## フォルダ構成

```
sai-art-fuji-clean/
├── AGENTS.md            # AIルールの本体(役割分担もここに定義)
├── CLAUDE.md            # Claude Code 用ブリッジ(@AGENTS.md + レビュアー役の指定)
├── .cursor/
│   ├── rules/           # フェーズ別の詳細ルール(内容は全ツール共通)
│   └── commands/        # Cursor 用スラッシュコマンド
├── .claude/
│   ├── commands/        # Claude Code 用(Phase 1〜3 + レビュー系)
│   ├── agents/          # リサーチ専門調査員(収集・ニッチ探索・一次情報・検証)
│   └── skills/          # リサーチ手順テンプレ(ブリーフ・比較表・情報源分類など)
├── .agents/
│   └── skills/          # Codex 用(Phase 1〜3 + spec / implement)
├── docs/
│   ├── status.md        # 進行状況ダッシュボード
│   ├── workflows/       # フェーズ別手順書(全ツール共通の本体)
│   ├── research/        # Phase 1: リサーチノート(ライト=1ファイル / 本格=1フォルダ)
│   ├── ideas/           # Phase 3: アイデアシート
│   ├── specs/           # Phase 4: 仕様書
│   └── reviews/         # Claude Code のレビューレポート
├── research-site/       # Phase 2: リサーチまとめサイト
└── apps/                # Phase 5: 実装するWebサイト/Webアプリ
```

## 使い方

### Phase 1〜3: 好きなAIから始められます

| フェーズ | Cursor / Claude Code | Codex |
|---|---|---|
| リサーチ | `/research テーマ` | 「〜についてリサーチして」(research スキル) |
| まとめサイト | `/research-site` | 「まとめサイトを更新して」(research-site スキル) |
| アイデア出し | `/ideate` | 「アイデア出しをしたい」(ideate スキル) |

どのAIで作業しても、成果物は同じ場所(`docs/research/` など)に同じ雛形で保存されます。

リサーチには2つのモードがあります(AIが最初に確認します)。

- **ライト**: 軽い下調べ。1ファイルで完結
- **本格**: 意思決定に関わる調査。`ブリーフ → 収集 → 分析 → 検証(別AI) → 判断` の5段階をフォルダに蓄積。収集したAIとは別のコンテキストでファクトチェックするのがルールです

### Phase 4〜5: Cursor から開始(裏で Codex / Claude Code に委譲)

| フェーズ | Cursor でのコマンド | 実際に動くAI |
|---|---|---|
| 仕様書 | `/spec アイデア名` | Codex 作成 → Claude Code レビュー → Codex 反映 |
| 実装 | `/implement 仕様書名` | Codex 実装 → Claude Code レビュー → Codex 修正 |

単体で直接使う場合: Codex は spec / implement スキル、Claude Code は `/spec-review 対象`・`/implement-review 対象`。

## セッションをまたぐ・AIを乗り換えるとき

文脈はすべてファイルに残る設計です(会話ログはツールを跨げないため)。新しいセッションでは次の一言で再開できます。

```
docs/status.md を読んで現状を把握して、続きを進めて
```

特定の作業の続きは対象を直接指定します(例: `docs/research/2026-07-05_テーマ/ の続き。03_fact_check から`)。
各AIは作業終了時に status.md の「直近のアクション」を更新してから終えるルールになっています。

## AIルールの仕組み

手順・ルールの本体は1か所に集約し、各ツールの設定はそれを参照する薄い入口です。ルール変更時は本体側だけを編集してください。

| 層 | 本体 | 入口 |
|---|---|---|
| 全体ルール・役割分担 | `AGENTS.md` | Cursor / Codex は直接読む。Claude Code は `CLAUDE.md` 経由 |
| フェーズ手順 | `docs/workflows/*.md` | 各ツールのコマンド / スキルが参照 |
| フェーズ別詳細ルール | `.cursor/rules/*.mdc` | Cursor は自動適用。他は AGENTS.md の指示で読む |

## 各ドキュメントの雛形

- リサーチ(ライト): `docs/research/_templates/light.md`
- リサーチ(本格): `docs/research/_templates/full/00〜05`
- アイデア: `docs/ideas/_template.md`
- 仕様書: `docs/specs/_template.md`
- レビュー: `docs/reviews/_template.md`

## 前提

- `codex` CLI と `claude` CLI がインストール・ログイン済みであること(確認: `codex --version` / `claude --version`)
