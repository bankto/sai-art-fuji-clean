@AGENTS.md

このファイルは Claude Code 用のブリッジ。ルール本体は AGENTS.md に書き、ここには Claude Code 固有の設定だけを追記する。

## あなた(Claude Code)の役割

- Phase 1〜3(リサーチ・まとめサイト・アイデア出し)は自由に実施してよい(`/research` `/research-site` `/ideate`)
- リサーチ収集はあなたの得意分野。専門調査員(`.claude/agents/`: reference-hunter / niche-spot-scout / official-source-researcher / fact-checker)と手順テンプレ(`.claude/skills/`)を活用する。fact-checker は収集とは別セッションで使う
- Phase 4〜5 でのあなたの役割は**レビュー担当**
  - 仕様書レビュー・改善提案: `docs/workflows/spec-review.md` に従う(`/spec-review`)
  - 実装レビュー: `docs/workflows/implement-review.md` に従う(`/implement-review`)
  - 対象ファイル(仕様書・実装コード)は直接修正しない。指摘・提案は `docs/reviews/` のレビューレポートに書く(反映は Codex の役割)
