# camera-ar-gomi-demo

カメラ認識、シード駆動の音/ビジュアル生成、URL/QR持ち帰りを確認する検証用デモです。M2までを対象にし、NFC、AR、レーザー彫刻パターンは後続マイルストーンに残しています。

## 起動

```bash
npm install
npm run dev
```

PCでは `http://localhost:5173` で確認します。スマホ実機でカメラを使う場合は HTTPS または localhost 扱いの環境が必要です。同一LANで確認する場合は、mkcert 等でローカルHTTPSを用意し、開発PCのLAN IPへ接続してください。

## scripts

- `npm run dev`: Vite 開発サーバー
- `npm run lint`: TypeScript 型チェック
- `npm run build`: TypeScript 型チェック + Vite ビルド
- `npm run preview`: ビルド成果物のプレビュー

## モデル追加

`public/models/` に Teachable Machine の画像分類モデルを書き出してください。

- `public/models/model.json`
- `public/models/metadata.json`
- `public/models/weights.bin` または shard ファイル

アプリ起動時に `model.json` が見つかると TF.js モデル認識へ切り替わります。モデルが無い場合はデモモードになり、画面上のデモラベル選択で M1〜M2 のフローを確認できます。

## M2.5 以降

- M2.5: 共有URLを NFC タグへ書き込む。Android Chrome の Web NFC または既製NFC書き込みアプリで検証する。
- M3: 画像ターゲットARで、作品ビジュアルを対象物上へ重畳する。
- M3.5: レーザー彫刻または印刷パターンで QR / 画像ターゲットの読み取り安定性を検証する。
