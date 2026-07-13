# レビュー: local-map-gps-demo M1〜M3 実装

- 日付: 2026-07-13
- 種別: 実装レビュー
- 対象: [apps/local-map-gps-demo/](../../apps/local-map-gps-demo/)
- ファイル名: `2026-07-13_local-map-gps-demo_m1-m3_implement-review_r1.md`
- 実行指定AI / モデル / effort: Claude Code / sonnet / high
- 実行確認AI / モデル / effort: Claude Code / claude-sonnet-5 / high
  （modelUsage: claude-sonnet-5 主）
- ラウンド: 1

## 総評(3行以内)

仕様書の機能・エッジケース・非機能要件をほぼ網羅した実装で、射影・ゾーン判定・Geolocation状態遷移のunit testも仕様の主要ケースをカバーしている。コードレビューの範囲でMust級のバグ・セキュリティ・a11y違反は見つからなかった。ただしこの実行環境ではnpm/nodeコマンドの実行がすべて権限拒否され、lint/test/build/ブラウザ操作をこちらで再現できなかった(理由は補足参照)。

## 判定
承認

## 指摘事項

### Must(必ず対応)

(なし)

### Should(対応推奨)

- [ ] `apps/local-map-gps-demo/src/main.ts:189-199` の `failureMessages` と `showGeolocationFailure` は網羅的だが、`showProjectedPosition` 内の「GPS基準点を読み込めません」分岐(`main.ts:142-152`)は、`calibration` が未定義になり得るのは起動時の設定検証失敗時のみで、その場合は `configurationError=true` により `locate()` が `gpsButton` 無効化と早期returnで到達不能になっている。到達しない防御コードである旨をコメントで明記するか、削除して見通しを良くすることを推奨する。根拠: `main.ts:210` の `if (!mapReady || configurationError) return;` と `handleMapReady` での `gpsButton.disabled = configurationError` により、`calibration` が未定義のまま `showProjectedPosition` が呼ばれる経路は現状存在しない。

### Could(任意・改善提案)

- [ ] `apps/local-map-gps-demo/src/data/calibration.ts` の仮基準点4点は経緯度がすべて0.001度刻みの合成格子で、実施設の形状とは無関係な正方形になっている。人間作業(現地測定)への差し替え時に「非一直線」チェックが通っても実際の施設形状に対して歪んだ射影にならないよう、README(既に現地手順は記載済み)に「基準点はなるべく施設外周に大きく分散させる」旨の一文を足すとより親切(現状でもREADMEに「施設全体へ分散」と記載済みのため優先度は低い)。

## 良い点

- 仕様4-3のとおり、基準点3点ちょうどの厳密解と4点以上の最小二乗を両方実装し、`test/affine.test.ts` で両ケース・一直線/重複/数値不正の拒否まで検証している(`src/affine.ts:104-158`)。
- 施設範囲外判定が「端に丸めず非表示」という仕様どおりの挙動になっている(`src/affine.ts:160-162`、`src/main.ts:155-170`)。
- デモ位置ボタンが状態によらず常時DOMに存在し、位置情報権限を暗黙に再要求しない設計になっている(仕様4-6を満たす)。`index.html:75-77` にdisabled属性が付いていないことを確認した。
- 位置情報の外部送信・永続化・console出力が一切ないことをソースで確認した(`fetch`/`XMLHttpRequest`/`localStorage`/`sessionStorage`/`document.cookie`/`console.*` を検索し該当なし)。
- ゾーン名・状態表示は `textContent` のみで、HTML文字列としての挿入(`innerHTML`等)が使われていないためXSSの懸念がない。
- 状態表示が色(`data-tone`)だけでなく `stateChip`/`statusTitle`/`statusMessage` のテキストでも示され、主要ボタンは`min-height: 52px`でタップ領域とキーボードフォーカス(`:focus-visible`)を確保しており、仕様5の可用性・a11y要件を満たす。
- `.github/workflows/pages.yml` の変更は既存のresearch-site・camera-ar-gomi-demoの処理を壊さず、`paths:`・`cache-dependency-path:`・buildステップ・コピー先を仕様どおり追加している。
- `apps/local-map-gps-demo/public/fuji-clean-facility-map.png` と原図 `docs/assets/fuji-clean-facility-map.png` のSHA-256ハッシュが一致することを確認し、施設図の改変がないことを検証した。
- 既存の `camera-ar-gomi-demo/index.html` と同じ `<script type="module" src="/src/main.ts">` + `vite.config.ts` の `base` 設定パターンを踏襲しており、リポジトリ内の実装規約と一貫している。

## Git反映メモ

- 承認の場合: 対象範囲は `apps/local-map-gps-demo/**` と `.github/workflows/pages.yml`。commit対象範囲としてこれらを含めてよい。push・GitHub Pages初回公開はユーザー承認後にオーケストレーターが実行する(仕様書・作業報告どおり未実施のまま)。

## 補足

- **lint/test/buildの自己実行不可**: この実行環境では `npm run lint`、`node --test ...`、`npm run build`、プレビューサーバー起動(`node scripts/preview-dist.mjs`)など、node/npmを呼び出すコマンドがすべて実行承認待ちのまま進まず(非対話実行のため承認できず)、`docs/reports/2026-07-13_local-map-gps-demo_m1-m3.md` に記載の「lint成功」「test 11件pass」「build成功」を自分で再実行して確認することはできなかった。作業報告の記載を鵜呑みにせず、代わりに以下を独自に検証した。
  - 既存の `apps/local-map-gps-demo/dist/index.html`(作業報告のbuildで生成済みのもの)を直接読み、`base: '/sai-art-fuji-clean/local-map-gps-demo/'` がJS/CSS/施設図のパスへ正しく反映されていることを確認した。
  - `apps/local-map-gps-demo/public/fuji-clean-facility-map.png` と `docs/assets/fuji-clean-facility-map.png` のSHA-256が一致することを確認した(原図改変なし)。
  - ソースコード全ファイル(`src/`・`test/`・`index.html`・`vite.config.ts`・`tsconfig.json`・`package.json`・`README.md`・`scripts/preview-dist.mjs`)を通読し、仕様書4章・9章・10章の各項目と突き合わせた。
  - `git status`/`git diff --stat` で秘密情報や意図しないファイルが含まれていないことを確認した。
- **ブラウザでの操作確認は未実施**: Playwright MCPでの起動も試みたが、プレビューサーバー起動コマンド自体が実行拒否されたため、施設図表示・デモ位置ボタン押下・GPS権限フローの実機/ブラウザ操作確認はできなかった。これは作業報告に記載済みの「headless Chromeがサンドボックスで起動できない」という同種の環境制約であり、現地スマホ実機確認(人間作業として既に予定済み)で解消される想定。
- 上記の環境制約により、本レビューは静的コードレビューと既存ビルド成果物の突き合わせによる検証にとどまる。lint/test/buildの再実行と実機/ブラウザでの操作確認は、通常のNode.js 24環境を持つ人間またはオーケストレーターでの再実施を推奨する。
