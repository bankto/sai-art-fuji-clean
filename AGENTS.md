# AGENTS.md — sai-art-fuji プロジェクト

リサーチからWebサイト/Webアプリ実装までを AI 主導で進めるプロジェクト。
Cursor / Codex / Claude Code のどれで作業しても、このファイルと `docs/workflows/` を正とする。
親ディレクトリ(bankto)の Vite + SCSS テンプレート規約は、実装フェーズで Vite 構成を採用した場合のみ適用する。`docs/` 配下のドキュメント作業には適用しない。

## 役割分担(重要・全フェーズ共通)

**フェーズに関係なく、常に同じ体制で動く**(2026-07-05 改定。経緯: `docs/decisions/2026-07-05_全フェーズオーケストレーション改定.md`):

| ツール | 常時の役割 |
|---|---|
| Cursor(Agents Window) | **オーケストレーター**。タスク分解・CLI(`codex exec` / `claude -p`)での委譲・進行管理・検証・ユーザー報告・`docs/status.md` 更新。自分で大きな作成/実装はしない。壁打ち等のユーザー対話も担う |
| Codex | **作成担当**。ドキュメント執筆、コード/サイト実装、CSV生成、レビュー指摘の反映、データ整形 |
| Claude Code | **調査・検証・レビュー担当**。リサーチ収集(専門調査員)、ファクトチェック(収集とは別セッション)、仕様/実装レビュー。対象ファイルの直接修正は原則せず、レビューは `docs/reviews/`、調査は `docs/research/` に書く |

- 委譲手順・タスク種別ごとの振り分け(ルーティング表)の正本は `docs/workflows/orchestrate.md`。オーケストレーションを始める前に必ず読む
- ユーザーが特定のAIに直接依頼した場合(単体実行)も、同じワークフロー・置き場所・status 更新ルールに従う
- 自分がどのツールとして動作しているかを踏まえ、役割外の作業を求められたら役割分担を伝えたうえでユーザーの指示に従う
- レビューの反映(ファイル修正)は Codex が行う。Claude Code はレポートのみ
- 他のAIが作った成果物を上書きする前に内容を確認する

## プロジェクトの流れ(5フェーズ)

フェーズはどれも「Cursor が指揮し、作成は Codex・調査/検証/レビューは Claude Code に委譲」で進む。

| フェーズ | 内容 | 主な委譲先 | 作業場所 | 成果物 |
|---|---|---|---|---|
| 1. リサーチ | 調査・情報収集 | Claude Code(収集・分析・検証) / Codex(CSV化・整形) | `docs/research/` | リサーチノート |
| 2. まとめサイト | リサーチを見やすくWeb化 | Codex(実装) / Claude Code(整合レビュー) | `research-site/` | 静的サイト |
| 3. アイデア出し | リサーチを元に発想・相談 | Cursor(壁打ち) / Claude Code(発散・批判) / Codex(シート整形) | `docs/ideas/` | アイデアシート |
| 4. 仕様書作成 | 採用アイデアを仕様化 | Codex(作成) / Claude Code(レビュー) | `docs/specs/` + `docs/reviews/` | 仕様書 + レビュー |
| 5. 実装 | Webサイト/Webアプリ開発 | Codex(実装) / Claude Code(レビュー) | `apps/` + `docs/reports/` + `docs/reviews/` | プロダクト + 作業報告 + レビュー |

## フェーズ別ワークフロー(全ツール共通)

各フェーズの具体的な手順は `docs/workflows/` に定義してある。フェーズ作業を始める前に該当ファイルを必ず読むこと。

| ワークフロー | 実行担当 |
|---|---|
| `docs/workflows/orchestrate.md`(**全フェーズの委譲手順・正本**) | Cursor |
| `docs/workflows/research.md` | Claude Code(委譲先) / 単体実行も可 |
| `docs/workflows/research-site.md` | Codex(委譲先) / 単体実行も可 |
| `docs/workflows/ideate.md` | Cursor(対話) + Claude Code / Codex(委譲先) |
| `docs/workflows/spec.md` | Codex |
| `docs/workflows/spec-review.md` | Claude Code |
| `docs/workflows/implement.md` | Codex |
| `docs/workflows/implement-review.md` | Claude Code |

ツール別の入口: Cursor はスラッシュコマンド(`.cursor/commands/`、全フェーズ共通の入口は `/orchestrate`)、Claude Code もスラッシュコマンド(`.claude/commands/`)、Codex はスキル(`.agents/skills/`)。いずれも中身は上記ワークフローを参照するだけの薄いラッパー。
新チャット・別ツールへの切り替え時に貼るコピペ用プロンプト(役割別の引き継ぎを含む)は `docs/prompts.md` にまとめてある。

