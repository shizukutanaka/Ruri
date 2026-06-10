# Research Log — Ruri / 微分音・世界調律 (arxiv中心)

> 2026-05 調査。Plan.md の改善根拠。一次は arxiv、補助に標準仕様・実測資料。

## 主要文献

| ID | 文献 | 知見 |
|----|------|------|
| 2503.11956 | Computational Extraction of Intonation and Tuning Systems (Iranian vocal) | Hz→cents変換, ピッチヒストグラム+DTWで実演奏から調律を抽出。微分音MIDI表現= MIDI分解能2倍化(sori/koron) |
| 2508.01498 | ShrutiSense (Indian classical) | 22シュルティ + ラーガ遷移文法。FST + grammar-constrained HMM。「既存の記号音楽ツールは微分音とラーガ文法を扱えない」=本プロジェクトの穴 |
| 1706.04338 | Playing Music in Just Intonation (adaptive tuning) | 和音をJIへ適応調律(各音程の逸脱最小化最適化)。Mutabor=微分音言語の先行 |
| MCM 2024 | Quarter-Tone Music rooted in harmonic series | 1/4音 ≈ 11/8(第11倍音)。比ベース定義 |

## 標準・フォーマット(出力経路)

- **Scala .scl/.kbm**: 微分音調律交換の事実上標準、最広範対応。フォーマットは公開・自由実装。アーカイブ5350+件は「自由DL」だが明示再配布ライセンス無し → 一括同梱回避。(huygens-fokker.org)
- **.tun (AnaMark)**: 二次の調律フォーマット、多数シンセ対応。
- **MTS (MIDI Tuning Standard) SysEx**: MIDIファイルにノートと共に同梱可 → 自己完結微分音MIDI。
- **MPE**: ノート毎pitch-bend。互換性高(古い/モノ機でもbend応答)だが1ノート1ch=同時~15音。
- **MTS-ESP (ODDSound)**: master/clientでDAW横断リアルタイム調律。Mini無償が .scl/.kbm/.tun 読込。
- **MusicXML**: `<alter>`小数でcents表現可だが、MuseScore等が1/4音へ丸め/未実装。記譜用と割切る。
- 再生検証: **Surge XT**(無償OSS, 調律実装の事実上標準)。
- 先行実装: music21(BSD, `Microtone`=cents), ScaleWorkshop(Sevish)。

## 文化別の含意

- **ガムラン**: スレンドロ≈5音/ペロッグ≈7音(中部ジャワは9-EDO近似)。合奏/村ごとに調律が異なり、オクターブ伸張、楽器が非整数倍音 → 単一正規形を持たない。Ableton等は合奏別実測を公開。
- **マカーム**: 24-TET(50cent)近似が一般だが実践と乖離(Arel-Ezgi-Uzdilek論争, トルコ79音論, Holdrian comma)。本質は旋律的旋法。和声化は研究フロンティア(perceptual tempering)。
- **ラーガ**: 22シュルティ + 旋律遷移文法。和声概念は希薄。

## 改善点 → Plan.md 反映済

1. cents内部表現は妥当。**比(ratio)を第一級**追加(純正律/倍音調律の精度保全)
2. 調律に**単一正規形なし** → `reference_hz`/`octave_ratio`/`source`/`region` をメタ必須化、50cent固定グリッド前提を破棄
3. スコープを**旋法/スケール/ジンス/ラーガ一級化**、微分音の和声化は experimental 分離
4. 出力を**多経路化**: .scl/.kbm(一次) + .tun + SMF+MTS + MPE(15音制限明記) + MTS-ESP、検証=Surge XT
5. **MusicXMLは記譜用**と割切り(下流が微分音を丸める)、真実源は Scala/MTS
6. データソース確定: フォーマット実装+ユーザーインポート+一次出典の少数キュレーション(アーカイブ一括同梱せず)
7. **非整数倍音**文化はピアノ音源代用不可 → 加算合成/実測サンプルを任意層、音色近似を明示

## 未追跡(任意・後続)

- 記号音楽トークン化(将来ML導入時): 微分音対応トークナイザの有無
- ジンス(マカーム構成テトラコルド)の機械可読データセット

