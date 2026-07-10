# 作業報告: カメラ認識 × AR ゴミデモ M1〜M2

- 日付: 2026-07-10
- 担当: Codex
- 使用モデル / effort: 既定 / medium
- 対象仕様書: [2026-07-10_camera-ar-gomi-demo.md](../specs/2026-07-10_camera-ar-gomi-demo.md)
- 対象マイルストーン: M1 / M1.5 / M2

## 実装した内容

`apps/camera-ar-gomi-demo/` に、スマホブラウザでカメラ認識から作品生成、持ち帰り再生までを確認する Vite + TypeScript の静的SPAを実装済み。

M1向けには、開始ボタンから `getUserMedia` で背面カメラを要求し、失敗時は通常カメラへフォールバックする構成にした。認識は `public/models/model.json` が存在する場合は TF.js のローカルモデルを読み込み、モデル未配置時はデモラベル選択によるデモモードで縦切りフローを確認できる。認識結果はラベル、信頼度、モデルバージョン、認識時刻、認識状態として保持し、信頼度閾値未満は未認識として扱う。

M1.5向けには、認識結果とカメラフレーム由来の簡易nonceから作品シードを生成し、同一シードから Canvas ビジュアルと Tone.js 音声パラメータを復元する構成にした。Canvasはシード駆動のアニメーションを表示し、音声はユーザー操作後に開始する。PNG保存、再生/停止、再生成、音量調整も用意した。

M2向けには、作品シードを `#play` 形式のURLパラメータへ変換し、同じURLを再読み込みまたは別端末で開くと同一シードから作品を復元できる導線を実装した。共有URLコピーと QR 表示を実装し、アプリ内QRリーダーは仕様どおり対象外とした。NFC、画像ターゲットAR、レーザー彫刻パターンは後続マイルストーンとして README に残している。

## 変更ファイル一覧

- `apps/camera-ar-gomi-demo/index.html`
- `apps/camera-ar-gomi-demo/package.json`
- `apps/camera-ar-gomi-demo/package-lock.json`
- `apps/camera-ar-gomi-demo/README.md`
- `apps/camera-ar-gomi-demo/tsconfig.json`
- `apps/camera-ar-gomi-demo/vite.config.ts`
- `apps/camera-ar-gomi-demo/public/models/README.md`
- `apps/camera-ar-gomi-demo/scripts/preview-dist.mjs`
- `apps/camera-ar-gomi-demo/src/audio.ts`
- `apps/camera-ar-gomi-demo/src/camera.ts`
- `apps/camera-ar-gomi-demo/src/main.ts`
- `apps/camera-ar-gomi-demo/src/recognition.ts`
- `apps/camera-ar-gomi-demo/src/seed.ts`
- `apps/camera-ar-gomi-demo/src/share.ts`
- `apps/camera-ar-gomi-demo/src/styles.css`
- `apps/camera-ar-gomi-demo/src/types.ts`
- `apps/camera-ar-gomi-demo/src/visual.ts`
- `apps/camera-ar-gomi-demo/src/vite-env.d.ts`
- `docs/reports/2026-07-10_camera-ar-gomi-demo_m1-m2.md`

## 完了条件チェック

- [ ] M1: スマホのHTTPS環境でカメラが起動し、用意した対象物1種を認識して、Canvas表示または音のどちらか1つが変化する
  - 実装上はカメラ起動、TF.jsモデル認識またはデモ認識、認識ラベル表示、生成によるCanvas表示・音生成まで実装済み。
  - ただしスマホ実機HTTPS環境での連続操作確認は未実施。
- [ ] M1.5: 1回の生成で得たシードから、音とCanvasが同時に再生/表示され、同一シードで同じ見た目・音のパラメータが復元される
  - 実装上は `deriveGeneratorParams(seed, generatorVersion)` により、同一シードから Canvas と音声パラメータを決定的に復元する。
  - ただし実機またはブラウザでのシードURL再読み込み確認は未実施。
- [ ] M2: シード入りURLを開くと、別端末または再読み込み後に同じ作品が再生される。QRから同じURLを開ける
  - 実装上は共有URL生成、URLコピー、QR Canvas描画、`#play` URLからの再生画面復元まで実装済み。
  - ただし別端末でのURL/QR読み取り確認は未実施。

## 検証結果

- lint: 委譲前提として通過確認済み。今回の報告書作成では再実行していない
- ビルド: 委譲前提として通過確認済み。今回の報告書作成では再実行していない
- 動作確認: ブラウザ実機確認は未実施。スマホカメラ利用には HTTPS または localhost 扱いの環境が必要なため、同一LAN HTTPS、限定公開テストURL、一時トンネル等の方式決定後に iPhone Safari / Android Chrome で確認する

## 自律判断ログ

- 完了条件チェックは、実装済みのコード上で満たしている範囲と、実機検証が未完了の範囲を分けて未チェック扱いにした。仕様書の完了条件はスマホ実機操作を含むため、コード実装だけで完了済みとは扱えないため
- lint/build は `_prompt_report_only.md` の前提どおり通過確認済みとして記録し、今回の報告書作成では再実行しなかった。報告書のみ作成する依頼であり、追加のビルド成果物や実装差分を発生させないため

## 未解決の懸念点・未決事項

- スマホ実機HTTPS環境での M1 / M1.5 / M2 連続操作確認が未実施
- 実物対象物1種と Teachable Machine / TF.js モデルが未配置の場合、M1の対象物認識はデモモードでの確認に留まる
- QR読み取りによる別端末再生確認は未実施
- iOS Safari / Android Chrome のどちらを初回検証端末にするか、HTTPS配信方式をどうするかは後続判断が必要
