# リサーチ: 技術実現性調査 - カメラ認識 × AR ゴミデモ(スマホWebアプリ)

- 使用AI / モデル / effort: Codex / GPT-5 / 既定
- 日付: 2026-07-10
- ステータス: 完了(ライトモード)
- 目的: 「カメラでゴミを写して認識し、音・画像作品を生成・持ち帰り・再生する」スマホWebアプリのデモについて、要件定義の材料となる技術実現性を評価する
- 上流: [2026-07-06_技術ベース確定.md](../decisions/2026-07-06_技術ベース確定.md)(体験の芯 D2: カメラ+AIゴミ判別 / D3: p5.js ジェネレーティブ、技術ベース: NFC / UV・レーザー) / [廃棄物クリエイティブ事例 02_analysis.md](2026-07-02_廃棄物クリエイティブ事例/02_analysis.md)(手薄な観点として「音・音楽系」が指摘済み)
- 指示書: `_prompt_feasibility.md`
- 参照日: 2026-07-10

## エグゼクティブサマリー

1. 最小デモは「用意したゴミ片をWebカメラで分類し、p5.js + Tone.jsで音・映像をシード生成する」構成なら、スマホWebだけで成立する
2. Webで「特定のゴミ様物体を後日マーカーレスAR追跡する」のは高リスク。画像ターゲット、QR、NFCへ置き換えるべき
3. iOS SafariはWebXR非対応、Web NFC非対応。一方でカメラ、Web Audio、NFCタグURLのOS読み取りを組み合わせれば持ち帰り再生は現実的
4. 8th Wallは2026-02-28にホスト型有料プラットフォームを終了し、現行は無料・セルフホスト前提へ変化している。旧来の「有料商用SaaS」前提で見積もらない
5. 推奨は M1=認識+生成、M2=URLシード+NFC/QR持ち帰り、M3=彫刻画像ターゲット+AR重畳。真のマーカーレス物体追跡はM3にも入れない

## 1. 画像認識(ゴミ/物体識別)

### 1-1. ブラウザのみでの物体認識の現状

ブラウザ内のオンデバイス認識は、デモ用途なら実用範囲にある。TensorFlow.jsはJavaScriptで機械学習モデルを開発し、ブラウザまたはNode.jsで実行するための公式ライブラリで、既製モデル利用、転移学習、ブラウザ実行デモが公式に案内されている。MediaPipe Object DetectorもWeb向けに提供され、ブラウザだけで実行・編集できる例と、`@mediapipe/tasks-vision`経由の導入が公式に示されている。

候補:

| 手段 | デモ適性 | ハードル | 備考 |
|---|---:|---:|---|
| TensorFlow.js + Teachable Machine | 高 | 低 | 用意したゴミ片5-10種の分類に最適。TF.js形式でWeb組み込みしやすい |
| MediaPipe Object Detector(Web) | 中 | 中 | 物体位置の枠を出せる。カスタム検出はデータ作成と学習が必要 |
| MediaPipe Image Embedder + kNN | 中 | 中 | 画像を数値ベクトル化し類似度比較できる。特定個体の少数ショット認識候補 |
| Transformers.js / CLIP系 | 低-中 | 中-高 | ゼロショット分類の魅力はあるが、スマホ初回ロードと推論負荷が重い |
| WebNN | 低 | 高 | 仕様・実装がまだ製品デモの前提にしづらい。今回は採用しない |

事実: MediaPipe Image Embedderは画像を数値表現へ変換し、画像同士の類似度比較などに使える。これは「特定のゴミ片」を登録画像との近さで呼び出す補助線になる。

推測: 会場で用意したゴミ片の分類はTeachable Machineで足りる可能性が高い。一方、来場者が任意に拾った未知のゴミを意味的に分類する用途は、データセット設計・誤認識説明・安全なUXが必要で、デモ初期範囲から外すべき。

### 1-2. カスタム物体(特定のゴミ片)を識別する難易度

