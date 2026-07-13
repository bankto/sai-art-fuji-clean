# local-map-gps-demo

スマホのGeolocation APIで取得した現在地を、自前の施設図へ射影してマーカーとゾーン名を表示する静的SPAです。地図API、バックエンド、位置履歴の保存・送信は使用しません。

公開URL想定: <https://bankto.github.io/sai-art-fuji-clean/local-map-gps-demo/>

## 前提

- CIと公開ビルドはNode.js 24を使用します。
- GPSはHTTPSまたはlocalhostでのみ利用できます。
- `src/data/calibration.ts` と `src/data/zones.ts` は、現地測定前の**仮データ**です。画面フローの検証用であり、施設の確定座標・確定ゾーンではありません。

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

## 仮データの差し替え

現地測定後、次のファイルだけを更新できるように分離しています。

- `src/data/calibration.ts`: 緯度・経度と画像上の正規化座標（`x` / `y`: 0〜1）の基準点。最低3点の非一直線な組、可能なら施設全体へ分散した4点以上へ差し替えます。
- `src/data/zones.ts`: 正規化座標で定義した矩形・ポリゴン、正式ゾーン名、重複時の優先順。配列の先頭が優先です。
- `src/data/calibration.ts` の `lowAccuracyThresholdMeters`: 現地実測後に決めるGPS精度警告値。

差し替え後は必ず `npm run lint`、`npm run test`、`npm run build` を実行し、実測した基準点でマーカー位置と範囲外判定を確認します。

## 人間が行う現地作業

1. 施設図全体へ分散する基準点を最低3点、可能なら4点以上選ぶ。
2. 各地点の緯度・経度と、施設図上の対応位置（正規化`x` / `y`）を記録する。
3. 仮キャリブレーションを実測値へ差し替える。
4. 正式ゾーン名・境界・重複時の優先順位を確定し、仮ゾーンを差し替える。
5. iPhone SafariとAndroid Chromeで取得精度、マーカー位置、範囲外判定を確認し、許容する精度警告値を決める。
6. Network、Storage、Consoleを確認し、位置情報の送信・永続化・常時出力がないことを再確認する。

## GitHub Pages

`.github/workflows/pages.yml` は既存のresearch-siteとcamera-ar-gomi-demoに加え、このアプリをbuildし、`public/local-map-gps-demo/` へ配置します。pushと初回公開はこの実装作業では行いません。
