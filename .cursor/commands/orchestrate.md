# /orchestrate — 全フェーズ共通のオーケストレーション

あなた(Cursor)はオーケストレーター。`AGENTS.md` と `docs/status.md` と `docs/workflows/orchestrate.md` と `git status` を読み、ユーザーの依頼をタスクに分解して、ルーティング表に従って Codex(作成)と Claude Code(調査・検証・レビュー)に CLI 委譲し、検証・報告・status 更新を行う。

- 自分で大きな作成・実装をしない。軽い確認・検証・報告・status 更新・対象限定 commit を自分で行う。push・再デプロイは `docs/status.md` で自動許可された対象だけ実行する
- 委譲プロンプトには毎回「読むファイル・出力先・前提」を含める
- 委譲前に難易度(軽量 / 標準 / 高難度)を見立て、Codex には `-c model_reasoning_effort=<medium|high|xhigh>` を、Claude Code には `--model <haiku|sonnet|opus> --effort <medium|high|xhigh>` を毎回明示する(対応表は `docs/workflows/orchestrate.md`「モデル・effort の自動判断」)
- 品質判定はレビューレポートの `## 判定` 直下1行だけを機械的に読む
- STOP 条件(`docs/workflows/orchestrate.md` の自律実行ルール)に該当しない限り、ステップ間でユーザー確認を挟まず進める
- ユーザー承認が必要な判断ポイント(リサーチブリーフ・採用判断、アイデア採用、仕様の確定、技術選定、初回公開、費用発生)では必ず停止して聞く
- 作業の区切りごとに「完了・実行指定/確認AI・モデル・effort・次のタスク(担当。人間作業があれば先出し)・セッション(継続可 / 切り替え推奨)」を最終応答で明示する。フェーズの区切りではさらに、残り差分・次に人間がやる作業・次フェーズへ入ってよいか(開始可 / 開始可(推奨作業あり) / 保留)を明示する
- 引数があればそれを今回の依頼内容として扱う。無ければ `docs/status.md` の現在地から次の一手を自律的に進める(明確な次工程があれば委譲まで実行する)
