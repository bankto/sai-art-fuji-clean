# レビュー: camera-ar-gomi-demo 実装(M1〜M3)

- 日付: 2026-07-10
- 種別: 実装レビュー
- 対象: [apps/camera-ar-gomi-demo/](../../apps/camera-ar-gomi-demo/)(仕様: [docs/specs/2026-07-10_camera-ar-gomi-demo.md](../specs/2026-07-10_camera-ar-gomi-demo.md) / 作業報告: [docs/reports/2026-07-10_camera-ar-gomi-demo_m1-m2.md](../reports/2026-07-10_camera-ar-gomi-demo_m1-m2.md))
- レビュアー: Claude Code
- 使用モデル / effort: sonnet / -
- ラウンド: 1

## 総評(3行以内)

seed生成・音/ビジュアル復元・URL/QR/NFC共有・AR(MindAR)・PWAのモジュール分割は仕様の機能仕様(§4)と整合しており、モデル未配置時のデモモード、`.mind`未生成時のARフォールバック、NFC非対応時のメッセージ分岐など、想定エッジケースへのグレースフルデグラデーションが一貫して実装されている。静的レビューの範囲でロジックバグ・セキュリティ・a11yのMust級問題は見つからなかった。
一方、仕様§4-1のエッジケース2点(カメラ拒否時の再許可案内、アプリ内ブラウザ検出)が未実装で、lint/buildおよびPlaywrightでの実機URL確認はこのセッションでは権限承認が得られず実行できなかった(未検証)。

## 判定

条件付き承認

## 指摘事項

### Must(必ず対応)

なし

### Should(対応推奨)

- [x] **カメラ拒否時に仕様§4-1のエッジケース(再許可方法とブラウザ再読み込みの案内)を満たしていない**。`src/main.ts` の `showCameraError`(L395-400)は `messageFromError(error)` の生のブラウザ例外メッセージ(例: `Permission denied`)をそのまま表示するのみで、再許可手順や再読み込みの案内文言が無い。根拠: 仕様§4-1「カメラ拒否: 再許可方法とブラウザ再読み込みを案内する」に反する。修正案: `startCamera`(`src/camera.ts`)が投げるエラーを `NotAllowedError` かどうかで判定し、`main.ts` 側で「設定からカメラ許可を有効にして再読み込みしてください」等の固定文言に差し替える。
  - 対応: `NotAllowedError` / `SecurityError` 時に、カメラ許可を有効化してページを再読み込みする固定文言へ差し替えた。
- [x] **アプリ内ブラウザ(LINE/Instagram等のWebView)の検出とSafari/Chromeで開き直す案内が未実装**。仕様§4-1のエッジケースに明記されているが、`src/camera.ts` / `src/main.ts` にその分岐がない。根拠: 仕様との不一致(spec-reviewで「良い点」として評価されたエッジケース網羅が実装で欠落)。修正案: `navigator.userAgent` で主要な内部ブラウザ(`Line/`, `Instagram`, `FBAN|FBAV` 等)を簡易判定し、該当時は開始前に案内メッセージを出す。
  - 対応: LINE / Instagram / Facebook / WeChat / TikTok / X / Google Search App のWebViewを簡易判定し、開始前にSafariまたはChromeで開き直す案内を表示するようにした。
- [x] **lint/buildをこのレビューセッションでは実行できなかった**。`npm run lint`(`tsc --noEmit`)、`npm run build`、および `node_modules/.bin/tsc` 直接実行のいずれも「承認が必要」でブロックされ、結果を確認できていない(権限承認待ちで進行せず、複数回試行後に断念)。静的読解では型不整合は見当たらないが、委譲プロンプトの前提(「lint/build は実行して結果を記載」)を満たせていない。マージ前にオーケストレーター(Cursor)側で `npm run lint && npm run build` を実行し、結果を記録することを推奨する。
  - 対応: Cursor検証済み。Should反映後にCodexでも `npm run lint` と `npm run build` の成功を確認した(Viteのチャンクサイズ警告のみ)。