| 手段 | 学習データ | できること | 難易度 |
|---|---|---|---:|
| 既製モデルそのまま | 不要 | 「ボトル」「カップ」など粗い一般分類 | 低 |
| Teachable Machine分類 | 各クラス数十枚程度 | 用意したゴミ片や素材カテゴリを見分ける | 低 |
| MediaPipeカスタム検出 | 各クラス数十-百枚+矩形ラベル | 画面内の位置まで検出 | 中 |
| Image Embedder + kNN | 各個体10-30ショット程度から試作 | 特定個体に近いものを再認識 | 中 |
| QR / ARマーカー | 不要 | 個体IDを確実に読む | 低 |

推奨: 「AIでゴミを判別した感」はTeachable Machine分類で作る。持ち帰り再生の確実性はQR/NFCへ分担する。AI認識だけで作品IDを保証しない。

### 1-3. iOS Safari / Android Chrome のカメラAPI制約

- `getUserMedia()`はMDN上でBaseline widely availableとされ、HTTPSなどのセキュアコンテキストが必要。ユーザー許可も必須
- GitHub PagesのようなHTTPS配信なら、スマホWebデモの土台として使える
- iOSはWeb Audioの開始にユーザー操作が必要。Tone.js公式も、ブラウザはユーザーが何かをクリックするまで音声を再生しないと説明しているため、開始ボタンが必須
- Android ChromeはWeb NFCやBarcodeDetectorなど周辺APIの選択肢が多いが、iOS Safari基準で設計するならQR読み取りはJSライブラリ、NFC書き込みはAndroidまたは専用アプリへ寄せる

ハードル評価: 画像認識は低。条件は「HTTPS」「開始ボタン」「背面カメラ指定」「撮影台・背景・照明の固定」。

## 2. マーカーレスAR(Web)

### 2-1. WebXR / 8th Wall / MindAR / AR.js / model-viewer 比較

| 手段 | デモ適性 | ハードル | 備考 |
|---|---:|---:|---|
| WebXR Device API | 低-中 | 中 | MDNはLimited availability / Experimental。Can I useではiOS Safari 26.5まで非対応、Chrome Androidは部分対応 |
| 8th Wall | 中 | 中 | 2026-02-28にホスト型プラットフォーム終了。現行は無料・ログイン不要・セルフホスト可。ただしXR Engineは一部バイナリ配布でライセンス確認が必要 |
| Zapworks Universal AR | 中 | 中 | Web/ネイティブ向けSDK、画像・顔・ワールドトラッキングあり。商用公開は有料プラン前提 |
| MindAR | 高 | 中 | Web向け画像トラッキング/顔トラッキング。OSSで静的HTMLに組み込みやすい。彫刻/印刷ターゲットの本命 |
| AR.js | 中 | 低-中 | マーカー、画像、位置ベース。マーカー型は軽いが見た目は無骨。画像トラッキングはCPU負荷が上がる |
| model-viewer | 中 | 低 | 3DモデルをWebとARで表示する用途に強い。作品呼び出しや画像認識との統合は別実装 |
| Vuforia Model Targets | 低 | 高 | 物体形状ベースの認識・追跡は可能だが、3D CAD/3D scanが前提でUnity/Native向け。Webデモには重い |

### 2-2. 「特定の物理物体」を再訪時に安定追跡できるか

結論: スマホWebだけで、任意の小さなゴミ様物体をマーカーレスに登録し、後日自宅で安定追跡する構成は現実的ではない。

理由:

- WebXRはiOS Safariで使えないため、iPhoneを含む来場者デモの共通基盤にできない
- Vuforia Model Targetsのような物体追跡は、物体の3Dモデル/スキャン、剛体、安定した表面特徴が前提。ゴミ様物体は変形・汚れ・反射・低特徴になりやすい
- Webで実装しやすいのは「物体そのもの」ではなく「物体に付けた画像ターゲット/QR/マーカー」の追跡

推奨する要件読み替え:

- NG: ゴミそのものをマーカーレスARで後日追跡する
- OK: ゴミ様物体にNFC/QR/彫刻ターゲットを持たせ、作品を呼び出す
- OK: 作品呼び出し後に、MindARやmodel-viewerでAR的に見せる

