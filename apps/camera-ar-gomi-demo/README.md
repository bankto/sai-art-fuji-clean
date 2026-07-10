# camera-ar-gomi-demo

カメラ認識、シード駆動の音/ビジュアル生成、URL/QR/NFC持ち帰り、画像ターゲットARを確認する検証用デモです。

公開URL想定: <https://bankto.github.io/sai-art-fuji-clean/camera-ar-gomi-demo/>

## 起動

```bash
npm install
npm run dev
```

PCでは `http://localhost:5173` で確認します。スマホ実機でカメラ、Web NFC、PWAを使う場合は HTTPS または localhost 扱いの環境が必要です。同一LANで確認する場合は、mkcert 等でローカルHTTPSを用意し、開発PCのLAN IPへ接続してください。

## scripts

- `npm run dev`: Vite 開発サーバー
- `npm run lint`: TypeScript 型チェック
- `npm run build`: TypeScript 型チェック + Vite ビルド。GitHub Pages の `/sai-art-fuji-clean/camera-ar-gomi-demo/` baseで出力
- `npm run preview`: ビルド成果物のプレビュー

## モデル追加

`public/models/` に Teachable Machine の画像分類モデルを書き出してください。

- `public/models/model.json`
- `public/models/metadata.json`
- `public/models/weights.bin` または shard ファイル

アプリ起動時に `model.json` が見つかると TF.js モデル認識へ切り替わります。モデルが無い場合はデモモードになり、画面上のデモラベル選択で M1〜M3 のフローを確認できます。

## 持ち帰り確認

1. 作品生成後、再生URLをコピーするかQRを読み取る
2. 別端末または同じ端末でURLを開き、同じSeedの作品が復元されることを確認する
3. Android ChromeかつWeb NFC対応環境では「NFCに書き込む」ボタンが表示される
4. iPhoneはWeb NFC書き込み非対応のため、Android端末または既製NFC書き込みアプリでURLを書き込んだタグをOS標準のタグ読み取りで開く

## AR確認

1. `public/ar-targets/gomi-target.svg` を印刷する
2. MindAR Image Targets Compilerで `gomi-target.mind` を生成し、`public/ar-targets/` に置く
3. `npm run build` またはGitHub Pages配信で `ar-targets/gomi-target.mind` が含まれることを確認する
4. 作品生成後に「AR検証」を押す、または `#ar` 付きURLを開く
5. 「AR開始」を押し、カメラ許可後に印刷ターゲットへかざす
6. ターゲット検出時は作品Canvasが重畳され、見失い時は通常再生フォールバックを表示する

`.mind` が未生成の場合、AR画面は通常再生フォールバックを表示し、生成手順を案内します。印刷・レーザー彫刻の検証チェックリストは `public/ar-targets/README.md` を参照してください。

## PWA

`manifest.webmanifest` と `sw.js` を同梱しています。初回表示後、アプリ本体と同一オリジンの静的アセットをキャッシュし、再生導線のオフライン確認の土台にします。MindAR/ThreeのCDNモジュールは初回AR起動時にネットワークが必要です。

デプロイ時は `public/sw.js` の `CACHE_NAME` をインクリメントしてください。キャッシュ優先で配信するため、バージョンを上げないと更新後も古いJS/CSSが返る場合があります。

## GitHub Pages

`.github/workflows/pages.yml` は research-site をルート `/`、このデモのビルド済み `dist` を `/camera-ar-gomi-demo/` に配置します。push後の公開URLは以下を想定しています。

- research-site: <https://bankto.github.io/sai-art-fuji-clean/>
- camera-ar-gomi-demo: <https://bankto.github.io/sai-art-fuji-clean/camera-ar-gomi-demo/>
