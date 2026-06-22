# Qiita & Zenn調査に基づく改善仕様書

調査日: 2026-06-21
対象バージョン: ruri @ commit `81f390e` (`claude/product-analysis-sonnet-x86ho5`)

## 背景

日本語技術ブログ Qiita / Zenn でマイクロトーナル・MIDI チューニング・音律実装に関する記事を調査し、ruri が現状提供していない実用的なヘルパー群を抽出した。

## 調査対象記事

| #   | URL                                                        | 主題                                                    |
| --- | ---------------------------------------------------------- | ------------------------------------------------------- |
| A1  | https://qiita.com/Shamoji/items/563d6f960957daa3822b       | MIDIで12平均律以外の音律(ピッチベンド+マルチチャンネル) |
| A2  | https://qiita.com/hibit/items/4ddde647e7807f2ef7eb         | 有理数 + Dijkstra による JI 探索                        |
| A3  | https://zenn.dev/shizukakokoro/articles/efd0084d7ea99c     | JI に近い N-EDO 探索                                    |
| A4  | https://zenn.dev/kaityo256/articles/pythagorean_tuning     | 三音律の聴き比べ・比較                                  |
| A5  | https://qiita.com/IT_MINARAI/items/0bf0ac60be4bfdeeee9d    | JI vs 12-TET のセント差                                 |
| A6  | https://qiita.com/takayoshi1968/items/f9be70772d5dff8bd50f | 音名/MIDI/Hz/cents 変換チートシート                     |
| A7  | https://qiita.com/sen-ltd/items/61b13b49d0df19b68d4d       | 自己相関ピッチ検出と最寄り音度スナップ                  |
| A8  | https://qiita.com/atsushieno/items/4fe6ef8ba976e730cca6    | MPE 1.0 最終仕様(per-note bend 別感度)                  |
| A9  | https://zenn.dev/lilytechlab/articles/ad5f0e747b11ea       | SysEx 7-bit packing                                     |

## 長所(現状の強み)

- **比/cents の二層表現**で純正律の精度を温存(I7対象を明確化)
- **CARE データモデル**で出典必須・provenance を捨てない
- **Plomp-Levelt/Sethares 粗さ**を正確に実装、harmonic/bell timbre の極小値で性質テスト
- **MTS / Scala (.scl) / KBM / MPE / SMF / WAV / TUN** の I/O 完備
- **fast-check property tests** で往復性質を保証

## 短所(欠落しているユーザ要求パターン)

調査記事から繰り返し現れた "ユーザが毎回書き直しているコード" を抽出:

1. **Hz → 最寄り音度の snap** (A7) — チューナー的UI、再ハーモナイズで頻出
2. **JI vs N-TET セント差テーブル** (A5, A4) — 教育・比較用の定番出力
3. **JI 近似の最良 EDO 探索** (A3) — "この純正音程群を最も忠実に再現する N-EDO は?"
4. **有理数格子上の Dijkstra による JI 生成** (A2) — 究極の JI 自動探索
5. **音律間の比較表** (A4) — N 音律 × M 音度の差分マトリクス
6. **Hz → (音名, MIDI, cents off)** 1関数 (A6) — 単純だが毎回書く
7. **倍音アライメント診断** (A2 + Sethares) — なぜ和音が協和なのか、cent単位で可視化
8. **SysEx 7-bit packing 公開ヘルパ** (A9) — MTS 内部で持つ utility を export

## 改善点(実装スコープ)

最小実装可能な 4 関数を選定:

### I1. `snapHzToScaleDegree(hz, tuning, scale?) → { degreeIndex, octave, centsError }`

- **場所**: `src/core/scale.ts`
- **入力**: 周波数 Hz、調律(必須)、スケール(省略時は全音度)
- **出力**: 最寄り音度、オクターブオフセット、cents 誤差(符号付き)
- **アルゴリズム**: `freqToCents(hz, refHz)` → wrap to periodCents → 全音度との差の最小値

### I2. `tuningDeviationReport(reference, candidate) → Array<{ degreeIndex, refCents, candCents, deltaCents }>`

- **場所**: `src/core/tuning.ts`
- **入力**: 比較元 TuningSystem、比較対象 TuningSystem(degree 数が一致しない場合は短い方に揃える)
- **出力**: 音度毎の cents 差(符号付き、|delta| 昇順ではなく degreeIndex 順)
- **用途**: JI vs 12-TET の定番表、Scala vs MTS の差分検証

### I3. `pitchHzClassify(hz, a4Hz=440) → { midiFloat, midiNearest, noteName, octave, centsOff }`

