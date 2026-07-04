# AGENTS.md — sai-art-fuji プロジェクト

リサーチからWebサイト/Webアプリ実装までを AI 主導で進めるプロジェクト。
Cursor / Codex / Claude Code のどれで作業しても、このファイルと `docs/workflows/` を正とする。
親ディレクトリ(bankto)の Vite + SCSS テンプレート規約は、実装フェーズで Vite 構成を採用した場合のみ適用する。`docs/` 配下のドキュメント作業には適用しない。

## 役割分担(重要)

**Phase 1〜3(リサーチ・まとめサイト・アイデア出し)は役割を固定しない。** ユーザーが使いたいAI(Cursor / Codex / Claude Code のどれでも)がワークフローに従って実施してよい。

**Phase 4〜5(仕様書・実装)は役割を固定する:**

| ツール | 役割 |
|---|---|
| Cursor | **オーケストレーター**。CLI(`codex exec` / `claude -p`)で Codex と Claude Code に委譲し、進行管理・結果の統合・ユーザーへの報告を担う |
| Codex | **作成担当**。仕様書作成(Phase 4)と実装(Phase 5)。レビュー指摘の反映も行う |
| Claude Code | **レビュー担当**。仕様書レビュー・改善提案、実装レビュー。対象ファイルは直接修正せず、レビューレポート(`docs/reviews/`)に指摘・提案を書く |

- 自分がどのツールとして動作しているかを踏まえ、Phase 4〜5 で役割外の作業を求められたら役割分担を伝えたうえでユーザーの指示に従う
- レビューの反映(ファイル修正)は Codex が行う。Claude Code はレポートのみ
- どのAIが作業しても成果物の置き場所・雛形・`docs/status.md` の更新ルールは同じ。他のAIが作った成果物を上書きする前に内容を確認する

## プロジェクトの流れ(5フェーズ)

| フェーズ | 内容 | 担当 | 作業場所 | 成果物 |
|---|---|---|---|---|
| 1. リサーチ | 調査・情報収集 | 任意のAI | `docs/research/` | リサーチノート |
| 2. まとめサイト | リサーチを見やすくWeb化 | 任意のAI | `research-site/` | 静的サイト |
| 3. アイデア出し | リサーチを元に発想・相談 | 任意のAI | `docs/ideas/` | アイデアシート |
| 4. 仕様書作成 | 採用アイデアを仕様化 | Codex 作成 / Claude Code レビュー | `docs/specs/` + `docs/reviews/` | 仕様書 + レビュー |
| 5. 実装 | Webサイト/Webアプリ開発 | Codex 実装 / Claude Code レビュー | `apps/` + `docs/reviews/` | プロダクト + レビュー |

## フェーズ別ワークフロー(全ツール共通)

各フェーズの具体的な手順は `docs/workflows/` に定義してある。フェーズ作業を始める前に該当ファイルを必ず読むこと。

| ワークフロー | 実行担当 |
|---|---|
| `docs/workflows/research.md` | 任意のAI |
| `docs/workflows/research-site.md` | 任意のAI |
| `docs/workflows/ideate.md` | 任意のAI |
| `docs/workflows/orchestrate.md`(Phase 4〜5 の委譲手順) | Cursor |
| `docs/workflows/spec.md` | Codex |
| `docs/workflows/spec-review.md` | Claude Code |
| `docs/workflows/implement.md` | Codex |
| `docs/workflows/implement-review.md` | Claude Code |

ツール別の入口: Cursor はスラッシュコマンド(`.cursor/commands/`)、Claude Code もスラッシュコマンド(`.claude/commands/`)、Codex はスキル(`.agents/skills/`)。いずれも中身は上記ワークフローを参照するだけの薄いラッパー。

## フェーズ別の詳細ルール(全ツール共通)

`.cursor/rules/*.mdc` はCursorでは自動適用されるが、内容は全ツール共通のルール。Cursor以外のツールは、該当フォルダを扱うときに対応するファイルを読んで従うこと。

- `docs/research/` を扱うとき → `.cursor/rules/research.mdc`
- `docs/ideas/` を扱うとき → `.cursor/rules/ideas.mdc`
- `docs/specs/` を扱うとき → `.cursor/rules/specs.mdc`
- `docs/reviews/` を扱うとき → `.cursor/rules/reviews.mdc`
- `research-site/` を扱うとき → `.cursor/rules/research-site.mdc`
- `apps/` を扱うとき → `.cursor/rules/apps.mdc`

## 全体ルール

- 進行状況は `docs/status.md` で管理する。フェーズの開始・完了時に必ず更新する
- `docs/status.md` は**成果物を1つ完成させるたびに**更新する(セッション終了時にまとめて更新しない。リミット切れ等の突然の中断では終了時処理が実行されないため)。次のセッション・別AIが `status.md` を読むだけで再開できる状態を常に保つ
- 成果物は上流ドキュメントへのリンクを持つ(仕様書→アイデア→リサーチと遡れるようにする)
- フェーズを飛ばす場合(例: リサーチなしで実装)はユーザーに確認してから進める
- ドキュメントのファイル名は `YYYY-MM-DD_テーマ名.md` 形式(例: `2026-07-02_市場調査.md`)。本格リサーチのみフォルダ形式 `YYYY-MM-DD_テーマ名/`
- 各ドキュメントは雛形に沿って書く(リサーチ: `docs/research/_templates/`、その他: `docs/*/_template.md`)
- リサーチは2モード: ライト(1ファイル)/ 本格(brief → 収集 → 分析 → 検証 → 判断 の5段階)。本格では収集AIと検証AIを別コンテキストに分ける。詳細は `docs/workflows/research.md`
- ドキュメントはすべて日本語で書く
- 仕様の確定・技術選定・アイデア採用などの意思決定は AI 間で完結させず、必ずユーザーの承認を得る

## 禁止

- 出典のない情報を事実として書くこと
- 仕様書なしで `apps/` 配下の実装を始めること(プロトタイプはユーザー了承があればOK)
- レビュー担当(Claude Code)が対象ファイルを直接修正すること
- ビルド成果物(`dist/` など)の直接編集
