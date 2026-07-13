# 作業報告: local-map-gps-demo M1〜M3

- 日付: 2026-07-13
- 実行指定AI / モデル / effort: Codex / 既定 / high（実装）; Codex / 既定 / medium（作業報告）
- 実行確認AI / モデル / effort: Codex / gpt-5.6-sol / high（実装）; Codex / gpt-5.6-sol / medium（作業報告）
- 補足: オーケストレーター再検証でも `npm run lint` / `npm run test`(11 pass) / `npm run build` 成功（2026-07-13）
- 対象仕様書: [施設ローカルマップ × GPS デモ](../specs/2026-07-13_local-map-gps-demo.md)
- 対象マイルストーン: M1〜M3

## 実装した内容

- M1: `docs/assets/fuji-clean-facility-map.png` を原図のままアプリへ配置し、レスポンシブな施設図、重ね合わせSVG、現在地マーカーを1画面に実装した。「デモ位置を表示」は初期・取得中・成功・失敗を問わず常時DOM上に表示し、明示操作後だけ「デモ位置」マーカーと仮ゾーン名を表示する。
- M2: ユーザー操作後に限りGeolocation APIで1回取得し、成功・権限拒否・位置取得不能・タイムアウト・API非対応・非HTTPS環境を区別して案内する。4点の合成基準点から最小二乗で2次元アフィン変換を算出し、画像範囲外では端へ丸めずマーカーを隠して施設範囲外と表示する。精度50m超は、現地実測で差し替える仮閾値として注意表示する。
- M3: 仮ゾーンを矩形・ポリゴンの差し替え可能なデータとして分離し、境界を含む判定、重複時の定義順優先、ゾーン外表示を実装した。Pagesワークフローへ2件目のpaths、lockfile cache、build、`public/local-map-gps-demo/` コピーを追加し、既存research-site・camera-ar-gomi-demoの処理を維持した。
- UI: 状態を色だけでなく日本語テキストでも示し、主要ボタンに52px以上の操作領域とキーボードフォーカスを設けた。位置情報の用途・非送信・非保存、キャリブレーション／ゾーンが仮データであることを画面上に明示した。
- テスト: 射影、4点以上の最小二乗、不正基準点、範囲外、矩形／ポリゴン、境界、重複、Geolocation成功・拒否・失敗・非対応・非HTTPSをNode.js標準test runnerで検証した。レビューr2のShould「基準点4点以上の最小二乗」ケースを実装テストで満たした。

## 変更ファイル一覧

- `.github/workflows/pages.yml`
- `apps/local-map-gps-demo/index.html`
- `apps/local-map-gps-demo/package.json`
- `apps/local-map-gps-demo/package-lock.json`
- `apps/local-map-gps-demo/tsconfig.json`
- `apps/local-map-gps-demo/vite.config.ts`
- `apps/local-map-gps-demo/README.md`
- `apps/local-map-gps-demo/public/fuji-clean-facility-map.png`
- `apps/local-map-gps-demo/scripts/preview-dist.mjs`
- `apps/local-map-gps-demo/src/affine.ts`
- `apps/local-map-gps-demo/src/geolocation.ts`
- `apps/local-map-gps-demo/src/main.ts`
- `apps/local-map-gps-demo/src/styles.css`
- `apps/local-map-gps-demo/src/types.ts`
- `apps/local-map-gps-demo/src/zones.ts`
- `apps/local-map-gps-demo/src/data/calibration.ts`
- `apps/local-map-gps-demo/src/data/zones.ts`
- `apps/local-map-gps-demo/test/affine.test.ts`
- `apps/local-map-gps-demo/test/geolocation.test.ts`
- `apps/local-map-gps-demo/test/zones.test.ts`

## 完了条件チェック

- [x] M1: 施設図、常時表示のデモ位置ボタン、デモ位置マーカーと明示ラベルを実装した。
- [x] M2: GPS成功・拒否・取得不能・タイムアウト・非対応・非HTTPS、仮キャリブレーション射影、精度注意、施設範囲外を実装した。
- [x] M3: 仮ゾーン判定・ゾーン外表示とPagesワークフロー組み込みを実装した。
- [x] `npm run lint`、`npm run test`、`npm run build` が成功した。
- [x] READMEへローカル起動、検証、仮データ差し替え、現地キャリブレーション手順を記載した。
- [x] 位置情報を送信・永続化せず、外部地図API・有料ライブラリ・バックエンドを追加していない。
- [x] commit、push、Pages実デプロイを行っていない。

## 検証結果