---

# 第2回調査 (Phase 1焦点: 和音生成・運指・合成・協和)

## 主要文献・知見

| 出典 | 知見 |
|------|------|
| Sethares "Tuning, Timbre, Spectrum, Scale" / Plomp-Levelt | **協和は timbre 依存**。部分音整合で決まり小整数比に限らない。ガムラン実測スペクトルは実調律で粗さ最小・12-TET化で粗さ増。Thai 7-TET は ranat 部分音と整合。粗さ = 全部分音対の Plomp-Levelt 総和(d(x)=e^-ax − e^-bx、zero-dep実装可) |
| Cambouropoulos et al. GCT (SMC/ICMC 2014) | イディオム非依存の和音表現(分析・生成両用、非調性も)。三度堆積を前提しない |
| 2603.29710 (biomechanical piano chords, 2026) | 理論上協和でも手で押さえられねば無意味。手形辞書 + 音程級(IC)ベクトル + 粗さscoring。理論chord空間と楽器別演奏可能空間のギャップ |
| 2510.10619 / Burlet&Fujinaga A*-Guitar / Hori minimax Viterbi | 運指生成= 弦フレット遷移を重み付きDAG化 → A*/DP で最小ストレッチ・最小移動。生体力学(手幅)制約。ML不要で決定的に解ける |
| 2508.07987 (fingerpicking) | 撥弦合成= 拡張Karplus-Strong(物理挙動近似、軽量・zero-dep) |
| REMI/REMI+ (huang2020/von2023) | 記号音楽トークン化。将来ML導入時の参考(現フェーズ対象外) |

## 改善点 → Plan.md 反映済

1. **音色/スペクトル層を一級化**(部分音集合: harmonic/piano-like/bell/実測)。協和判定と合成の単一真実源
2. **Plomp-Levelt/Sethares 粗さscorer** を協和判定に採用。西洋協和規則を非西洋に当てない。「この楽器でこの和音が使えるか」の主指標
3. **和音抽象をイディオム非依存に**(三度堆積前提を排除、音程級ベクトル記述子)
4. **運指=決定的グラフ + A*/DP**(最小ストレッチ・手幅制約)。ギター=弦フレットDAG、ピアノ=手形。ML不要
5. **合成= Karplus-Strong(撥弦) + 加算/モーダル(金属体鳴)**。SoundFont依存を脱し、スペクトル層と共用
6. (experimental) スペクトルから低粗さスケール導出(Sethares適応調律)= 調律提案機能の素地

## 実装メモ

- Sethares/Plomp-Levelt は公知アルゴリズム(算法は著作権外)。書籍は出典明記。実装は公式の指数差モデルから自前。
- 粗さscorer + 運指コストは性質テスト対象(I7): 粗さは非負・同一音で0・対称、運指コストは単調性。

---

# 第3回調査 (生成理論 + scorer改良)

## 主要文献・知見

| 出典 | 知見 |
|------|------|
| Carey-Clampitt / Erv Wilson (MOS) | 生成音程の反復+周期還元でスケール生成。well-formed=Myhill性(各generic音程が2つのspecificサイズ)。五音/七音音階はMOS。非オクターブ周期も可 |
| Clough-Douthett (最大均等) | c音中にd音を最も均等配置(床関数の閉形式)。任意EDOで diatonic 様部分集合を生成 |
| axiomatic scale theory (2019) / 0909.0039 | スケール=巡回的pc集合は世界共通(Savage 2015)。生成/well-formed/最大均等を統一公理化 |
| Stolzenburg 2015 (1306.6458) | harmonicity=周期性検出。和音の比を有理近似しLCM/周期で協和をランク。テンペラメントは~1%で近似 |
| Harrison-Pearce 2020 / Eerola-Lahdelma 2021 | 協和=**合成**(roughness + harmonicity + familiarity)。粗さ単独は不十分。harmonicityをStolzenburg化で予測 62%→73%。familiarityは文化的で音響モデル外 |

## 改善点 → Plan.md 反映済