- **場所**: `src/core/midi.ts`
- **入力**: 周波数 Hz、A4 基準
- **出力**: 浮動MIDI / 最寄り整数MIDI / 音名(C, C#, D...) / オクターブ番号 / 整数MIDIからのcents偏差
- **noteName** は配列 `['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']` を `midiNearest % 12` で参照
- **octave** は `Math.floor(midiNearest / 12) - 1` (MIDI 60 = C4)

### I4. `approximateEdoForIntervals(targetCents, minN=5, maxN=53) → Array<{ n, rmsCents, perInterval: Array<{ targetCents, nearestCents, deltaCents }> }>`

- **場所**: `src/core/tuning.ts`
- **入力**: 目標 cents 配列(例: `[386.31, 498.04, 701.96]` = JI maj3/p4/p5)、探索範囲
- **出力**: 各 N に対する RMS cents 誤差、N の昇順ではなく rmsCents 昇順でソート
- **アルゴリズム**: 各 N で各 target を最寄り EDO step に量子化、誤差の RMS を計算

## 検証

- 全関数に property test (fast-check) + ゴールデン値テスト
- `npm run check` 通過、カバレッジ閾値 80/80/75/80 維持
- 単一責務、既存型(`TuningSystem`, `freqToCents`, `centsToFreq`)を再利用

## 実装外(将来検討)

| 提案                                                  | 理由                                                       |
| ----------------------------------------------------- | ---------------------------------------------------------- |
| `generateJustLattice` (Dijkstra)                      | グラフ探索で実装複雑、計算量大、別 PR                      |
| `renderToMidiWithPitchBend` MPE/round-robin allocator | SMF と MPE の既存実装の合成、別 adapter                    |
| `packSysEx7bit` 公開                                  | `mts.ts` の内部実装を抽出するリファクタ、低リスクだが別 PR |
| `compareTunings` テーブル                             | `tuningDeviationReport` を N 音律に拡張、I2 検証後に着手   |
| `harmonicAlignmentScore`                              | spectrum と scale の cross-correlation、別 PR              |

## Round 2 調査(2026-06-21)

追加で Qiita/Zenn/note を調査し、現行リポジトリに存在しない領域(リズム、ピッチ検出、ピッチクラス集合論、非西洋音律)を抽出した。

### Round 2 改善点(実装スコープ)

#### J1. `euclideanRhythm(pulses, steps, rotation?) → boolean[]`

- **場所**: 新規 `src/core/rhythm.ts`
- **アルゴリズム**: Bjorklund アルゴリズム — k 個のヒットを n ステップ上にできるだけ均等に分布
- **出典**: [Strudel IDM 記事](https://zenn.dev/yasuna_ide/articles/4cfbd8b8f1ad50)
- **付随**: `rotateEuclidean(pattern, k)`, `rhythmOnsets(pattern, stepMs) → number[]`

#### J2. `autocorrelationPitch(samples, sampleRate, opts?) → { hz, clarity } | null`

- **場所**: 新規 `src/core/pitch-detect.ts`
- **アルゴリズム**: 時間領域自己相関 + パラボリック内挿(低音での1サンプル誤差を約3 centsに改善)
- **出典**: [sen-ltd / 自己相関チューナー](https://qiita.com/sen-ltd/items/61b13b49d0df19b68d4d)

#### J3. ピッチクラス集合論ツールキット(`normalForm`/`primeForm`/`intervalVector`/`forteNumber`)

- **場所**: 新規 `src/core/pcset.ts`
- **API**: 12-EDO だけでなく 19/22/24/31 EDO 対応(modulus 引数で一般化)
- **出典**: [西澤健一 / ピッチクラス・セット入門](https://note.com/nishizawakenichi/n/n86a3ccd6957f)

#### J4. アラブ音楽マカーム/ジンス構築(`jins`/`maqam`)

- **場所**: 新規 `src/core/maqam.ts`
- **API**: rast/bayati/hijaz/kurd/nahawand/saba 等の jins(三/四/五度音列)、maqam 構築
- **データ**: 24-EDO ベース、quarter-tone は `+150c` 等で表現
- **出典**: [iota studio マカーム解説](https://note.com/nagareruiota/n/n562b7b148f38), [ryoseiarabic ジンス](https://note.com/ryoseiarabic/n/n2ad050aed9f4)

### Round 2 実装外(将来検討)

| 提案                                          | 理由                                           |
| --------------------------------------------- | ---------------------------------------------- |
| `tonnetzCoords` + 新リーマン変換 P/L/R        | 既存 `voice-leading.ts` と統合判断が必要、別PR |
| `markovMelody` 学習+生成                      | API設計とseed/RNGの方針が必要、別PR            |
| `raga` (arohana/avarohana/pakad)              | 22-shruti 体系の選定とJ4より大規模、別PR       |
| `intervalRecognitionStages` (耳トレ4段階分類) | 教育用UI寄り、別PR                             |
| `historicalTuningPreset` (Werckmeister 他)    | `temperament.ts` の preset 拡張、別PR          |
| `abcNotation` adapter                         | 微分音記号(sagittal)の選定が必要、別PR         |

## Round 3 調査(2026-06-21)

第3回調査ではジャズ和声/伝統音律/グルーヴ/鍵検出に焦点を当てた。

### Round 3 改善点(実装スコープ)

#### K1. `detectKey(pcWeights[12]) → { tonic, mode, score, ranked }`

- **場所**: 新規 `src/core/key-detect.ts`
- **アルゴリズム**: Krumhansl–Schmuckler — 入力 chroma ベクトルと長/短調 12 回転プロファイルの相関を計算、上位を返す
- **出典**: [y_abe_bc コード推定](https://qiita.com/y_abe_bc/items/73778c9202ab4f8a7474), [platoronical 鍵検出](https://qiita.com/platoronical/items/9981670a903dd252a9be)

#### K2. ジャズ ii-V-I + リハーモ補助 (`iiVI`, `tritoneSub`, `secondaryDominantOf`)

- **場所**: 新規 `src/core/progression.ts`
- **API**: `iiVI(key, 'major'|'minor') → ChordSpec[]`, `tritoneSub(chord)`, `secondaryDominantOf(chord)`
- **出典**: [daisukekuroda 2-5-1](https://note.com/daisukekuroda/n/nabbe0e28be09), [mtdtkm_88 トライトーン置換](https://note.com/mtdtkm_88/n/n0c2f72d077e0)

#### K3. 日本箏調律プリセット (`kotoTuning`, `japaneseScale`)

- **場所**: 新規 `src/core/japanese-scale.ts`
- **API**: `japaneseScale('in'|'ritsu'|'miyakoBushi'|'yo'|'minyo') → number[]` (cents 配列)
- **箏調律**: `kotoTuning('hira'|'kumoi'|'nakazora'|'akebono'|'iwato', tonicHz) → number[]` (13弦の周波数)
- **出典**: [惣楽舎 箏調律](https://note.com/sohgakusha25/n/nc4fed8208a2e), [keijiikeya 都節](https://note.com/keijiikeya/n/nbbe7ab4ab196)

#### K4. スイング・クォンタイズ (`applySwing`, `quantizeTicks`)

- **場所**: 既存 `src/core/rhythm.ts` に追加
- **API**: `applySwing(events, ratio, subdivision) → events`, `quantizeTicks(ticks, grid, strength?) → ticks`
- **出典**: [satie スイング変換](https://qiita.com/satie/items/15619988cfb7a2046086), [tatmos REAPER クォンタイズ](https://qiita.com/tatmos/items/ebb0241c34c1c83de7b7)

### Round 3 実装外(将来検討)

| 提案                                  | 理由                                                    |
| ------------------------------------- | ------------------------------------------------------- |
| ガムラン slendro/pelog 生成器         | 各セット bespoke、テスト基準を選定後別PR                |
| comma toolbox (syntonic/Pythagorean)  | `cents.ts` の純粋拡張、低リスクだが別PR                 |
| 加算合成スペクトラム (PeriodicWave用) | `spectrum.ts` 拡張、Web Audio 連携の API 設計が必要     |
| polyrhythm スケジューラ (LCM)         | `rhythm.ts` への追加、K4 と同時 PR にしない方がレビュー軽い |
| neo-Riemannian P/L/R 操作             | `voice-leading.ts` との統合判断、別PR                   |
| JI subgroup 近似探索                  | `ratio.ts` 拡張、コストモデル選定後別PR                 |

## Round 4 調査(2026-06-21)

第4回調査では多声リズム/コンマ/トネッツ/ガムランに焦点を当てた。Round 3 の「将来検討」項目のうち 4 件を実装スコープに昇格。

### Round 4 改善点(実装スコープ)

#### L1. `polyrhythmPattern(divisors) → boolean[][]`

- **場所**: 既存 `src/core/rhythm.ts` に追加
- **アルゴリズム**: LCM(divisors) 長さの boolean[][] を生成; 各ボイスは divisors[i] パルスを LCM グリッドに均等配置
- **用途**: 3 対 4、4 対 5 等のポリリズム可視化・スケジューリング

#### L2. `nearestComma(cents) → CommaInfo | null`

- **場所**: `src/core/tuning.ts` の先頭に追加（`CommaInfo` インターフェースも同所）
- **コンマ辞書**: schisma(1.95c)、diaschisma(19.55c)、syntonic comma(21.51c)、Pythagorean comma(23.46c)、septimal comma(27.26c)、diesis(41.06c)、undecimal comma(53.27c)
- **返却**: 5 cents 以内に最寄りコンマがある場合のみ非 null

#### L3. Tonnetz 座標と Neo-Riemannian 変換 (`tonnetzCoords`, `neoRiemannianP/L/R`)

- **場所**: 新規 `src/core/tonnetz.ts`
- **アルゴリズム**: Cohn (1998) の五度格子座標 `x = (pc*7)%12`, `y = (pc*3)%12`; P/L/R の正確な定義(involution 性をテストで保証)
- **修正点**: R 変換の実装バグ(誤った note を drop していた)を修正済み

#### L4. `gamelanTuning(name) → readonly number[]`

- **場所**: 新規 `src/core/gamelan.ts`
- **スケール**: slendro(5音/約240c等分)、pelog(7音/不等)、pelog-pathet-nem/sanga/manyura の 5 種
- **注記**: 実機ガムランはアンサンブル毎に異なるため、これは民族音楽文献ベースの近似値

### Round 4 実装外(将来検討)

| 提案                                        | 理由                                            |
| ------------------------------------------- | ----------------------------------------------- |
| 加算合成スペクトラム (PeriodicWave用)       | `spectrum.ts` 拡張、Web Audio API 設計が必要    |
| JI subgroup 近似探索                        | `ratio.ts` 拡張、コストモデル選定後別PR         |
| tonnetz ビジュアライザ (SVG/Canvas)         | UI 層、別 adapter として設計が必要              |
| Raga (arohana/avarohana/pakad)              | 22-shruti 体系の選定と J4 より大規模、別PR      |
| `generateJustLattice` (Dijkstra JI 探索)    | グラフ探索で実装複雑、計算量大、別PR            |

## Round 5 — Melody, Harmony & Progression (M1–M4)

**研究メモ**: Qiita/Zenn の音楽理論記事では、メロディーの輪郭分析（アダムス輪郭理論）、コード進行のリズム分析、スケールモード展開、コード進行の緊張感分析が注目されている。

- M1: melodicContour — 音列の輪郭（U/D/R）を文字列で返す
- M2: harmonicRhythm — 和声リズム（変化位置・密度・平均持続）分析
- M3: scaleRotations — スケールの全ローテーション（モード展開）を返す
- M4: chordProgressionTension — コード進行の各和音の不協和スコアを返す

**将来の検討**: 音楽的緊張の頂点検出 / カデンツ認識 / ヴォイスリーディング評価 / 対位法チェッカー / レゲエスカラベース解析

## Round 6 — 音楽集合論・MIDI変換・部分集合・バス音最適化 (N1–N4)

- N1: intervalVector — 音程クラスベクトル(forte理論)
- N2: midiNoteToName — MIDIノート番号→音名変換 (C4/A#4/Bb4形式)
- N3: scaleSubsets — スケール音の部分集合列挙 (コード抽出)
- N4: fundamentalBassNote — 最低不協和バスノートの最適化

## Round 7 — 声部進行・色彩飽和・旋法借用・和声フィールド (O1–O4)

- O1: voiceLeadingDistance — 最小声部進行距離（パルシモニー）
- O2: chromaticSaturation — 半音階飽和度（使用音程クラス比率）
- O3: modalInterchange — 旋法借用音（借用音抽出）
- O4: harmonicField — 音階の和声フィールド（機能和声コード列）

## Round 8 — 転回形・音階内移調・異名同音・和音複雑度 (P1–P4)

- P1: chordInversion — n次転回形の生成
- P2: diatonicTransposition — 音階内度数移調
- P3: enharmonicEquivalents — 異名同音表記の列挙
- P4: chordComplexity — 和音複雑度（構造+スペクトル）

## Round 9 — 音符名変換・ソルフェージュ・音高集合・和音名判定 (R1–R4)

- R1: noteNameToMidi — 音符名→MIDIノート番号変換（midiNoteToNameの逆）
- R2: scaleDegreeToSolfege — 音階度数→ソルフェージュ変換
- R3: pitchClassSet — ピッチクラス集合の正規化
- R4: chordName — インターバル構造から和音名判定

## Round 10 — 音域・跳躍分析・コード進行生成・ピッチ移調 (S1–S4)

- S1: ambitus — 旋律音域（アンビトゥス）の半音数
- S2: melodicLeaps — 跳躍（3半音以上）の分析
- S3: generateChordProgression — ルートから和音進行を生成
- S4: transposePitchClasses — ピッチクラス群の半音移調

## Round 11 — スケール対称性・補音階・移調群・不協和曲線 (T1–T4)

- T1: scaleSymmetry — 音階の対称性（区間列回文）検定
- T2: complementScale — 補音階（使用外のPC集合）
- T3: scaleTranspositions — 全12移調の列挙
- T4: computeDissonanceCurve — ルートから各度数への不協和カーブ

## Round 12 — PC集合演算 (U1–U4)

- U1: isSubsetOf — PC部分集合判定
- U2: pcSetIntersection — PC集合の積集合
- U3: pcSetUnion — PC集合の和集合
- U4: scaleDistance — ジャカード距離（音階類似度）

## Round 13 — ゼータ関数・粗さプロファイル・スペクトル正規化・スペクトル類似度 (V1–V4)

- V1: zetaFunction — 音程クラスベクトルのゼータ関数メトリクス
- V2: roughnessProfile — 周波数ペアの粗さプロファイル配列
- V3: normalizeSpectrum — スペクトル振幅の正規化
- V4: spectrumSimilarity — スペクトル間のコサイン類似度

## Round 14 — 音階輝度・旋法・和音緊張感・旋律密度 (W1–W4)

- W1: scaleBrightness — 音階の輝度（上昇度/12n）
- W2: modeOf — 指定旋法の返却（正規化済み）
- W3: chordTension — 音階内コンテキストでの和音緊張度
- W4: melodicDensity — 旋律密度（持続時間加重変化率）

## Round 15: スペクトル・音程分析ヘルパ (X1–X4)

**テーマ**: 倍音スペクトルと音階の統計的分析ツール

### 研究トピック
- Qiita: 音楽情報処理における倍音重心（スペクトル重心）の応用
- Zenn: Scala/KBMフォーマットを超えた微分音音階の異名同音検出

### 実装
- X1: spectralCentroid — 振幅加重倍音重心（セント）
- X2: edoEnharmonicEquivalents — EDO度数の異名同音候補検索
- X3: commonTonesUnderTransposition — 移調時の共通音検出
- X4: scaleToIntervalHistogram — 音程ヒストグラム（ビン化）

## Round 16: スケール変換・対称性分析 (Y1–Y4)

**テーマ**: ピッチセットの補集合・反転・旋法転置・対称軸検出

### 研究トピック
- Qiita: 音律理論のPython/TypeScript実装 — 音階の対称性と旋法変換
- Zenn: 微分音における音程補集合とEDO度数分析

### 実装
- Y1: pitchSetComplement — EDOの補集合音程集合
- Y2: scaleMirror — 音階の反転（鏡映）
- Y3: modalTranspose — 旋法転置（モード回転 + 正規化）
- Y4: scaleSymmetryAxes — 反射対称軸の検出

## Round 17: 純正律誤差・連分数・倍音距離 (Z1–Z4)

**テーマ**: 音律の数論的・倍音的分析

### 研究トピック
- Qiita: 純正律比率の近似と誤差分析（TypeScriptで実装）
- Zenn: 連分数展開による音程の最良近似とEDO理論

### 実装
- Z1: justIntonationError — 各音度の最近傍純正律比率と誤差
- Z2: edoToContinuedFraction — セント値の連分数展開
- Z3: harmonicDistanceMatrix — ピッチクラス間倍音距離行列
- Z4: scaleRoughnessProfile — 音度ごとの根音に対するラフネス

## Round 18: スケール複雑度・音声進行・旋律輪郭 (AA1–AA4)

**テーマ**: 和声複雑度・スケール連結性・声部進行・旋律輪郭分析

### 研究トピック
- Qiita: 音楽理論のTypeScript実装 — 声部進行と旋律輪郭の定量化
- Zenn: Jaccard類似度による音階間の類似性分析

### 実装
- AA1: scaleComplexity — 平均倍音複雑度（セミトーン別ルックアップ）
- AA2: scaleConnectedness — Jaccard類似度による音階連結性
- AA3: chordVoiceLeadingDistance — 最小声部進行距離（総変位量）
- AA4: melodicContourSimilarity — 旋律輪郭類似度（符号列比較）

## Round 19: モジュレーション・倍音近似・チューニングドリフト (BB1–BB4)

**テーマ**: 音階モジュレーション距離・倍音列近似・チューニングドリフト・倍音部分重複

### 研究トピック
- Qiita: 転調の数値的表現 — 音階変化量とモジュレーション距離
- Zenn: 倍音列近似とチューニング精度分析

### 実装
- BB1: scaleModulationDistance — モジュレーション距離（正規化変化音数）
- BB2: harmonicSeriesApproximation — 目標音程の倍音列近似
- BB3: tuningFrequencyDrift — 音度の目標周波数からのドリフト（セント）
- BB4: harmonicPartialOverlap — 音程転置後の倍音重複数

## Round 20: クロマ・重心・コヒーレンス・リズム (CC1–CC4)

**テーマ**: 音階クロマベクトル・音高重心・音階一貫性・リズムインターロッキング

### 研究トピック
- Qiita: クロマ特徴ベクトルによる音階の指紋化（MIR応用）
- Zenn: アフリカのリズムインターロッキングの定量化

### 実装
- CC1: scaleChromaVector — EDOビン加重クロマベクトル
- CC2: pitchGravityCenter — 円周平均による音高重心
- CC3: scaleCoherenceScore — 参照音階との整合スコア
- CC4: rhythmicInterlockingScore — XORベースのリズム噛み合わせ指数

## Round 21: 微分音偏差・部分集合最適化・ビート・音色協和 (DD1–DD4)

**テーマ**: 微分音チューニング偏差・音階部分集合最適化・ビート周波数・音色依存協和度

### 研究トピック
- Qiita: Sethares音色協和モデルのTypeScript実装と純正律への応用
- Zenn: 微分音音律の12EDOからの偏差プロファイル可視化

### 実装
- DD1: microtonalDeviationProfile — 各音度のEDO参照からの偏差（セント）
- DD2: optimalScaleSubset — 参照音階最大整合の貪欲部分集合選択
- DD3: beatFrequencyPairs — ビート周波数閾値内の音頻ペア列挙
- DD4: timbreBasedConsonance — 音色スペクトルに基づく協和度（1/(1+roughness)）

## Round 22: 知覚的距離・認知パーシモニー・調和エントロピー・複雑度比 (EE1–EE4)

**テーマ**: 音律の知覚的・認知的・情報理論的分析

### 研究トピック
- Qiita: 調和エントロピー（Harmonic Entropy）のTypeScript実装
- Zenn: 音律の認知的パーシモニーとスケール設計の最適化

### 実装
- EE1: perceptualTuningDistance — 音律間の知覚的距離（平均ピッチ差）
- EE2: scaleCognitiveParsimony — 認知的パーシモニー（音数×変動係数の逆数）
- EE3: harmonicEntropyApproximation — 調和エントロピー近似（ガウス重み付き）
- EE4: tuningComplexityRatio — 有理数近似に基づく音律複雑度比

## Round 23: 音程一貫性・音律同型・スケールグラフ・倍音格子 (FF1–FF4)

**テーマ**: 音程パターンの一貫性・音律トポロジー・倍音格子座標系

### 研究トピック
- Qiita: Tonnetzeと倍音格子のTypeScript実装 — ピッチクラスの幾何学的表現
- Zenn: 音律の同型性分析と音程一貫性スコア

### 実装
- FF1: intervalConsistency — 音程クラス繰り返し率（一貫性）
- FF2: tuningIsomorphismScore — 音律間の音程構造同型スコア
- FF3: scaleGraphDensity — 音程閾値グラフの密度
- FF4: harmonicLatticePosition — 素数限界格子座標と最近傍有理比率

## Round 24: ピッチクラスエントロピー・音程曖昧性・音律ネットワーク中心性 (GG1–GG4)

**テーマ**: 音階の情報理論的・ネットワーク理論的分析

### 研究トピック
- Qiita: 音楽ネットワーク理論のTypeScript実装 — 調性中心性とモード親族関係
- Zenn: ピッチクラス分布のエントロピー分析と音程曖昧性

### 実装
- GG1: pitchClassEntropy — EDOビン分布のシャノンエントロピー（正規化）
- GG2: intervalAmbiguity — 近接音程ペアの曖昧性スコア
- GG3: tuningNetworkCentrality — 完全五度近傍ネットワーク中心性
- GG4: scaleModalNetwork — 旋法間共通音ネットワーク（降順ソート）

## Round 25: 仮想音高・粗さ曲線・表現性・歴史的距離 (HH1–HH4)

**テーマ**: 心理音響・音律の表現的・歴史的分析

### 研究トピック
- Qiita: 仮想音高（バーチャルピッチ）理論のTypeScript実装
- Zenn: 音律の表現性と歴史的距離分析

### 実装
- HH1: virtualPitchStrength — 候補仮想音高の倍音一致強度
- HH2: roughnessCurvePoints — 音程別ラフネス曲線（Sethares）
- HH3: scaleExpressiveness — 音程多様性×音域による表現性スコア
- HH4: tuningHistoricalDistance — 絶対Hz基準の音律RMS距離

## Round 26: 音響・スペクトル分析ヘルパ (II1–II4)

**テーマ**: 音響心理学の基本変換とスペクトル分析  
**実装**: II1–II4

| 関数 | 説明 |
|------|------|
| `barkScale` | Hz → Bark尺度変換（Zwicker公式） |
| `pitchSalience` | スペクトル重心（振幅重み付き比の平均） |
| `scaleStepVariety` | スケールのステップ種類数（ビン丸め） |
| `spectrumFlux` | 2スペクトル間の差分量（正規化RMS） |

## Round 27: 音程複雑度・エントロピー分析 (JJ1–JJ4)

**テーマ**: 音程クラスベクトルと調律複雑度指標  
**実装**: JJ1–JJ4

| 関数 | 説明 |
|------|------|
| `intervalClassVector` | 音程クラス頻度ベクトル（ビン丸め） |
| `frequencyRatioComplexity` | 周波数比の調和複雑度（log2(p)+log2(q)） |
| `melodicEntropy` | 旋律ステップ分布のシャノンエントロピー |
| `harmonicComplexityProfile` | 調律の各音度の複雑度プロファイル |

## Round 28: 調律格子・モード多様性分析 (KK1–KK4)

**テーマ**: 音律の倍音整合性・格子構造・モード多様性指標  
**実装**: KK1–KK4

| 関数 | 説明 |
|------|------|
| `scaleHarmonicGravity` | ルートへの重力的引力（距離重み平均） |
| `tuningOvertoneAlignment` | 調律と倍音列の整合度 |
| `scaleModalDiversity` | ユニークな旋法の割合 |
| `tuningLatticeSpread` | 調律複雑度の標準偏差（格子拡散度） |

## Round 29: スペクトル音響分析ヘルパ (LL1–LL4)

**テーマ**: スペクトル重心・平坦度・根音性・マスキング  
**実装**: LL1–LL4

| 関数 | 説明 |
|------|------|
| `spectralCentroidHz` | スペクトル重心（Hz単位、振幅重み） |
| `spectralFlatness` | スペクトル平坦度（Wienerエントロピー） |
| `scaleRootedness` | スケールの根音支持度（倍音整合スコア） |
| `partialMaskingScore` | 倍音間マスキング度（スペクトル密集度） |

## Round 30: スケール密度・和音カバレッジ分析 (MM1–MM4)

**テーマ**: スケール密度・調律ステップ分散・和音カバレッジ・倍音偏差  
**実装**: MM1–MM4

| 関数 | 説明 |
|------|------|
| `scaleDensityProfile` | ウィンドウ内の音密度プロファイル |
| `tuningStepsVariance` | 調律ステップ幅の分散 |
| `scaleChordCoverage` | スケールによる和音音程カバレッジ率 |
| `harmonicSeriesDeviation` | 倍音列への近似偏差（平均セント） |

## Round 31: 調性・音色・方向性分析 (NN1–NN4)

**テーマ**: 調性支持度・音程方向性・根音曖昧性・スケール色彩度  
**実装**: NN1–NN4

| 関数 | 説明 |
|------|------|
| `scaleTonicStrength` | 主音支持スコア（ダイアトニック引力） |
| `intervalDirectionalityBias` | 音程の上下半分への偏在度 |
| `chordRootAmbiguity` | 和音根音の曖昧性指標 |
| `scaleColorfulness` | 基準EDO比の色彩度（偏差正規化） |

## Round 32: 調律解像度・ペンタトニック・対称性 (OO1–OO4)

**テーマ**: 調律の純正律解像度・ペンタサブセット品質・調波流束・音程対称性  
**実装**: OO1–OO4

| 関数 | 説明 |
|------|------|
| `tuningResolutionFactor` | 純正率目標比への解像度スコア |
| `scalePentaSubsetQuality` | ペンタトニックサブセット充足率 |
| `harmonicFluxAcrossDegrees` | 隣接音度間の調波フラックス |
| `intervalGroupSymmetryScore` | ステップ音程の回文対称性スコア |

## Round 33: 導音・転調不変性・倍音バランス (PP1–PP4)

**テーマ**: 導音効果・転調不変性・和音因子バランス・倍音エネルギー配分  
**実装**: PP1–PP4

| 関数 | 説明 |
|------|------|
| `scaleLeadingToneStrength` | 半音下の導音効果強度 |
| `tuningTranspositionInvariance` | 転調後の自己相似性 |
| `chordFactorBalance` | 和音因子（根・3・5・7度）カバレッジ |
| `spectralOvertoneBalance` | カットオフ以下/以上の振幅バランス |

## Round 34: ステッププロファイル・ピッチクラス均衡 (QQ1–QQ4)

**テーマ**: スケールステップ分布・ピッチクラスバランス・倍音収束・ギャップ分析  
**実装**: QQ1–QQ4

| 関数 | 説明 |
|------|------|
| `scaleStepProfile` | ステップ幅のグループ化頻度プロファイル |
| `tuningPitchClassBalance` | ピッチクラス占有率（均衡度） |
| `harmonicSeriesConvergence` | 調律の倍音列収束度 |
| `scaleGapsProfile` | 250セント超のギャップ一覧 |

## Round 35: トリトーン飽和度・五度偏差・調波加速度 (RR1–RR4)

**テーマ**: 半音毒性・純正五度偏差・調波複雑度加速度・スペクトル純度  
**実装**: RR1–RR4

| 関数 | 説明 |
|------|------|
| `scaleTritoneSaturation` | トリトーン音程ペアの密度 |
| `tuningFifthDeviation` | 純正五度（702c）からの平均偏差 |
| `scaleHarmonicAcceleration` | スケール音度間の調波複雑度分散 |
| `spectrumPurityScore` | スペクトル比の整数純度スコア |

## Round 36: クロマカバレッジ・オクターブ一貫性・素因数複雑度 (SS1–SS4)

**テーマ**: 半音被覆率・オクターブ整合性・素因数複雑度・音程多様性
**実装**: SS1–SS4

| 関数 | 説明 |
|------|------|
| `scaleChromaticCoverage` | 12半音クラスの被覆率 |
| `tuningOctaveConsistency` | オクターブ対の一貫性スコア |
| `primeFactorComplexity` | 周波数比の素因数総数 |
| `scaleIntervalicRichness` | 50cビン単位の音程多様性 |

## Round 37: オクターブストレッチ・純正律スコア・声部進行 (TT1–TT4)

**テーマ**: オクターブ伸縮・和音純正律近似・スペクトル調波偏差・声部進行効率  
**実装**: TT1–TT4

| 関数 | 説明 |
|------|------|
| `scaleOctaveStretchFactor` | オクターブの1200c偏差率（%） |
| `chordJustIntonationScore` | 和音の純正律近似スコア |
| `spectrumHarmonicDeviation` | スペクトル比の整数倍音偏差 |
| `scaleVoiceLeadingEfficiency` | スケール間の声部進行距離 |

## Round 38: ピッチクラスタリング・黄金比・スペクトル尖度 (UU1–UU4)

**テーマ**: ピッチ密集度・黄金比近似・振幅尖度・ステップ周期性  
**実装**: UU1–UU4

| 関数 | 説明 |
|------|------|
| `scalePitchClustering` | ピッチのクラスタリング密度 |
| `tuningGoldenRatioProximity` | 黄金比音程への近似度 |
| `spectrumAmplitudeKurtosis` | スペクトル振幅の超過尖度 |
| `scaleModularStepPattern` | 基本音程の倍数ステップ割合 |

## Round 39: 音名変換・ミーントーン偏差・基音サポート (VV1–VV4)

**テーマ**: 半音音名マッピング・クォーターコンマミーントーン近似・支配倍音・基音バス支持  
**実装**: VV1–VV4

| 関数 | 説明 |
|------|------|
| `scaleToChromaticNames` | スケール音度の半音名マッピング |
| `tuningMeantoneDeviation` | クォーターコンマミーントーンへの偏差 |
| `spectrumDominantPartial` | 最大振幅の倍音成分 |
| `scaleFundamentalBassScore` | 基音バス支持（整数比近似） |

## Round 40: 半音密度・調律規則性・スペクトル拡散 (WW1–WW4)

**テーマ**: 半音音程密度・等分律規則性・スペクトル拡散・倍音系列マッチ数  
**実装**: WW1–WW4

| 関数 | 説明 |
|------|------|
| `scaleHemitonicDensity` | 半音（<150c）音程の密度 |
| `tuningRegularityScore` | ステップ幅の変動係数逆数 |
| `spectralSpread` | 周波数重心周りのRMS拡散（Hz） |
| `harmonicSeriesMatchCount` | 倍音列ピッチクラスへの一致数 |

## Round 41: インターバルベクトル・声部進行・最大均等集合 (XX1–XX4)

| # | 関数名 | 概要 |
|---|--------|------|
| XX1 | `scaleIntervalClassVector` | スケール内の音程クラスベクトル(IC vector)計算 |
| XX2 | `scaleVoiceLeadingDistance` | 2つの和音間の声部進行距離(最小二乗和の平方根) |
| XX3 | `scaleChromaticSaturation` | クロマチック分割のカバー率(半音階飽和度) |
| XX4 | `scaleMaximallyEven` | n等分からk音を選ぶ最大均等集合生成(Bresenham法) |

**参考**: IC vector はAllen Forte「Set Theory」; Maximally Even Sets はClough & Douthett (1991)。

## Round 42: スケール対称性・自己相似性分析 (YY1–YY4)

| # | 関数名 | 概要 |
|---|--------|------|
| YY1 | `scaleReflectionSymmetry` | スケールの反射対称性スコア(最大対称軸でのマッチ率) |
| YY2 | `scaleRotationalSymmetry` | 回転対称性カウント(k段シフトで同一音程パターンとなる割合) |
| YY3 | `scaleFractalDimension` | ボックスカウンティング法によるフラクタル次元推定 |
| YY4 | `scaleSelfSimilarityScore` | ズームレベル間の音程列相関による自己相似スコア |

**参考**: Fractal dimension of musical scales; Messiaen の限定移調音階は高い回転対称性を持つ。

## Round 43: スケール複雑度・表現力・調性引力指標 (ZZ1–ZZ4)

| # | 関数名 | 概要 |
|---|--------|------|
| ZZ1 | `scaleComplexityRatio` | 音程サイズの変動係数(CV)によるスケール複雑度 |
| ZZ2 | `scaleExpressivenessIndex` | 異なる音程サイズ数 / (n-1) による表現力指数 |
| ZZ3 | `scaleHarmonicComplexity` | 最近傍整数比(p+q)の平均による和声複雑度 |
| ZZ4 | `scaleTonalGravity` | トニックへの距離に基づく調性引力スコア |

**参考**: 調性引力はLerdahl「Tonal Pitch Space」; 和声複雑度はHarmonicity metrics (Gill & Purves 2009)。

## Round 44: スケール転調・モジュレーション分析 (AAA1–AAA4)

| # | 関数名 | 概要 |
|---|--------|------|
| AAA1 | `scaleTranspositionDistance` | 転調量に対する最小距離(最近傍マッチング) |
| AAA2 | `scaleModulationGraph` | 音度間モジュレーション可能性の隣接行列 |
| AAA3 | `scaleModulationConnectivity` | モジュレーショングラフの連結度(接続ペア率) |
| AAA4 | `scaleBestModulationTarget` | 最小転調距離を与える最適転調先 |

**参考**: Modulation distance in Neo-Riemannian theory; Transposition networks in Lewin (1987)。

## Round 45: スケール組合せ論・列挙 (BBB1–BBB4)

| # | 関数名 | 概要 |
|---|--------|------|
| BBB1 | `scaleSubsetCount` | k要素部分集合数 C(n,k) |
| BBB2 | `scaleModeCount` | 回転により異なる音程列となるモード数 |
| BBB3 | `scaleComplementCents` | クロマチック音階内の補集合(非スケール音) |
| BBB4 | `scaleNecklaceCount` | 回転同値類によるネックレス数 |

## Round 46: トネッツ座標・近傍グラフ分析 (CCC1–CCC4)

| # | 関数名 | 概要 |
|---|--------|------|
| CCC1 | `scaleTonnetzCoordinates` | ネオリーマン・トネッツ格子座標への写像 |
| CCC2 | `scaleTonnetzSpan` | トネッツ上でのスケールの最大スパン |
| CCC3 | `scaleNeighborhoodGraph` | 音程近傍グラフの隣接行列 |
| CCC4 | `scaleNeighborhoodDensity` | 近傍グラフの平均隣接度(密度) |

**参考**: Neo-Riemannian Tonnetz (Cohn 1998); Pitch-class neighborhood graphs in voice-leading geometry。

## Round 47: ピッチクラス集合・フォルテ記号・音程クラスベクトル (DDD1–DDD4)

| # | 関数名 | 概要 |
|---|--------|------|
| DDD1 | `scalePitchClassSet` | クロマチック音階への写像によるピッチクラス集合 |
| DDD2 | `scalePrimeForm` | Forte流プライム形式(最コンパクト回転・逆行) |
| DDD3 | `scaleForteNumber` | "n-m"形式のForte番号(簡易版) |
| DDD4 | `scaleIntervalClassContent` | IC1〜IC6の音程クラス内容ベクトル |

**参考**: Allen Forte「The Structure of Atonal Music」(1973); Set-Theory in music analysis。

**参考**: Scale complement theory (Forte 1973); Necklace enumeration in combinatorics on words。

## Round 48: マイクロトーナル固有指標 (EEE1–EEE4)

| # | 関数名 | 概要 |
|---|--------|------|
| EEE1 | `scaleEDOApproximationError` | EDO近似誤差の平均(純正律スケールの12-TET偏差など) |
| EEE2 | `scaleMeantoneDeviation` | 1/4コンマミーントーン音律からの平均偏差 |
| EEE3 | `scaleWellTemperamentScore` | 全半音階をカバーする「良律」スコア |
| EEE4 | `scaleJustIntonationRatioScore` | 純正律比への近接度スコア(素数制限付き) |

**参考**: Meantone temperament (Barbour 1951); Well temperament criteria (Lindley 1984)。

## Round 49: スケール密度・分布分析 (FFF1–FFF4)

| # | 関数名 | 概要 |
|---|--------|------|
| FFF1 | `scaleGapVariance` | 音程ギャップサイズの分散 |
| FFF2 | `scaleDensityHistogram` | 周期をbin分割した音高密度ヒストグラム |
| FFF3 | `scaleDensityEntropy` | 密度プロファイルのシャノンエントロピー |
| FFF4 | `scaleUniformityScore` | KS統計量ベースの均一分布スコア(1=完全均一) |

**参考**: Scale uniformity and gap distribution analysis; KS test for pitch uniformity。

## Round 50: スケール到達可能性・ウィーナー指数 (GGG1–GGG4)

| # | 関数名 | 概要 |
|---|--------|------|
| GGG1 | `scaleReachabilityMatrix` | 円形スケールグラフの到達可能性行列(最小ステップ数) |
| GGG2 | `scaleReachabilityScore` | maxSteps以内で到達可能なペア率 |
| GGG3 | `scaleAveragePath` | 全ペア間の平均最短ステップ数 |
| GGG4 | `scaleWienerIndex` | 全ペア最短パス距離の総和(Wiener指数) |

**参考**: Wiener index in chemical graph theory (Wiener 1947); Pitch-class graphs in music theory。

## Round 51: 倍音・サブ倍音マッチング・ビート周波数・粗さ (HHH1–HHH4)

| # | 関数名 | 概要 |
|---|--------|------|
| HHH1 | `scaleOvertoneMatchScore` | 倍音列への近接度スコア(周波数誤差ベース) |
| HHH2 | `scaleSubharmonicMatchScore` | サブ倍音列への近接度スコア(cents誤差ベース) |
| HHH3 | `scaleBeatFrequency` | 隣接音程間のビート周波数の平均 |
| HHH4 | `scaleRoughnessSum` | 全ペアのVassilakis粗さモデル総和 |

**参考**: Vassilakis (2001) roughness model; Overtone matching in just intonation theory。

## Round 52: スケール対称性・逆行・回文分析 (III1–III4)

| # | 関数名 | 概要 |
|---|--------|------|
| III1 | `scaleInversionSymmetry` | 反転(周期反射)対称性スコア |
| III2 | `scaleRetrograde` | スケールの逆行形(降順ソート) |
| III3 | `scaleRetrogradeInversion` | 逆行反転形(逆行+反転) |
| III4 | `scalePalindromicScore` | 音程列の回文度スコア |

**参考**: Retrograde and inversion in serial music theory (Schoenberg); Scale palindromes in music set theory。

## Round 53: スケール学習可能性・認知指標 (JJJ1–JJJ4)

| # | 関数名 | 概要 |
|---|--------|------|
| JJJ1 | `scaleLearnabilityScore` | 音程規則性・音数・種類数に基づく学習容易性スコア |
| JJJ2 | `scaleRecognizabilityIndex` | 著名スケールとの類似度に基づく認識可能性指数 |
| JJJ3 | `scaleMemorizabilityScore` | パターン反復・順次進行による記憶容易性スコア |
| JJJ4 | `scaleTeachingDifficulty` | マイクロトーナル音程・高音数などによる教授難易度 |

**参考**: Cognitive psychology of music learning (Dowling & Harwood 1986); Scale difficulty in ear training pedagogy。

## Round 54: スケール変換・モーフィング (KKK1–KKK4)

| # | 関数名 | 概要 |
|---|--------|------|
| KKK1 | `scaleMorphDistance` | 2スケール間の最適輸送モーフ距離 |
| KKK2 | `scaleInterpol` | 2スケール間の線形補間 |
| KKK3 | `scaleGradientDescent` | 目標スケールへの勾配降下経路 |
| KKK4 | `scaleConvergenceRate` | 収束に必要なステップ数 |

**参考**: Scale morphing and continuous transformations; Optimal transport in music analysis。

## Round 55: スケール共起・生態的ニッチ・競争指数 (LLL1–LLL4)

| # | 関数名 | 概要 |
|---|--------|------|
| LLL1 | `scaleCoOccurrenceMatrix` | 音高ペアの共起行列(ウィンドウサイズ内) |
| LLL2 | `scaleMutualInformationMatrix` | 共起ベースの相互情報量行列 |
| LLL3 | `scaleEcologicalNiche` | Voronoi分割による各音の生態的ニッチ幅 |
| LLL4 | `scaleCompetitionIndex` | ニッチ幅の変動係数による競争指数 |

**参考**: Co-occurrence analysis in musicology; Voronoi diagrams applied to pitch space (Tymoczko 2011)。

## Round 56: スケール様式論・対称性メトリクス (MMM1–MMM4)

| # | 関数名 | 概要 |
|---|--------|------|
| MMM1 | `scaleModalBrightness` | 各音高の相対的高さの平均（様式的明るさ） |
| MMM2 | `scaleMaximalEvennessScore` | 最大均等性スコア（ステップ幅の均等度） |
| MMM3 | `scaleMyhillPropertyScore` | Myhillの性質スコア（汎用音程ごとに2種のみ） |
| MMM4 | `scaleInversionSymmetryScore` | 反転対称性スコア（音楽的逆行との一致度） |

**参考**: Myhill's property (Clough & Myerson 1985); Modal brightness theory (Rothenberg 1978); Maximal evenness (Clough & Douthett 1991).

## Round 57: ステップサイズ分布統計 (NNN1–NNN4)

| # | 関数名 | 概要 |
|---|--------|------|
| NNN1 | `scaleStepSizeEntropy` | ステップサイズ分布のシャノンエントロピー |
| NNN2 | `scaleStepSizeSkewness` | ステップサイズ分布の歪度 |
| NNN3 | `scaleHemitoneCount` | 半音ステップ（50-150セント）の個数 |
| NNN4 | `scaleCoherenceIndex` | 最多2種のステップサイズが占める割合（整合性指標） |

**参考**: Step-size distribution analysis in scale theory (Carey & Clampitt 1989); Coherence in musical scale design.

## Round 58: スケール回転対称性・音程スペクトル (OOO1–OOO4)

| # | 関数名 | 概要 |
|---|--------|------|
| OOO1 | `scaleRotationSymmetryOrder` | 循環回転で同一パターンを生む回転の個数 |
| OOO2 | `scaleTranspositionInvarianceCount` | 音程移調で不変となる移調の個数 |
| OOO3 | `scaleIntervalSpectrumWidth` | 全音程の最大値と最小値の差（音程スペクトル幅） |
| OOO4 | `scaleStepRatioVariance` | 連続ステップサイズ比の分散 |

**参考**: Transpositional symmetry in pitch-class set theory (Forte 1977); Rothenberg's scale coherence model.

## Round 59: スケール純正律近似・ステップ幅分析 (PPP1–PPP4)

| # | 関数名 | 概要 |
|---|--------|------|
| PPP1 | `scaleJustProximityScore` | 7-limit純正律音程に近い音高の割合 |
| PPP2 | `scaleMaxGapRatio` | 最大ステップ/最小ステップの比（不均等度） |
| PPP3 | `scaleMinStepCents` | 最小ステップサイズ（セント） |
| PPP4 | `scaleMaxStepCents` | 最大ステップサイズ（セント） |

**参考**: 7-limit just intonation (Partch 1949); Scale step distribution analysis (Clough & Myerson 1985).

## Round 60: 声部導音距離・自己相似性 (QQQ1–QQQ4)

| # | 関数名 | 概要 |
|---|--------|------|
| QQQ1 | `scaleVoiceLeadingDistance` | 2つのスケール間の最小声部導音距離 |
| QQQ2 | `scaleVoiceLeadingRadius` | 最大均等スケールへの声部導音距離（半径） |
| QQQ3 | `scaleParsimonyCost` | 最小移調パーシモニーコスト |
| QQQ4 | `scaleSelfSimilarityScore` | 逆行（後退形）との自己相似性スコア |

**参考**: Voice-leading geometry (Tymoczko 2011); Parsimonious voice leading (Cohn 1996).

## Round 61: 音程複雑性・クラスタリング・分散指数 (RRR1–RRR4)

| # | 関数名 | 概要 |
|---|--------|------|
| RRR1 | `scaleIntervalComplexityRatio` | 単純比率音程（5-limit以下）が占める割合 |
| RRR2 | `scaleUniquePitchClassCount` | 一意の音高クラス数（セント整数丸め） |
| RRR3 | `scaleClusteringScore` | 50セント以内に隣接音を持つ音の割合 |
| RRR4 | `scaleDispersionIndex` | ステップサイズの分散/平均（Fano因子） |

**参考**: Intervallic complexity in scale theory; Fano factor in statistics.

## Round 62: 音響倍音共鳴・倍音豊かさ (SSS1–SSS4)

| # | 関数名 | 概要 |
|---|--------|------|
| SSS1 | `scaleHarmonicAlignmentScore` | 倍音列（1-16）との音高一致率 |
| SSS2 | `scaleSubharmonicAlignmentScore` | 下倍音列（1-16）との音高一致率 |
| SSS3 | `scaleResonanceIndex` | 倍音・下倍音一致率の平均（共鳴指数） |
| SSS4 | `scaleOvertoneRichness` | 各音の倍音（2-8次）が他の音高と一致する割合 |

**参考**: Harmonic series alignment in music theory; Overtone richness (Helmholtz 1877).