- install: Node.js `v24.16.0` / npm `11.13.0`。標準の`npm ci`は実行サンドボックスが依存ライフサイクルスクリプトの子プロセス生成を拒否し`spawn EPERM`となった。同じlockfileを使う`npm ci --ignore-scripts --offline --cache C:\Users\hitomi\AppData\Local\npm-cache`は成功（17 packages、脆弱性0）。その状態でViteのproduction buildまで成功しており、通常のNode.js 24 CIで必要なlockfileは生成済み。
- lint: `npm run lint` 成功（TypeScriptエラー0）。
- ビルド: `npm run build` 成功（Vite 7.3.6、9 modules transformed）。`dist/index.html`、JS、CSS、施設図を生成し、HTML内のJS/CSS/PNGがすべて`/sai-art-fuji-clean/local-map-gps-demo/` baseになっていることを確認した。原図とbuild内PNGのSHA-256一致も確認した。
- テスト(実行コマンド・件数・結果。追加しなかった場合は理由): `npm run test` 成功、11件中11件pass。Node標準test runnerのファイル分離はサンドボックスが子プロセスを拒否するため`--test-isolation=none`で同一プロセス実行とした。テストケース自体の分離・内容は維持している。
- 依存監査・秘密情報・セキュリティ自己点検(秘密値は書かない): `npm audit --offline`で脆弱性0。新しい外部地図／runtime依存は追加せず、既存Vite+TypeScript構成と同じ開発依存だけを使用した。`fetch`、Storage、Cookie、外部ログ、緯度経度のconsole出力、秘密情報のハードコードがないことをソース確認した。静的データ名称は`textContent`で表示し、HTML文字列として挿入していない。
- 動作確認(画面操作が関係する場合は、ブラウザで確認した操作・結果、または未確認の理由): Node標準HTTPプレビューでPages想定URLと施設図がともにHTTP 200、施設図180,745 bytesであることを確認した。headless ChromeはWindowsサンドボックスがChromeのIPC作成を拒否し起動できなかったため、クリック操作・目視・権限mockは未確認。静的HTML上の常時デモボタン、unit test、サブパス配信までは確認済み。現地スマホ実機確認と併せて人間が操作確認する必要がある。

## 自律判断ログ

- 仮キャリブレーションは、3点を超える最小二乗経路を初期状態から通すため、実在地点を示すものではない4点の合成座標とした。現地測定後は`src/data/calibration.ts`だけを差し替えられる。
- 仮ゾーンは矩形1件・ポリゴン2件とし、名称すべてに「（仮）」を付けた。矩形／ポリゴン、重複優先、ゾーン外を最小データで確認し、正式境界は`src/data/zones.ts`だけで差し替えられる。
- 精度不足の閾値は仕様上未決のため、初回の注意表示用に50mを仮採用した。現地実測後の変更箇所をデータファイルとREADMEに明記した。
- 新規test runner依存は追加せず、Node.js 24標準test runnerを採用した。既存Vite+TypeScriptの開発依存だけで再現でき、供給網の追加範囲を小さくするため。
- `npm run preview`は既存1件目と同じNode標準HTTPサーバー方式とした。Pages baseを明示的に再現でき、Vite previewの設定読込時に発生したサンドボックスの子プロセス制限も回避できるため。
- `.nvmrc`と`packageManager`は、確定仕様と委譲前提の「CI node-version: 24に揃え、新アプリだけで必須化しない」を優先して追加しなかった。lockfileとPagesワークフローで再現条件を固定した。

## 未解決の懸念点・未決事項

- 人間作業: 現地で基準点を最低3点、可能なら施設全体へ分散した4点以上測定し、合成キャリブレーションを実測値へ差し替える。
- 人間作業: 正式ゾーン名・境界・重複時の業務上の優先順位と、GPS精度警告の許容値を確定して仮データを差し替える。
- 人間作業: iPhone Safari、Android ChromeでGPS成功・拒否・タイムアウト・精度不足・範囲外・デモ切替を操作し、Network／Storage／Consoleも確認する。
- レビュー重点: 仮ゾーンが施設図の検証に十分な配置か、現地測定の記録形式を追加で決める必要があるかを確認してほしい。
- 環境制約: この実行環境では標準`npm ci`の依存スクリプトとheadless ChromeがOSサンドボックスに拒否された。通常のNode.js 24環境でフラグなし`npm ci`とブラウザ操作を再確認する。
- Pagesワークフローの構文・コピー内容は差分確認済みだが、push・初回公開は禁止範囲のためGitHub Actions実行は未確認。
