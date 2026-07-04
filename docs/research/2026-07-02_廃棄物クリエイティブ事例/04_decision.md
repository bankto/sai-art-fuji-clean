# Decision Memo

- 上流: [00_brief.md](00_brief.md) / [01_raw_sources.md](01_raw_sources.md) / [02_analysis.md](02_analysis.md) / [02b_crosscheck.md](02b_crosscheck.md) / [03_fact_check.md](03_fact_check.md)
- 作成: 2026-07-04 / Cursor
- 方針: 判断材料まで整理する。採用 / 不採用 / 保留の最終決定はユーザーが行う

## 結論
保留。核となる採用候補は固まったが、「表現アーカイブ」としてどこまで広く含めるか、境界線上の事例の扱いはユーザー判断が必要。

## 理由
- `03_fact_check.md` により、Claude 版と Codex 版の食い違い7件は実質解消し、Codex 追加分も「採用可6件 / 条件付き2件 / 保留2件」まで整理できた
- `00_brief.md` の除外基準は「表現・体験を伴わない純粋なリサイクル技術」。工業材料系・農業副産物系は、この境界線に直接触れる
- すでに高確度かつ現行性の高い参照群だけで、Phase 2 のまとめサイトと Phase 3 のアイデア出しに進めるだけの厚みがある
- 一方で、歴史的重要性は高いが現行性が弱い事例も多い。`現行DB` と `歴史/終了アーカイブ` を分けると、判断と運用が安定する

## 根拠（重要ソース）
- `00_brief.md`: 除外基準は「表現・体験を伴わない純粋なリサイクル技術」、判断基準は「表現の独自性 / 素材への向き合い方 / 自プロジェクトで参考にできるか」
- `03_fact_check.md`: NEWSED は公式更新2021-04止まり・公式ストア404、モノ：ファクトリー見学受付は404、PLASTICITY は新公式で販売継続、buøy は `buoy.co.jp` と `buoy.yokohama` を確認
- `03_fact_check.md`: Codex 追加分は RAIR Philly / WasteBoards / The Wasteshed / SCRAP / Emeco 111 / ReBuilding Center JAPAN が採用可、Plasticiet / REMARE が条件付き、HONOKA / Moffat Takadiwa が保留
- `02b_crosscheck.md`: 工業材料系（UBQ / ByFusion / ECONYL / RiverRecycle）と農業副産物系（Orange Fiber / Pinatex / VEGEA）はブリーフ境界線上

## 採用する事例・方向性
- 核候補1: **現場を開放する型**。石坂産業、武蔵野クリーンセンター、上勝 WHY、Recology AIR、ReTuna、ペッチョーリ。自分たちの主体が企業・自治体寄りでも接続しやすい
- 核候補2: **来歴を物語にするプロダクト型**。buøy、Carton、PLASTICITY、Elvis & Kresse、Nozomi Project、FREITAG。Phase 2 の記事化やデータ整備と相性が良い
- 核候補3: **調査・批評・記憶を伴う型**。豊島のこころ資料館、Formafantasma、Garbage Patch State、Alejandro Durán、Mandy Barker、青野文昭。単なる「きれいなアップサイクル」に寄らない深さを担保できる
- Codex 追加分の即採用候補: WasteBoards、The Wasteshed、SCRAP Creative Reuse、RAIR Philly、Emeco 111 Navy Chair、ReBuilding Center JAPAN
- 歴史/終了枠として別レイヤー管理が妥当: NEWSED、Trash Isles、gomi_pit BAR、Rinne.bar、Welcome to Sodom。参照価値は高いが、現行事例としては扱わない
- 条件付き追加候補: Plasticiet、REMARE。公式サイトは稼働しているが、2024〜2026 の日付つき活動確認が弱く、現行性を盛らない条件なら採用可

## リスク・不確実な点
- モノ：ファクトリーは会社・事業自体は現行だが、見学受付を現在形で書けない。見学可否を前提にするなら電話確認が必要
- 長坂真護 / Welcome to Sodom は、舞台となるアグボグブロシー旧スクラップヤードが2021年7月に強制撤去されており、現在形の文脈づけに注意が必要
- CopenHill は体験デザインの参照としては強いが、焼却容量過大やごみ輸入依存への批判があり、政策モデルとして無批判に持ち上げるのは危険
- HONOKA、Marina DeBris、Moffat Takadiwa は現行性または一次性が弱い。主要事例に入れるなら追加確認が必要
- NEWSED を「現行ブランド」、Emeco 111 を「111本由来の現行仕様」、Moffat を「公式確認済み」と書くのは不可

## 反対意見・別案
- 厳しめ案: `00_brief.md` を厳密運用し、工業材料系・農業副産物系は除外する。Phase 2 は「表現された事例」に集中できる
- 広め案: 工業材料系・農業副産物系も「制作インフラ / 素材レイヤー」として別枠掲載する。Codex 版の強みを捨てずに済む
- 表示設計案: CSV とまとめサイトでは `現行` / `歴史・終了` / `条件付き` / `保留` の4区分を持たせる。事実関係の混線を防げる
- 境界線上の論点: Materials for the Arts、RAIR Philly、The Wasteshed などの「制作拠点」は、作品そのものではないが表現の基盤として残す価値が高い

## 次にやること
→ [05_next_actions.md](05_next_actions.md)