### 2-3. デモで現実的な到達点と代替案

| 代替案 | デモ適性 | ハードル | 備考 |
|---|---:|---:|---|
| NFCタグ(URLシード) | 高 | 低 | かざしてURLを開く。作品ID/シードの持ち帰りに最も強い |
| QRコード(印刷/彫刻) | 高 | 低-中 | iOS/Android共通。彫刻は素材コントラストの試作が必要 |
| MindAR画像ターゲット(印刷/彫刻) | 高 | 中 | 物体上に映像が重なる体験を作れる。特徴点の多い図案が必要 |
| AR.jsマーカー | 中 | 低 | 堅牢だが見た目が技術デモ寄り |
| 8th Wall現行版 | 中 | 中 | 無料化は追い風。ただし新体制直後のため、M1/M2の土台にするのは避ける |

ハードル評価: マーカーレスARは高。画像ターゲットARは中。NFC/QR呼び出しは低。

## 3. デバイス内ジェネレーター(音・画像)

### 3-1. 音の生成

Tone.jsはWeb Audioフレームワークで、ブラウザ内のインタラクティブ音楽制作、シンセ、エフェクト、スケジューリングに向く。公式ドキュメントでも、ブラウザはユーザー操作まで音を再生しないため、クリック等のイベント内で`Tone.start()`を呼ぶ必要があるとされている。

推奨:

- 認識結果、色、輪郭量、撮影時刻などからシードを作る
- シードから音階、BPM、音色、ノイズ量、エフェクト量を決定
- サンプル音源を使う場合も、オフライン化のため事前キャッシュする

ハードル: 低。音の品質は実装よりサウンド設計に左右される。

### 3-2. 画像・映像の生成

p5.jsは無料・OSSのJavaScriptライブラリで、コードでアートを作る用途に適している。今回のD3「偶然性 × 規則性」と相性がよい。

| 手段 | デモ適性 | ハードル | 備考 |
|---|---:|---:|---|
| Canvas / p5.js | 高 | 低 | 完全オンデバイス。シード再生成に強い |
| SVG / Canvas粒子表現 | 高 | 低 | 軽量。保存も容易 |
| TF.js軽量スタイル転送 | 中 | 中 | 「AI画像変換感」は出るが端末差が大きい |
| WebGPU + diffusion | 低 | 高 | WebGPU対応は広がったが、スマホでのモデルサイズ/メモリ/待ち時間がデモ向きでない |
| サーバー/API画像生成 | 中 | 中-高 | 表現力は高いが通信・課金・保存設計が必要。今回の最小デモから外す |

事実: Can I use上ではWebGPUはChrome/Edgeで対応済み、iOS Safariも26系で対応になっている。一方でこれは重量級生成AIがスマホWebで快適に動くことを意味しない。

推測: スマホ会場デモではdiffusion系より、p5.jsのシード駆動生成のほうが成功確率が高い。

### 3-3. オフライン要件、処理時間、端末性能

推奨は「モデルと生成ロジックを軽くし、PWA/Service Workerでキャッシュする」こと。M1なら、Teachable Machine分類モデル、p5.js、Tone.js、作品ロジックを事前ロードすれば、現場の通信に依存しにくい。

目安(推測):

| 処理 | 体感 |
|---|---|
| Teachable Machine分類 | リアルタイムに近い |
| MediaPipe埋め込み比較 | 数十ms-数百ms級。端末差あり |
| p5.js映像生成 | 即時 |
| Tone.js音生成 | 即時。ただし初回はユーザー操作で音声開始 |
| スタイル転送 | 数秒以上。M1では避ける |
| diffusion | 数十秒以上または失敗リスク。M1-M3から外す |

サーバー/API依存との比較:

| 観点 | オンデバイス | サーバー/API |
|---|---|---|
| 通信 | 不要にできる | 必須 |
| コスト | ほぼゼロ | API課金・運用が必要 |
| 表現力 | ジェネレーティブ表現中心 | 本格生成AIまで可能 |
| 再現性 | シードで再生成可能 | 出力保存が必要 |
| デモ適性 | 高 | 中 |