1. **生成をMOS/最大均等に**(和音表を廃す)。tuning非依存・非オクターブ可。和音=部分集合をscorer採点
2. **scorerを合成指標化**: 粗さ(実装済) + harmonicity/periodicity(Stolzenburg式, 比の有理近似, zero-dep, JI native)。両成分を別提示
3. **acoustic-only と明示**: familiarity(文化)は音響モデル化不能。scorerは記述子であって美的判定でない。「良/悪」を出さない(非西洋尊重 + evenhandedness)

## 実装メモ(次フェーズ)

- MOS生成: `generator_cents, period_cents, count` → cents配列。well-formed判定=generic音程が2サイズか
- 最大均等: `floor((c*k+m)/d)` k=0..d-1
- harmonicity(Stolzenburg): 比集合を共通分母で整数化→簡約→周期=lcm。粗さと別軸でレポート
- 全て性質テスト: MOSはoctave周期で12-TET一致, 最大均等は既知(diatonic)一致, harmonicityは単純比<複雑比

---

# 第4回調査 (運指: ピアノ・ギター)

## 主要文献・知見

| 出典 | 知見 |
|------|------|
| Burlet & Fujinaga "A*-Guitar" (via 2506.14223) | 弦×フレットの全可能位置をノード、辺重みを生体力学(フレット間移動難度・和音の指スパン・第7フレット超の罰則)とした**グラフ最短経路A***で最適タブ生成。**調弦・フレット数・カポ位置を入力**に取る → 非標準調弦/微分音フレットに自然拡張可 |
| Keating "Graph Engine for Chord-Tone Soloing" (2510.19666) | コード進行→各コードのコードトーン集合をノード、遷移を辺とした**決定的**グラフ最短路。出力はtab。決定的ゆえ同入力=同出力(再現性) |
| TabGen / AutoTab (semish) | 各和音で全位置組合せのグラフを構築、playability重みで最小努力の遷移を選択。複数viable解を保持 |
| Nakamura et al. "Statistical Learning of Piano Fingering" (1904.10237) | コストベースモデル + VNS最適化。**運指は奏者の手形・知識・表現で複数最適があり個人差大**。chord-level HMM=コストモデルの確率的定式化 |
| 1904.10237 / 2111.08009 | コスト関数の重みは理論的に定めにくい → データ/個人で調整。RL/HMMはML経路だが、コストベースA*で十分実用(ML不要) |
| FürElise 2410.05791 / PianoMotion10M 2406.09326 | 物理的手**動作**生成(RL+diffusion)。Ruriのスコープ外(静的運指のみ扱う、動作生成は過剰) |

## 改善点 → Plan.md 反映済

1. **運指=重み付きグラフ + A*最短経路**に確定(ML不要・決定的・再現性)。ノード=弦×フレット/鍵×指、辺=生体力学コスト
2. **調弦/カポ/フレット数を入力パラメタ化** → 非標準調弦・微分音フレット対応、12-TET前提を排除
3. **個人差を `HandProfile` で一級パラメタ化**(手幅・最大ストレッチ・方針)。唯一解を仮定しない
4. **K-best 複数解**を返す(教育/編曲)。最短一意に固定しない
5. スコープ確定: **静的運指のみ**(押下可能性+最小コスト)。物理動作生成/RLは対象外(I3 過剰機能の削除)

## 実装メモ(次)

- ギター: `Instrument{ openStringsCents[], fretCount, capo }` → 各targetピッチの (string,fret) 候補列挙 → 和音=各弦1音・同時押下可の組、辺重み=Σ(指移動 + ストレッチ + 高ポジション罰) → A*
- ピアノ: 鍵位置は一意なので「運指(どの指)」割当のみ。手幅制約下の指→鍵割当を最小コストで
- 性質テスト: 解は必ず全target音を被覆 / 制約(最大ストレッチ)違反ゼロ / コスト単調(難パッセージ≥易) / 決定的(同入力同出力)
- 微分音フレット: openStringsCents + fretStepCents を任意化(12-TET固定にしない)

---

# 第5回調査 (競合 + 協和の参考実装)

> 詳細は competitive-analysis.md。ここでは技術的裏取りのみ。

## 協和scorer実装の検証(既存実装と一致確認)

