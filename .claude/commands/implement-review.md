---
description: 実装を仕様書と突き合わせてレビューする
---

`docs/workflows/implement-review.md` を読み、その手順に従って実装をレビューする。
対象: $ARGUMENTS(空なら docs/specs/ と apps/ から対象を特定する)

- 通常は Cursor(オーケストレーター)から委譲されて実行する。単体実行でも手順は同じ
- レポートは `docs/reviews/` に書く。実装コードは直接修正しない(反映は Codex の役割)
- 非対話実行ではユーザーに質問できない。疑問点はレポートの指摘・未検証項目として書く