- [x] **`public/sw.js` のfetchハンドラがキャッシュ優先(`cached || network`)のため、`CACHE_NAME` をバンプしない限りデプロイ更新後もクライアントに古いJS/CSSバンドルが返り続ける**(`public/sw.js` L40-53)。現状は `CACHE_NAME = 'camera-ar-gomi-demo-v3'` の手動バージョン管理のみ。根拠: PWA更新の実務リスク(バグ修正が配信されない)。修正案: リリース手順に「デプロイのたびに`CACHE_NAME`をインクリメントする」ことを明記するか、`skipWaiting`+`clients.claim`と合わせてバージョンをビルド時に自動注入する。
  - 対応: `CACHE_NAME` を `camera-ar-gomi-demo-v4` に更新し、READMEのPWA欄にデプロイ時のインクリメント手順を明記した。

### Could(任意・改善提案)

- [ ] AR(MindAR/Three)は `index.html` のimport map経由でCDN(`unpkg.com` / `jsdelivr.net`)から読み込む設計(`src/ar.ts` L62-70)。import map対応ブラウザ(iOS Safari 16.4+ 等)であることをREADME/仕様に明記すると、実機検証時の切り分けがしやすくなる。動的import失敗時のエラーもトーストに生の例外メッセージが出るのみ(`main.ts` L155-157)で、ユーザー向けの理由説明が薄い。
- [ ] `#camera-video` 要素に `aria-label` 等の補足がない。認識状態は別要素(`#recognition-label`等)で `role="status"` 表示されているため必須ではないが、スクリーンリーダー利用時の説明としてあると親切。

## 良い点

- DOM更新が一貫して `textContent` / `.value` プロパティ経由で行われており、`innerHTML` は未使用。URLパラメータ由来の `objectLabel` 等もエスケープ不要な形で安全に描画されている(XSS対策として妥当)
- `deriveGeneratorParams(seed, generatorVersion)` が純粋関数で、`(seed, version)` のみから決定的に音/ビジュアルパラメータを復元する設計になっており、M1.5の「同一シードなら同一出力」要件を満たしている。`createArtworkSeed` 側は毎回ランダムnonceを含めることで「撮影ごとに別シードでよい」という偶然性の要件とも整合する(仕様§4-3のレビュー反映を正しく実装)
- モデル未配置時のデモモード(`recognition.ts`)、`.mind`未生成時のARフォールバック(`ar.ts` の `hasCompiledTarget`)、Web NFC非対応時のメッセージ分岐(`nfc.ts`)など、実機/実物アセットが揃っていない状態でも縦切りフローを壊さずに確認できる設計が徹底されている
- `:focus-visible` のアウトライン、`role="status"` によるライブリージョン(`camera-message` / `ar-status` / `toast`)、標準の `button`/`select`/`input` 要素を用いたキーボード操作性など、a11yの基本が満たされている
- `vite.config.ts` の `base` と `.github/workflows/pages.yml` のPages配置先、`sw.js` の登録パス(`import.meta.env.BASE_URL` 経由)が一致しており、research-siteと同一オリジンのサブパスに配信してもスコープ衝突やパス不整合が起きない設計になっている

## Git反映メモ

- 条件付き承認: Should 4件はいずれもコード修正または運用手順の明記で対応可能で、体験フロー・技術選定の再設計は不要と判断した
- commit対象範囲: `apps/camera-ar-gomi-demo/` 配下の差分(commit・pushはオーケストレーターの役割)。Should対応、または対応しない場合はその判断をSTOP条件に該当しない自律判断として記録した上でコミット可
- 予期しない差分・秘密情報は見つからなかった

## 補足

- lint/build、および Playwright MCP による公開URL(<https://bankto.github.io/sai-art-fuji-clean/camera-ar-gomi-demo/>)での動作確認は、いずれもこのセッションで権限承認が得られずブロックされ、複数回試行した上で断念した。静的コードレビューのみで判断しており、実行時の動作・型エラーの有無は未確認
- M1(実物体認識)・M2.5(NFC実機読み取り)・M3(AR実機/`.mind`ファイル)の仕様上の完了条件は、モデル未配置・`gomi-target.mind`未生成・実機未検証のため、いずれもソフトウェア実装は完了しているが「実際に認識/重畳/タグ読み取りが成立すること」は未達成。これは既に `docs/status.md` および `docs/reports/2026-07-10_camera-ar-gomi-demo_m1-m2.md` の未決事項に記録済みのため、本レビューでは重複指摘とせず状況の確認のみ記載する
- 判定を「要修正」ではなく「条件付き承認」にした理由: 見つかったのはShould級(仕様のエッジケース2件・検証未実行2件)のみで、ロジックバグ・セキュリティ・a11y違反等のMust級指摘が無かったため