| 出典 | 知見 |
|------|------|
| dissonant (PyPI, bzamecnik) | Sethares1993粗さ=全部分音対の総和(Ruri実装と同一方針)。論文の定数低精度をコードで補正(Ruriも係数を明示) |
| Sethares calculators (aykutcaglayan / maxchanhi) | プリセット音色 harmonic/piano-like/bell/stretched + 局所極小=協和音程の自動検出。**Ruriの spectrum.ts/dissonance.ts と完全同型**(独自実装の妥当性確認) |
| marimba例 (alpof) | 部分音 1.0, 2.758, 5.406, 8.936 → 非整数倍音ゆえ協和音程が通常の五度/四度/三度とずれる(RuriのbellSpectrumテストとSethares原典が一致) |
| Garrigan et al. (Wisconsin) | harmonic音色のPlomp-Levelt曲線は 1/1,2/1,3/2,4/3,5/4,5/3,6/5 に極小 → Ruriのgenerate.test「既知極小オラクル」と一致 |

→ Ruriの協和エンジンは確立アルゴリズムと一致。差別化は**アルゴリズムでなく統合**(運指/コード辞書/DTM出力との結合)。

## 競合からの改善点(Plan.md反映済)

1. Scala/.tun **双方向**I/O(取込必須=Scale Workshop資産の入口)
2. 協和×演奏可能性の**同時提示**をUI核に(競合唯一の空白)
3. リンク共有 + VST/MTS-ESPエクスポート
4. 左手モード + 複数ポジション(運指UX標準)
5. 非西洋弦楽器プリセット(ウード/サズ/箏)
6. 脱植民地的スタンス明文化(Leimma)
7. 採譜・生成音楽はやらない(スコープ膨張回避 I3)

---

# 第6回調査 (世界調律データの出典 — 改善点#3)

> 詳細は data-sourcing.md。実測値の所在とライセンス確定。

## 主要データ源

| 領域 | データ源 | 区分 |
|------|---------|------|
| マカーム | SymbTr(2200曲, Bozkurt), Cairo1932 corpus(arxiv 2506.14503) | measured |
| マカーム理論 | AEU 53-TET Holder, Yarman 79音 | theoretical(実践と乖離=計算機分析で確立) |
| ガムラン | Surjodiningrat1972(27ガムラン→ペロッグ9-EDO選好), Kunst/Polansky 実測, Ableton実測(Tugu=472Hz) | measured主体 |
| ラーガ | 22シュルティ(2508.01498), Serrà2011(Carnatic=JI/Hindustani=ET) | melodic modal |

## 確定した含意(Plan/data-sourcing反映)

1. **唯一正解なし** → 「出典付き一具体例」として収録、measured/theoretical峻別、provenance必須
2. **ガムランは octave_ratio 伸張 + 非整数倍音spectrum併載**(協和scorerの前提)、region/ensemble明記
3. **AEU等の理論近似は実践と非整合** → measuredを一級、theoreticalは注記付き
4. 同梱はオープンライセンス値のみ、商用不可は参照リンクに留める(I4)
5. ウードのフレットレスは fret連続=別モデル要(後続Issue、現instrument.tsはフレット前提)

---

# 第7回調査 (UI/UX — 優先順位2、詳細は ui-research.md)

## 定石

| 領域 | 定石 | 出典 |
|------|------|------|
| 微分音入力 | アイソモーフィック鍵盤(同和音=同形, 任意EDO/非オクターブ, 色マッピング) | Lumatone, Terpstra, Xenharmonic Keyboard |
| 協和可視化 | 2音=2D粗さ曲線(12-TETグリッド背景), 3音=ヒートマップ, リアルタイム数値 | Datawrapper/jjensen/aykutcaglayan/bionichaos/ScaleExplorer |
| 協和+鍵盤統合 | xenboard-actm が Sethares+Euler でリアルタイム協和表示済 | GitHub rickgiantsteps |

## 差別化の再評価(重要)

- 「アイソモ鍵盤」「協和可視化」は**単体でコモディティ化済**(xenboardが統合実装)
- Ruriの非代替価値 = **実楽器運指 + DTM出力 + 出典付き世界実測調律** の3点に精緻化
- → UIの主役を運指図と出力に。鍵盤/協和曲線は土台