ハードル評価: p5.js + Tone.jsは低。軽量AI変換は中。ブラウザ内diffusionは高。

## 4. 持ち帰り・再生フロー

### 4-1. NFC(Web NFC API)の対応状況と制約

Web NFCは現行でも限定的。MDNはLimited availability / Experimentalとし、Can I useではChrome for Androidが対応、iOS Safariは26.5まで非対応。Chrome公式はWeb NFCがChrome 89 for Androidでローンチ済み、NDEFタグの読み書きが可能と説明している。

重要な分解:

- WebアプリからNFCを読み書きする: Android Chromeのみを前提にする
- iPhoneでNFCタグのURLを開く: Web NFCではなくiOSのOS機能/ネイティブ挙動として扱う。Apple公式ページは確認対象だが、今回のWeb取得では本文がJavaScript必須で取得できなかったため、実機確認を未決事項に残す
- 運営がNFCタグを書く: Android Web NFC、NFC Tools等の既製アプリ、または別途ネイティブアプリで対応

推奨: NFCタグには短いURLを入れる。作品データそのものではなく、`https://example.jp/p?v=1&s=seed` のようなバージョン付きシードURLを持たせる。

ハードル評価: 低。ただし「Webアプリ内でiPhoneからNFC書き込み」は不可。

### 4-2. レーザー彫刻 + 視覚パターン認識

レーザー彫刻は「作品らしさ」と「機能」を両立できる。

| 手段 | デモ適性 | ハードル | 備考 |
|---|---:|---:|---|
| レーザー彫刻QR | 高 | 中 | 読み取りは堅い。素材コントラスト、焦げ、反射で成否が変わる |
| レーザー彫刻画像ターゲット | 中-高 | 中-高 | MindARでAR重畳可能。特徴点が多い非反復図案が必要 |
| レーザー彫刻ARマーカー | 中 | 中 | 堅牢だが見た目がマーカー然とする |
| UV印刷ターゲット | 高 | 中 | 彫刻よりコントラストを作りやすい。物体の質感との相性確認が必要 |

推測: M2まではNFC+QRを主にし、レーザー彫刻はM3の試作対象にするのが安全。

### 4-3. 作品データの紐づけ・保存方式

| 方式 | デモ適性 | ハードル | 備考 |
|---|---:|---:|---|
| URLシード方式 | 高 | 低 | サーバーDB不要。NFC/QRに直接入る。生成ロジックのバージョン固定が必要 |
| localStorage / IndexedDB | 低 | 低 | iOS Safariでは7日間ユーザー操作がないとスクリプト書き込みストレージが削除されうる |
| ファイルエクスポート | 中 | 中 | PNG/WAVで記念品化できる。Web Share APIはHTTPSとユーザー操作が必要 |
| サーバー保存(ID発行) | 中 | 中 | 作品そのものを保存できるが、運用と個人情報/権限設計が増える |

推奨: URLシードを正とし、PNG保存を副にする。localStorage単独保存は「後日自宅で再生」の主経路にしない。

ハードル評価: URLシード+NFC/QRは低。サーバー保存は中。localStorage単独はリスク高。

## 技術比較表(総括)