## Git・自律実行(全フェーズ共通)

詳細な手順は `docs/workflows/orchestrate.md` にある。ここは正本としての要点。

- **自律実行**: 委譲先は STOP 条件(秘密情報・認証・権限・課金・破壊的操作・仕様矛盾・完了不能・繰り返すビルド失敗・スコープ外機能)に該当しない限り質問で止まらず、迷いは自律判断して成果物の「未決事項」「自律判断ログ」に記録する。オーケストレーターも STOP 条件・ユーザー承認ポイント以外ではステップ間確認を挟まない
- **レビュー判定**: レポートの `## 判定` 直下1行(承認 / 条件付き承認 / 要修正)だけを機械的に読む。品質の再判定はしない
- **Git 操作範囲**:

| 役割 | commit | push | 備考 |
|---|---|---|---|
| オーケストレーター(Cursor) | 可 | ユーザー判断が既定 | レビュー承認の区切りで対象差分を確認して commit。自動 push を許すなら `docs/decisions/` に記録 |
| Codex | 不可 | 不可 | 作成・実装・作業報告まで |
| Claude Code | 不可 | 不可 | レビュー文書に判定と修正方針を書く。対象ファイルは直接修正しない |

## フェーズ別の詳細ルール(全ツール共通)

`.cursor/rules/*.mdc` はCursorでは自動適用されるが、内容は全ツール共通のルール。Cursor以外のツールは、該当フォルダを扱うときに対応するファイルを読んで従うこと。

- `docs/research/` を扱うとき → `.cursor/rules/research.mdc`
- `docs/ideas/` を扱うとき → `.cursor/rules/ideas.mdc`
- `docs/specs/` を扱うとき → `.cursor/rules/specs.mdc`
- `docs/reviews/` を扱うとき → `.cursor/rules/reviews.mdc`
- `research-site/` を扱うとき → `.cursor/rules/research-site.mdc`
- `apps/` を扱うとき → `.cursor/rules/apps.mdc`

(`.cursor/rules/orchestrator.mdc` は Cursor 専用の役割定義で、常時適用される)

## 全体ルール

- 進行状況は `docs/status.md` で管理する。フェーズの開始・完了時に必ず更新する
- `docs/status.md` は**成果物を1つ完成させるたびに**更新する(セッション終了時にまとめて更新しない。リミット切れ等の突然の中断では終了時処理が実行されないため)。次のセッション・別AIが `status.md` を読むだけで再開できる状態を常に保つ
- 委譲プロンプトには「読むファイル・出力先・前提」を毎回含める(委譲先は会話文脈を持たない)。詳細は `docs/workflows/orchestrate.md`
- 成果物は上流ドキュメントへのリンクを持つ(仕様書→アイデア→リサーチと遡れるようにする)
- フェーズを飛ばす場合(例: リサーチなしで実装)はユーザーに確認してから進める
- 体制・方針の大きな変更は経緯を `docs/decisions/` に記録する
- ドキュメントのファイル名は `YYYY-MM-DD_テーマ名.md` 形式(例: `2026-07-02_市場調査.md`)。本格リサーチのみフォルダ形式 `YYYY-MM-DD_テーマ名/`
- 各ドキュメントは雛形に沿って書く(リサーチ: `docs/research/_templates/`、その他: `docs/*/_template.md`)
- リサーチは2モード: ライト(1ファイル)/ 本格(brief → 収集 → 分析 → 検証 → 判断 の5段階)。本格では収集AIと検証AIを別コンテキストに分ける(CLI 委譲では別々の呼び出しに分ける)。詳細は `docs/workflows/research.md`
- ドキュメントはすべて日本語で書く
- 仕様の確定・技術選定・アイデア採用などの意思決定は AI 間で完結させず、必ずユーザーの承認を得る(判断ポイント一覧は `docs/workflows/orchestrate.md`)

## 禁止

- 出典のない情報を事実として書くこと
- 仕様書なしで `apps/` 配下の実装を始めること(プロトタイプはユーザー了承があればOK)
- レビュー担当(Claude Code)が対象ファイル(仕様書・実装コード)を直接修正すること
- 収集を行った同じセッション(同じ CLI 呼び出し)でファクトチェックを行うこと
- オーケストレーター(Cursor)がユーザー承認なしに作成・実装を肩代わりすること
- ビルド成果物(`dist/` など)の直接編集
