# ワークフロー: Phase 4〜5 のオーケストレーション(担当: Cursor)

Cursor は Phase 4(仕様書)・Phase 5(実装)を自分で作業せず、CLI で Codex(作成)と Claude Code(レビュー)に委譲し、進行管理する。

## 委譲に使うCLI

```powershell
# Codex(作成・修正反映)。--full-auto でファイル編集を許可
codex exec --full-auto "<指示>"

# Claude Code(レビュー)。acceptEdits で docs/reviews/ への書き込みを許可
claude -p "<指示>" --permission-mode acceptEdits
```

- 指示には「読むべきワークフローファイル」「対象ファイルのパス」「出力先」を必ず含める(委譲先はこの会話の文脈を持っていない)
- 実行には数分かかることがある。完了を待って出力とファイルの実体を確認する

## Phase 4: 仕様書作成の流れ

1. **事前ヒアリング(Cursor)**: 対象アイデアを読み、決めるべきこと(スコープ・画面構成・技術スタックの希望など)をユーザーに質問して固める。委譲先は非対話なのでユーザーへの質問はできない。ここで決めきれなかった点は「未決事項に書くよう」Codex に指示する
2. **作成(Codex)**:

```powershell
codex exec --full-auto "docs/workflows/spec.md を読み、その手順に従って docs/ideas/<対象>.md の仕様書を docs/specs/ に作成する。前提: <ヒアリング結果を箇条書き>。ユーザーへの質問はできないので、判断できない点は未決事項に書くこと"
```

3. **レビュー(Claude Code)**:

```powershell
claude -p "docs/workflows/spec-review.md を読み、その手順に従って docs/specs/<対象>.md をレビューし、docs/reviews/ にレビューレポートを作成する" --permission-mode acceptEdits
```

4. **反映(Codex)**: レポートの判定が「要修正」または「条件付き承認」なら、Must 指摘の反映を Codex に委譲する

```powershell
codex exec --full-auto "docs/reviews/<レポート>.md の Must 指摘を docs/specs/<対象>.md に反映する。Should/Could は対応する場合のみ。対応内容をレポートのチェックボックスに反映すること"
```

5. **収束判定(Cursor)**: 再レビュー→反映は最大2ラウンド。収束しない場合は論点を整理してユーザーに判断を仰ぐ
6. **ユーザー承認**: 仕様書・レビュー・未決事項を要約して提示し、ユーザーの承認を得てから仕様書を「確定」にする。`docs/status.md` を更新する

## Phase 5: 実装の流れ

1. **事前確認(Cursor)**: 仕様書が「確定」であることを確認。マイルストーンを把握する
2. **実装(Codex)**: マイルストーン単位で委譲する

```powershell
codex exec --full-auto "docs/workflows/implement.md を読み、docs/specs/<対象>.md のマイルストーン<N>を apps/<プロダクト名>/ に実装する"
```

3. **レビュー(Claude Code)**:

```powershell
claude -p "docs/workflows/implement-review.md を読み、docs/specs/<対象>.md と突き合わせて apps/<プロダクト名>/ をレビューし、docs/reviews/ にレビューレポートを作成する" --permission-mode acceptEdits
```

4. **修正(Codex)**: Must 指摘があれば Codex に修正を委譲する(Phase 4 の手順4と同様)
5. **検証(Cursor)**: lint・ビルドが通ることを自分でも確認する。ブラウザでの動作確認が可能ならスクリーンショットを添えて報告する
6. **報告**: 実装内容・レビュー結果・未検証項目を要約してユーザーに報告し、`docs/status.md` を更新する

## オーケストレーターの心得

- 委譲した作業の成果物は鵜呑みにせず、ファイルの実体・lint・ビルドで検証する
- CLI が失敗した場合(未認証・タイムアウトなど)は、エラー内容をユーザーに報告し、代替(Cursor 自身での実施)を提案する。勝手に役割を無視して作業しない
- AI 間のラウンドは記録に残す: 誰が・何を・何ラウンド行ったかを `docs/status.md` の決定事項ログに書く
