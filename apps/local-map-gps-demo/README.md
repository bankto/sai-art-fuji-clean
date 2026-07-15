# local-map-gps-demo

スマホのGeolocation APIで取得した現在地を、自前の施設図へ射影してマーカーとゾーン名を表示する静的SPAです。地図API、バックエンド、位置履歴の保存・送信は使用しません。

公開URL想定: <https://bankto.github.io/sai-art-fuji-clean/local-map-gps-demo/>

## 前提

- CIと公開ビルドはNode.js 24を使用します。
- GPSはHTTPSまたはlocalhostでのみ利用できます。
- `src/data/calibration.ts` の基準点は、現地測定済みの緯度経度と注釈付き施設図から読み取った画像座標へ差し替え済みです。
- `src/data/zones.ts` は施設図のラベルに基づく**暫定データ**です。正式な業務ゾーン名・境界ではありません。

## ローカル起動

```bash
npm ci
npm run dev
```

表示されたlocalhostのURLをPCブラウザで開きます。「デモ位置を表示」は位置情報の権限や取得状態にかかわらず常時使用できます。

## 検証

```bash
npm run lint
npm run test
npm run build
npm run preview
```

- `npm run lint`: アプリとテストのTypeScript型チェック
- `npm run test`: Node.js標準test runnerで射影、4点以上の最小二乗、ゾーン判定、Geolocation成功・拒否・失敗を確認
- `npm run build`: GitHub Pagesの `/sai-art-fuji-clean/local-map-gps-demo/` baseで静的成果物を生成
- `npm run preview`: ビルド成果物をローカル配信

プレビューでは、初期状態とデモ位置表示後の両方で「デモ位置を表示」が見えること、マーカーとゾーン名が更新されることを確認します。実GPSの成功・拒否・タイムアウトはブラウザのDevToolsや権限設定で再現してください。

## キャリブレーションと暫定ゾーン

現地測定値と施設図上の定義は、次のファイルへ分離しています。

- `src/data/calibration.ts`: 現地測定済みの緯度・経度6点と、画像上の正規化座標（`x` / `y`: 0〜1）の対応。注釈画像は読取入力にだけ使い、アプリには埋め込んでいません。
- `src/data/zones.ts`: 正規化座標で定義した暫定ポリゴンと名称。重複時は配列の先頭が優先です。正式ゾーンの確定後に差し替えます。
- `src/data/calibration.ts` の `lowAccuracyThresholdMeters`: 現地実機確認後に決めるGPS精度警告値。

データ更新後は必ず `npm run lint`、`npm run test`、`npm run build` を実行し、実測した基準点でマーカー位置と範囲外判定を確認します。

## 人間が行う現地作業

1. 現地測定済みの6基準点で、施設図上のマーカー位置と範囲外判定を確認する。
2. 正式ゾーン名・境界・重複時の優先順位を確定し、暫定ゾーンを差し替える。
3. iPhone SafariとAndroid Chromeで取得精度、マーカー位置、範囲外判定を確認し、許容する精度警告値を決める。
4. Network、Storage、Consoleを確認し、位置情報の送信・永続化・常時出力がないことを再確認する。

## GitHub Pages

`.github/workflows/pages.yml` は既存のresearch-siteとcamera-ar-gomi-demoに加え、このアプリをbuildし、`public/local-map-gps-demo/` へ配置します。pushと初回公開はこの実装作業では行いません。