## 改善点 → 反映済

1. 鍵盤=アイソモーフィック六角格子主候補(MOS生成が基盤)
2. 協和=2D曲線+リアルタイム数値, timbre切替前面
3. UI主役=運指図+DTM出力(差別化はここ)
4. 色は補助・数値/テキスト必須(A11y/EAAと一致)
5. xenboard等を関連プロジェクトとしてREADME記載(誠実)

---

# 第8回調査 (/loop 10カテゴリ×10 — 詳細は improvement-matrix.md)

## 補充検索の知見(未調査ギャップ)

| 領域 | 知見 | 出典 |
|------|------|------|
| Karplus-Strong | 単一オシレータ並コストで倍音列全体を生成。撥弦/打弦/一部打楽器。微調律は遅延線の補間(fractional delay)。zero-dep web実装可 | Karplus-Strong1983, Jaffe-Smith EKS1983, web実装多数 |
| モーダル/加算 | KS=加算合成・ウェーブガイドと数学的に接続。非整数倍音(ガムラン)はモーダル(実測部分音) | Bilbao, Smith |
| PWA offline | service worker=ネットワークプロキシ、cache-first(静的)/network-first(動的)/SWR。HTTPS必須。iOS Safari制限厳しい | MS Edge docs, MDN js13k |
| PWAセキュリティ | HTTPS+HSTS必須、CSP厳格(XSS/clickjack)、SW scope制限、dep最新化、サプライチェーン=攻撃面 | appinstitute 2025 |
| 合成のスコープ | 微分可能/ニューラル合成(2407.05516 DMSP)は過剰 → KS+加算+モーダルで十分(I3) | arxiv 2407.05516 |

## 確定: 100項目を improvement-matrix.md に集約

- ✅実装済: C1×4, C2×4, C3×3, C4×4, C5×3, C6×2, C10×3 = 計23項目が完了
- 🔜次フェーズ: 大半
- 📋後続Issue: フレットレス, ラーガ文法, ニューラル合成, アーカイブ一括同梱
- ⚠リスク: voice爆発, 文化的正確性, スコープ膨張, 3音線形加算仮定, A11y後付け不可

優先順: C8データ → C6合成+C7 UI → C5出力 → C10配布+C9 A11y → C1-4拡張

---

# 第9回調査 (/loop 2回目 — 運用軸B1-B10、詳細は improvement-matrix-B.md)

> 前回(技術C1-C10)と直交する運用/プロダクト軸。重複回避。

## 最重要発見: 文化倫理(B1)が独立カテゴリ

| 知見 | 出典 |
|------|------|
| CARE原則(Collective benefit/Authority/Responsibility/Ethics)= 先住民データガバナンス、FAIR補完 | RDA Indigenous Data Sovereignty IG 2019 |
| OCAP(Ownership/Control/Access/Possession)= コミュニティが知識統制 | Schnarch 2004, Canada |
| 伝統曲・儀礼音楽は世代間所有・著作者不明で**著作権保護外** → 合法でも非倫理がありうる | Buffalo Law, ethnomusicology ethics |
| extractivism/universalism批判、rematriation、reciprocity | Cambridge YTM 2021, PMC anti-colonial |

→ data-sourcing.md に CARE/OCAP 統合済。データスキーマに cultural_context/community 必須化。「数値だけ抜き出さない」を一級要件に。

## B1-B10 カテゴリ(運用軸)

B1文化倫理 / B2オンボーディング / B3法務 / B4性能 / B5相互運用 / B6ドキュメント / B7収益 / B8プライバシー / B9テスト戦略 / B10拡張性

- 既✅: コードMIT, PII極小, 性質/golden/統合テスト, Scala双方向, ドキュメント群
- 反映: B1→data-sourcing(CARE/OCAP), B3/B7/B8→法的文書群(NOTICE/PRIVACY/CONTRIBUTING/SECURITY), B4/B9→WORKFLOW補強
- 大半は前回matrix(技術)の🔜と同時達成可