| 手段 | デモ適性 | ハードル | 備考 |
|---|---:|---:|---|
| Teachable Machine / TF.js分類 | 高 | 低 | M1本命。用意したゴミ片を分類 |
| MediaPipe Object Detector | 中 | 中 | 検出枠を見せたい場合に追加 |
| MediaPipe Image Embedder + kNN | 中 | 中 | 特定個体の再認識実験。確実性はQR/NFCに劣る |
| QR読み取り | 高 | 低 | 持ち帰りIDの保険 |
| WebXR | 低 | 中 | iOS Safari非対応のため共通基盤にしない |
| 8th Wall現行版 | 中 | 中 | 無料化は追い風。ただし新体制・ライセンス確認が必要 |
| Zapworks | 中 | 中 | 商用公開は有料。高品質だがM1には重い |
| MindAR画像ターゲット | 高 | 中 | M3本命。印刷/彫刻ターゲットに向く |
| AR.jsマーカー | 中 | 低 | 技術デモ向き。見た目の整理が必要 |
| model-viewer | 中 | 低 | 3D作品の配置なら簡単 |
| Vuforia Model Targets | 低 | 高 | WebではなくUnity/Native寄り。ゴミ様物体には過剰 |
| p5.js映像生成 | 高 | 低 | D3と直結。シード再生成に強い |
| Tone.js音生成 | 高 | 低 | ブラウザ音生成の本命。開始ボタン必須 |
| WebGPU diffusion | 低 | 高 | 対応状況は改善したがスマホデモでは重い |
| NFCタグURL | 高 | 低 | M2本命。Web NFC書き込みはAndroid中心 |
| レーザー彫刻QR | 中-高 | 中 | 素材試作が必要 |
| 彫刻画像ターゲット+MindAR | 中-高 | 中-高 | 成立すれば体験価値が高い |

## 5. 推奨デモ構成(M1-M3)

### M1: 最小デモ「認識 → 生成 → 保存」 - ハードル: 低

内容:

- スマホでHTTPSのWebアプリを開く
- 開始ボタンでカメラと音声を解錠
- 用意したゴミ片をTeachable Machine/TF.jsで分類
- 認識結果からシードを作り、p5.js映像とTone.js音を生成
- PNG保存またはWeb Shareで共有

採用技術: `getUserMedia`、TF.js、p5.js、Tone.js、Canvas保存、Web Share API。

主なリスク: 誤認識、暗所、背景ノイズ、音声開始UX。撮影台と照明で下げられる。

### M2: 中間デモ「+ NFC/QR 持ち帰り再生」 - ハードル: 低-中

内容:

- M1で作った作品シードをURL化
- NFCタグまたはQRにURLを書き込む/印刷する
- 自宅でスマホをかざす、またはQRを読む
- 同じWebアプリが開き、シードから同じ音・映像を再生成する

採用技術: URLシード、NFCタグ、QR、PWA/Service Worker。

主なリスク: iPhoneでのNFCタグURL起動は実機確認が必要。NFC書き込みはAndroidまたは既製アプリ前提。

### M3: 理想に近い統合デモ「+ 彫刻ターゲットへのAR重畳」 - ハードル: 中-高

内容:

- M2のNFC/QRを保険として残す
- ゴミ様物体にレーザー彫刻またはUV印刷した画像ターゲットを付与
- MindARでターゲットを追跡し、作品映像を物体上に重畳
- 追加実験としてImage Embedder + kNNで「タグなし再認識」を試すが、本線にはしない

採用技術: MindAR、画像ターゲット、レーザー/UV試作、必要に応じてmodel-viewer。

主なリスク: 彫刻のコントラスト、特徴点不足、自宅照明、端末差。真のマーカーレス物体追跡は含めない。

## 示唆(So What)

- 「マーカーレスAR」という言葉は要件定義で分解するべき。今回必要なのは「作品呼び出し」と「AR的重畳」であり、前者はNFC/QR/画像認識、後者はMindAR/model-viewerで解く
- 作品データを画像・音声ファイルとして保存するより、シードとして保存するほうがデモが軽く、NFC/QRと相性がよい
- 既存リサーチでは音・音楽系が手薄だったため、ゴミ認識から音が生成される体験は差別化点になりうる
- 8th Wallは2026年に前提が変わったため、旧価格情報を使った判断は避ける。無料化は魅力だが、新体制直後なのでM1/M2の基盤にはしない

## 未決事項

1. iPhone実機で、NFCタグに入れたURLがロック解除後/通常利用時に期待どおりSafariで開くか確認する。Apple公式ページは存在確認できたが、本文はJavaScript必須で取得できなかった
2. レーザー彫刻対象の素材(木、アクリル、金属、廃プラ等)が未確定。QR/画像ターゲットの読み取り試作が必要
3. 会場の通信環境が未確定。M1/M2はオフラインファースト(PWAキャッシュ)前提で設計する
4. 認識対象を「運営が用意したゴミ片」に限定するか、「来場者が持ち込む任意ゴミ」まで広げるかで難易度が変わる
5. 8th Wall現行版のXR Engineバイナリライセンスを、商用展示・クライアントワーク利用の観点で仕様化前に確認する
6. 音の保存をWAV書き出しまで行うか、Web再生のみとするかはM1仕様で決める

