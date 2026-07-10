# 作業報告: カメラ認識 × AR ゴミデモ M2.5〜M3

- 日付: 2026-07-10
- 担当: Codex
- 使用モデル / effort: 既定 / medium
- 対象仕様書: [2026-07-10_camera-ar-gomi-demo.md](../specs/2026-07-10_camera-ar-gomi-demo.md)
- 対象マイルストーン: M2.5 / M3 / PWA / Pages配信

## 実装した内容

`apps/camera-ar-gomi-demo/` は commit `88aa5cb` で、M2までのURL/QR持ち帰りに続き、NFC書き込み、画像ターゲットAR、PWA、GitHub Pages配信の土台まで実装済み。

M2.5向けには、共有URLをNDEF URLレコードとしてNFCタグへ書き込む `nfc.ts` を追加し、Android Chrome の Web NFC 対応環境かつ HTTPS / localhost の場合だけ「NFCに書き込む」操作を表示する構成にした。非対応環境ではQRまたは既製NFC書き込みアプリへフォールバックし、iPhoneでは事前書き込み済みタグをOS標準読み取りで開く運用を前提にしている。

M3向けには、MindARの画像ターゲット方式で作品Canvasを対象上に重畳するAR画面を追加した。`public/ar-targets/gomi-target.svg` を印刷・彫刻検証用ターゲットとして同梱し、`gomi-target.mind` が存在する場合にMindARセッションを開始する。`.mind` 未生成時、またはターゲットを見失った場合は、通常再生フォールバックを表示する。

PWA向けには、`manifest.webmanifest` と `sw.js` を同梱し、production build時にService Workerを登録する構成にした。初回表示後にアプリ本体、manifest、アイコン、ARターゲット関連ファイルをキャッシュし、再生導線のオフライン確認の土台にしている。MindAR / Three のCDNモジュールは初回AR起動時にネットワークが必要な前提。

Pages配信向けには、`.github/workflows/pages.yml` で research-site をルートに配置し、`apps/camera-ar-gomi-demo` をビルドして `/camera-ar-gomi-demo/` に配置する構成にした。公開URLは `https://bankto.github.io/sai-art-fuji-clean/camera-ar-gomi-demo/` を前提としている。

## 変更ファイル一覧

- `.github/workflows/pages.yml`
- `apps/camera-ar-gomi-demo/README.md`
- `apps/camera-ar-gomi-demo/index.html`
- `apps/camera-ar-gomi-demo/package.json`
- `apps/camera-ar-gomi-demo/public/ar-targets/README.md`
- `apps/camera-ar-gomi-demo/public/ar-targets/gomi-target.svg`
- `apps/camera-ar-gomi-demo/public/icons/icon.svg`
- `apps/camera-ar-gomi-demo/public/icons/maskable.svg`
- `apps/camera-ar-gomi-demo/public/manifest.webmanifest`
- `apps/camera-ar-gomi-demo/public/sw.js`
- `apps/camera-ar-gomi-demo/scripts/preview-dist.mjs`
- `apps/camera-ar-gomi-demo/src/ar.ts`
- `apps/camera-ar-gomi-demo/src/main.ts`
- `apps/camera-ar-gomi-demo/src/nfc.ts`
- `apps/camera-ar-gomi-demo/src/pwa.ts`
- `apps/camera-ar-gomi-demo/src/seed.ts`
- `apps/camera-ar-gomi-demo/src/share.ts`
- `apps/camera-ar-gomi-demo/src/styles.css`
- `apps/camera-ar-gomi-demo/src/vendor.d.ts`
- `apps/camera-ar-gomi-demo/vite.config.ts`
- `docs/reports/2026-07-10_camera-ar-gomi-demo_m2_5-m3.md`

## 完了条件チェック

- [ ] M2.5: Android Chromeまたは既製アプリでNFCタグにURLを書き込み、スマホでタグを読むと再生画面が開く。iPhoneでの読み取り確認を含める。Androidのみで完了する場合は、iPhone未確認である旨を検証記録に残す
  - 実装上は Web NFC 対応環境で共有URLをNFCタグへ書き込む導線、非対応時のQR/既製アプリフォールバック、iPhone読み取り前提の案内を実装済み。
  - ただしAndroid ChromeでのNFC書き込み、NFCタグ読み取り、iPhone標準読み取りでの再生確認は未実施。
- [ ] M3: 印刷またはレーザー彫刻想定の画像ターゲットをカメラで認識し、対象上に作品ビジュアルを重畳できる
  - 実装上は MindAR 画像ターゲットAR画面、作品Canvasのテクスチャ重畳、ターゲットロスト時の通常再生フォールバック、印刷・彫刻用ターゲットSVGと検証メモを用意済み。
  - ただし `gomi-target.mind` は未同梱のため、現状の配布物だけではMindARのターゲット追跡は開始できない。MindAR compilerで `.mind` を生成してから、スマホ実機でターゲット検出と重畳表示を確認する必要がある。
- [ ] PWA: 初回表示後にアプリ本体と同一オリジンの静的アセットをキャッシュし、再生導線のオフライン確認の土台にする
  - 実装上は manifest と Service Worker を同梱し、production build時にService Worker登録を行う構成にしている。
  - ただしスマホ実機でのインストール、キャッシュ後の再表示、オフライン再生確認は未実施。
- [ ] Pages配信: GitHub Pagesで research-site とデモアプリを同一Pages配下に配信する
  - workflow上は research-site を `/`、デモアプリの `dist` を `/camera-ar-gomi-demo/` に配置する構成済み。
  - 公開URLは前提として提示されているが、今回の報告書作成ではActions実行結果や公開ページのブラウザ動作確認は行っていない。

## 検証結果

- lint: commit `88aa5cb` の実装前提では通過済みとして扱う。今回の report-only 作業では、実装コードを変更しない指示のため再実行していない
- ビルド: commit `88aa5cb` の実装前提では通過済みとして扱う。今回の report-only 作業では、`dist/` などの生成物差分を避けるため再実行していない
- 動作確認: 今回は報告書作成のみ。Android Chrome の Web NFC 書き込み、iPhone NFC読み取り、MindARターゲット追跡、PWAキャッシュ、GitHub Pages上の実機操作は未確認

## 自律判断ログ

- 完了条件チェックは未チェック扱いにした。M2.5 / M3 の仕様上の完了条件はNFCタグ、iPhone読み取り、画像ターゲット検出、スマホ実機操作を含むため、コード実装済みだけでは完了済みにできないため
- `gomi-target.mind` は未同梱であることをM3の未検証事項として明記した。READMEに生成手順はあるが、compilerで生成した成果物が無い状態ではAR追跡の実機確認に進めないため
- PWAとPages配信は今回の仕様マイルストーン表には独立項目として無いが、委譲前提に含まれているため、完了条件チェックに補助項目として追加した
- lint/buildは再実行しなかった。今回の依頼はreport-onlyであり、実装コードとビルド成果物を変更しないことが明示されているため

## 未解決の懸念点・未決事項

- `gomi-target.mind` を MindAR Image Targets Compiler で生成し、`apps/camera-ar-gomi-demo/public/ar-targets/` に配置する必要がある
- NFCタグへのURL書き込みと読み取りは、Android Chrome / 既製NFC書き込みアプリ / iPhone標準読み取りの実機確認が必要
- GitHub Pages公開URLで、カメラ起動、共有URL再生、NFC導線、ARフォールバック、PWAキャッシュをスマホ実機で確認する必要がある
- M3.5のレーザー彫刻 / 物理パターン試作はソフトウェア完了外。素材、サイズ、照明、距離、読み取り成功率の人間作業による記録が必要