## 出典

### 画像認識・カメラ

- [TensorFlow.js](https://www.tensorflow.org/js) - 参照日 2026-07-10
- [TensorFlow.js Models](https://www.tensorflow.org/js/models) - 参照日 2026-07-10
- [Teachable Machine](https://teachablemachine.withgoogle.com/) - 参照日 2026-07-10
- [MediaPipe Object detection guide for Web](https://developers.google.com/edge/mediapipe/solutions/vision/object_detector/web_js) - 参照日 2026-07-10
- [MediaPipe Image embedding guide for Web](https://developers.google.com/edge/mediapipe/solutions/vision/image_embedder/web_js) - 参照日 2026-07-10
- [MDN: MediaDevices.getUserMedia()](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) - 参照日 2026-07-10

### AR

- [MDN: WebXR Device API](https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API) - 参照日 2026-07-10
- [Can I use: WebXR Device API](https://caniuse.com/webxr) - 参照日 2026-07-10
- [8th Wall](https://8thwall.org) - 参照日 2026-07-10
- [Zapworks Universal AR SDK](https://zap.works/universal-ar/) - 参照日 2026-07-10
- [Zapworks Pricing](https://zap.works/pricing/) - 参照日 2026-07-10
- [MindAR GitHub](https://github.com/hiukim/mind-ar-js) - 参照日 2026-07-10
- [AR.js Documentation](https://ar-js-org.github.io/AR.js-Docs/) - 参照日 2026-07-10
- [model-viewer](https://modelviewer.dev/) - 参照日 2026-07-10
- [Vuforia Model Targets](https://developer.vuforia.com/library/objects/model-targets) - 参照日 2026-07-10

### 生成(音・画像)

- [Tone.js](https://tonejs.github.io/) - 参照日 2026-07-10
- [p5.js](https://p5js.org/) - 参照日 2026-07-10
- [MDN: Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) - 参照日 2026-07-10
- [Chrome for Developers: Autoplay policy in Chrome](https://developer.chrome.com/blog/autoplay/) - 参照日 2026-07-10
- [Can I use: WebGPU](https://caniuse.com/webgpu) - 参照日 2026-07-10

### NFC・保存

- [MDN: Web NFC API](https://developer.mozilla.org/en-US/docs/Web/API/Web_NFC_API) - 参照日 2026-07-10
- [Can I use: Web NFC](https://caniuse.com/webnfc) - 参照日 2026-07-10
- [Chrome for Developers: Interact with NFC devices on Chrome for Android](https://developer.chrome.com/docs/capabilities/nfc) - 参照日 2026-07-10
- [Apple Developer: Adding Support for Background Tag Reading](https://developer.apple.com/documentation/corenfc/adding-support-for-background-tag-reading) - 参照日 2026-07-10(本文はJavaScript必須で取得不可)
- [WebKit Blog: Full Third-Party Cookie Blocking and More](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/) - 参照日 2026-07-10
- [MDN: Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API) - 参照日 2026-07-10
- [web.dev: Common techniques to build offline applications](https://web.dev/articles/offline-cookbook) - 参照日 2026-07-10

## 補足(自律判断ログ)

- 指示書はClaude Code実行を想定していたが、本セッションではCodexが直接作業したため、成果物冒頭は実行実態として「Codex / GPT-5 / 既定」を記録した
- 既存の未追跡ファイルは、Web検索不可を前提にした下書きだった。今回は公式情報を確認できたため、未検証注記を削除し、参照日付きの完成版へ差し替えた
- 低リスク判断として、M1/M2は無料・静的Web・オンデバイス中心に寄せた。課金、外部公開、ネイティブアプリ開発は仕様化前のユーザー判断事項として扱う
