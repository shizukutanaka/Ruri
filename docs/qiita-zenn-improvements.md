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

## Round 63: スケール認知複雑性・学習可能性 (TTT1–TTT4)

| # | 関数名 | 概要 |
|---|--------|------|
| TTT1 | `scaleWorkingMemoryLoad` | 異なるステップタイプ数（作業記憶負荷） |
| TTT2 | `scaleCognitiveClusters` | 知覚的クラスター数（75セント閾値） |
| TTT3 | `scaleLearnabilityScore` | 最頻ステップが占める割合（学習容易性） |
| TTT4 | `scalePatternRegularity` | ステップパターンの最小周期/n（規則性） |

**参考**: Miller's Law (1956); Scale learnability in cognitive musicology (Krumhansl 1990).

## Round 64: スケールグラフトポロジー (UUU1–UUU4)

音階の音程グラフ構造を分析する4つのヘルパー関数を追加。

| 関数ID | 関数名 | 説明 |
|--------|--------|------|
| UUU1 | `scaleGraphDensity` | 50セント以内の音程ペア密度 |
| UUU2 | `scaleSmallWorldIndex` | スモールワールド係数（クラスタリング/経路効率） |
| UUU3 | `scaleHubScore` | 最大ハブ度数（150セント隣接グラフ） |
| UUU4 | `scaleBridgingCoefficient` | ブリッジング係数（Valente-Fujimoto） |

## Round 65: 音階対称性・不変量 (VVV1–VVV4)

音階の対称性と変換不変量を測定する4つのヘルパー関数を追加。

| 関数ID | 関数名 | 説明 |
|--------|--------|------|
| VVV1 | `scaleRotationalSymmetrySteps` | ステップパターンを保つ回転の割合 |
| VVV2 | `scaleReflectionSymmetrySteps` | 反射対称なステップパターンの割合 |
| VVV3 | `scaleTranspositionInvariance` | スケール内移調で自己合同な移調数/n |
| VVV4 | `scaleComplementSymmetry` | 12-EDO補集合スケールとのJaccard類似度 |

## Round 66: 旋律輪郭分析 (WWW1–WWW4)

音階のステップ列から旋律輪郭特性を抽出する4つのヘルパー関数を追加。

| 関数ID | 関数名 | 説明 |
|--------|--------|------|
| WWW1 | `scaleMelodicAscent` | 上昇ステップペアの割合 |
| WWW2 | `scaleMelodicDescent` | 下降ステップペアの割合 |
| WWW3 | `scaleMelodicPeakRatio` | 旋律的ピーク音の割合（円環上） |
| WWW4 | `scaleMelodicContourEntropy` | 輪郭3記号列のShannon entropy |

## Round 67: 調和的テンション分析 (XXX1–XXX4)

音階内の調和的テンション特性を測定する4つのヘルパー関数を追加。

| 関数ID | 関数名 | 説明 |
|--------|--------|------|
| XXX1 | `scaleTritoneTension` | 増四度（±50セント）音程ペアの割合 |
| XXX2 | `scaleLeadingToneTension` | 導音的音程（50–150セント）の割合 |
| XXX3 | `scaleSuspensionDensity` | 完全4度・5度（±30セント）音程の密度 |
| XXX4 | `scaleHarmonicTensionIndex` | テンション複合指数（加重平均） |

## Round 68: リズム的均等性・整形性 (YYY1–YYY4)

音階の均等性・非規則性・整形性を測定する4つのヘルパー関数を追加。

| 関数ID | 関数名 | 説明 |
|--------|--------|------|
| YYY1 | `scaleEvenness` | ステップ均等性（偏差の逆数） |
| YYY2 | `scaleMaxStepRatio` | 最大/最小ステップ比の非均等度 |
| YYY3 | `scaleIrregularityIndex` | Entner式非規則性指数（円環） |
| YYY4 | `scaleWellformedness` | 生成子カバレッジによる整形性 |

## Round 69: モーダルセンター・安定音 (ZZZ1–ZZZ4)

音階の調性中心・安定音特性を測定する4つのヘルパー関数を追加。

| 関数ID | 関数名 | 説明 |
|--------|--------|------|
| ZZZ1 | `scaleTonicStrengthV2` | 主音強度（完全音程との一致度） |
| ZZZ2 | `scaleDominantStrength` | 属音強度（700セント近傍） |
| ZZZ3 | `scaleModalCenterDispersion` | モーダルセンター分散（円形平均偏差） |
| ZZZ4 | `scaleLeadingNoteProximity` | 導音近傍度（±100セント以内の音の割合） |

## Round 70: 音程多様性・分布 (AAA1–AAA4)

音階内の音程クラス分布を分析する4つのヘルパー関数を追加。

| 関数ID | 関数名 | 説明 |
|--------|--------|------|
| AAA1 | `scaleIntervalVariety` | 音程クラス種類数/12（多様性） |
| AAA2 | `scaleIntervalBalance` | 音程ヒストグラムの均衡度（1-CV） |
| AAA3 | `scaleIntervalDominance` | 最頻音程クラスの占有率 |
| AAA4 | `scaleIntervalEntropy` | 音程クラス分布のShannon entropy |

## Round 71: ピッチ近接性・声部導音 (BBB1–BBB4)

音階内のピッチ間近接性と声部導音効率を測定する4つのヘルパー関数を追加。

| 関数ID | 関数名 | 説明 |
|--------|--------|------|
| BBB1 | `scaleNearestNeighborMean` | 最近傍音程の平均距離（正規化） |
| BBB2 | `scaleVoiceLeadingEfficiencyV2` | 1ステップ上移調時の声部導音効率 |
| BBB3 | `scaleCrowdingIndex` | 50セント以内の隣接音を持つ音の割合 |
| BBB4 | `scaleSpreadIndex` | 音域カバー率（最高-最低/周期） |

## Round 72: スペクトル重心・帯域特性 (CCC1–CCC4)

音階のピッチ分布のスペクトル統計量を測定する4つのヘルパー関数を追加。

| 関数ID | 関数名 | 説明 |
|--------|--------|------|
| CCC1 | `scaleSpectralCentroid` | ピッチ分布の重心（平均/周期） |
| CCC2 | `scaleSpectralBandwidth` | ピッチ分布の標準偏差/周期 |
| CCC3 | `scaleSpectralSkewness` | ピッチ分布の歪度（正規化[0,1]） |
| CCC4 | `scaleSpectralKurtosis` | ピッチ分布の尖度（正規化[0,1]） |

## Round 73: 音響共鳴・弦振動 (DDD1–DDD4)

音階の倍音列整合性と音響共鳴特性を測定する4つのヘルパー関数を追加。

| 関数ID | 関数名 | 説明 |
|--------|--------|------|
| DDD1 | `scaleHarmonicSeriesAlignment` | 倍音列との整合度（整数比近傍） |
| DDD2 | `scaleSubharmonicDensity` | 下倍音関係の密度 |
| DDD3 | `scaleResonanceScore` | 複合共鳴スコア（加重平均） |
| DDD4 | `scaleNodeDensity` | 根音との整数比「節音」の密度 |

## Round 74: ピッチクラスタ分析 (EEE1–EEE4)

k-meansクラスタリングによるピッチ空間の構造分析を行う4つのヘルパー関数を追加。

| 関数ID | 関数名 | 説明 |
|--------|--------|------|
| EEE1 | `scaleKMeansClusters` | k=3クラスタ内分散（正規化） |
| EEE2 | `scaleClusterSeparation` | クラスタ重心間距離（正規化） |
| EEE3 | `scaleSilhouetteScore` | シルエットスコア（[0,1]正規化） |
| EEE4 | `scaleClusterBalance` | クラスタサイズ均衡度 |

## Round 75: マイクロトーナル密度・粒度 (FFF1–FFF4)

音階のマイクロトーナル（100セント未満）音程特性を分析する4つのヘルパー関数を追加。

| 関数ID | 関数名 | 説明 |
|--------|--------|------|
| FFF1 | `scaleMicrotonalDensity` | 100セント未満ステップの割合 |
| FFF2 | `scaleQuarterToneAlignment` | 四分音グリッド（50セント）への整合度 |
| FFF3 | `scaleMicrotonalComplexity` | マイクロトーナル固有ステップ比 |
| FFF4 | `scaleEdoApproximationQuality` | 小整数EDO近似カバレッジ |

## Round 76: 音律偏差・調律誤差 (GGG1–GGG4)

各種参照音律からの偏差を測定する4つのヘルパー関数を追加。

| 関数ID | 関数名 | 説明 |
|--------|--------|------|
| GGG1 | `scaleJustIntonationDeviation` | 純正律（n,m≤8）からの平均偏差/100セント |
| GGG2 | `scalePythagoreanDeviation` | ピタゴラス音律からの平均偏差/100セント |
| GGG3 | `scaleMeanToneDeviation` | 1/4コンマ・ミーントーンからの平均偏差/50セント |
| GGG4 | `scaleEqualTemperamentDeviation` | 12平均律からの平均偏差/50セント |

## Round 77: オクターブ等価性・音域特性 (HHH1–HHH4)

音階のオクターブ等価性と音域にまたがる特性を測定する4つのヘルパー関数を追加。

| 関数ID | 関数名 | 説明 |
|--------|--------|------|
| HHH1 | `scaleOctaveEquivalenceScore` | ピッチクラス重複なし率 |
| HHH2 | `scaleRegisterWidth` | 音域幅（オクターブ単位、正規化） |
| HHH3 | `scaleOctaveCompleteness` | 12半音クラスのカバレッジ |
| HHH4 | `scaleSubOctaveDensity` | 1オクターブ以内の音の密度 |

## Round 78: フレーズ構造・モーション分析 (III1–III4)

音階のステップ運動特性（順次・跳躍・間隙補充）を測定する4つのヘルパー関数を追加。

| 関数ID | 関数名 | 説明 |
|--------|--------|------|
| III1 | `scaleConjunctMotion` | 順次進行（≤200セント）ステップの割合 |
| III2 | `scaleDisjunctMotion` | 跳躍進行（>200セント）ステップの割合 |
| III3 | `scaleStepSizeVariance` | ステップサイズ分散（正規化） |
| III4 | `scaleGapFill` | 間隙補充傾向（跳躍→順次の割合） |

## Round 79: 倍音近接性 (JJJ1–JJJ4)

スケール音程と自然倍音列・純正律・平均律との近接度を測定する4つのヘルパー関数を追加。

| 関数ID | 関数名 | 説明 |
|--------|--------|------|
| JJJ1 | `scaleHarmonicSeriesProximity` | スケール音程と自然倍音列(2–16倍音)との近接度の平均 |
| JJJ2 | `scaleJustIntonationProximity` | 5リミット純正律音程との近接度の平均 |
| JJJ3 | `scaleEqualTemperamentDeviationV2` | 12平均律半音からの逸脱度(0=完全平均律) |
| JJJ4 | `scaleMelodyCentroid` | 音程空間における旋律重心（周期音程比） |

## Round 80: 音階対称性 (LLL1–LLL4)

音階の対称性・自己相似性を測定する4つのヘルパー関数を追加。

| 関数ID | 関数名 | 説明 |
|--------|--------|------|
| LLL1 | `scaleChiralityScore` | 音階と鏡像との非対称度（カイラリティ） |
| LLL2 | `scaleTranspositionClosureCount` | 音階を自己に写す移調の数（正規化） |
| LLL3 | `scaleInversionClosureCount` | 音階を自己に写す反転の数（正規化） |
| LLL4 | `scalePerfectBalance` | 音程空間における重心の均衡度 |

## Round 81: 音程クラスタ分析 (MMM1–MMM4)

音階の音程クラスタ構造・均等性・深スケール性を測定する4つのヘルパー関数を追加。

| 関数ID | 関数名 | 説明 |
|--------|--------|------|
| MMM1 | `scaleIntervalClusterCount` | 音程クラスタ数（類似ステップのグループ数、正規化） |
| MMM2 | `scaleIntervalVarietyIndex` | 異なる音程クラス数の多様性指数 |
| MMM3 | `scaleMaximalEvenness` | 最大均等性スコア（等間隔からの逸脱度の逆数） |
| MMM4 | `scaleDeepScaleProperty` | 深スケール特性（音程倍数の多様性） |

## Round 82: 旋法的中心性 (NNN1–NNN4)

調性重力・旋法中心の多様性を測定する4つのヘルパー関数を追加。

| 関数ID | 関数名 | 説明 |
|--------|--------|------|
| NNN1 | `scaleModalCenterDiversity` | 旋法的中心の多様性（回転パターン数、正規化） |
| NNN2 | `scaleLeadingToneStrengthV2` | 導音の強度（近傍導音を持つ音の割合） |
| NNN3 | `scaleGravityField` | 調性重力場（安定音程への引力の平均） |
| NNN4 | `scaleResolutionTendency` | 解決傾向（不安定音が安定音へ解決する割合） |

## Round 83: 音響心理学 (OOO1–OOO4)

知覚的な音響特性（可聴閾・臨界帯域・マスキング・音高知覚）を測定する4つのヘルパー関数を追加。

| 関数ID | 関数名 | 説明 |
|--------|--------|------|
| OOO1 | `scaleJNDStepCount` | 最小可聴差(JND)を超えるステップ数の割合 |
| OOO2 | `scaleCriticalBandDensity` | 臨界帯域内に収まる音程対の密度 |
| OOO3 | `scaleMaskingIndex` | スペクトルマスキングによる隠蔽音の割合 |
| OOO4 | `scalePitchHeightSpread` | Barkスケールでの音高高さの広がり |

## Round 84: 音脈分凝分析 (PPP1–PPP4)

聴覚ストリーム分凝・融合・ゲシュタルト近接性を測定する4つのヘルパー関数を追加。

| 関数ID | 関数名 | 説明 |
|--------|--------|------|
| PPP1 | `scaleStreamSegregationIndex` | 音脈分凝指数（大跳躍によるストリーム分割確率） |
| PPP2 | `scaleFusionIndex` | 聴覚融合指数（小ステップによる単一知覚確率） |
| PPP3 | `scalePitchProximityGrouping` | ゲシュタルト近接性によるグルーピング指数 |
| PPP4 | `scaleTonalFusion` | 倍音列との整数比近接度による調性融合スコア |

## Round 85: 音階グラフ理論 (QQQ1–QQQ4)

音階をグラフとして解析する4つのヘルパー関数を追加。

| 関数ID | 関数名 | 説明 |
|--------|--------|------|
| QQQ1 | `scaleIntervalGraphEdgeCount` | 音程グラフのエッジ密度（閾値内の音程対の割合） |
| QQQ2 | `scaleChordal` | 弦グラフ性スコア（3連続音程の最大区間が三全音以内） |
| QQQ3 | `scaleChromatic` | 半音階性スコア（12平均律半音への近接度） |
| QQQ4 | `scaleSpectralRadius` | スペクトル半径近似（最大次数／(n-1)） |

## Round 86: 音程確率論 (RRR1–RRR4)

音程分布の確率論的特性を測定する4つのヘルパー関数を追加。

| 関数ID | 関数名 | 説明 |
|--------|--------|------|
| RRR1 | `scaleIntervalProbabilityEntropy` | 音程分布のShannonエントロピー（正規化） |
| RRR2 | `scaleMarkovTransitionEntropy` | ステップ系列のMarkov遷移エントロピー |
| RRR3 | `scaleExpectedIntervalSize` | 音程期待値（半周期で正規化） |
| RRR4 | `scaleIntervalSkewness` | 音程分布の歪度（Pearson第2係数の絶対値） |

## Round 87: 音階スペクトル分析 (SSS1–SSS4)

離散フーリエ変換(DFT)による音階スペクトル特性を測定する4つのヘルパー関数を追加。

| 関数ID | 関数名 | 説明 |
|--------|--------|------|
| SSS1 | `scaleDFTMagnitude` | DFT第k係数の振幅（音程の周期性強度） |
| SSS2 | `scaleDFTBalanceIndex` | DFT均衡指数（k=1..6の平均振幅の逆数） |
| SSS3 | `scaleDFTPeakFrequency` | 支配的DFT周波数（最大振幅のk値、正規化） |
| SSS4 | `scaleDFTSpectralFlatness` | DFTスペクトル平坦性（Wienerエントロピー） |

## Round 88: 音程ベクトル分析 (TTT1–TTT4)

音程クラスベクトル（集合論的音楽理論）を解析する4つのヘルパー関数を追加。

| 関数ID | 関数名 | 説明 |
|--------|--------|------|
| TTT1 | `scaleIntervalVectorV2` | 音程ベクトル（IC1–IC6のカウント配列） |
| TTT2 | `scaleIntervalVectorEntropyV2` | 音程ベクトルのShannonエントロピー（正規化） |
| TTT3 | `scaleIntervalVectorBalanceV2` | 音程ベクトルの均衡性スコア（変動係数の逆数） |
| TTT4 | `scaleIntervalVectorMaxICV2` | 支配的音程クラス（最大カウントIC、正規化） |

## Round 89: 音階情報密度 (UUU1–UUU4)

音階パターンの情報理論的複雑性を測定する4つのヘルパー関数を追加。

| 関数ID | 関数名 | 説明 |
|--------|--------|------|
| UUU1 | `scaleKolmogorovComplexityProxy` | Kolmogorov複雑性近似（固有ステップ数/n） |
| UUU2 | `scaleRunLengthProxy` | ランレングス符号化近似（平均ラン長、正規化） |
| UUU3 | `scaleAutocorrelationProxy` | 自己相関係数（ラグ1、[0,1]にマップ） |
| UUU4 | `scaleDescriptionLength` | 最小記述長近似（MDL複雑性） |

## Round 90: 音階モード分析 (VVV1–VVV4)

音階の回転モード特性を測定する4つのヘルパー関数を追加。

| 関数ID | 関数名 | 説明 |
|--------|--------|------|
| VVV1 | `scaleModeCountV2` | 回転的に異なるモード数（正規化） |
| VVV2 | `scaleBrightest` | 最も明るいモードの明度（上半部の音数比） |
| VVV3 | `scaleDarkest` | 最も暗いモードの暗度（下半部の音数比） |
| VVV4 | `scaleModeBalanceSpread` | 最明モードと最暗モードの明度差 |

## Round 91: 音階対称性分析 (WWW1–WWW4)

音階の反射・並進・回文・反転対称性を測定する4つのヘルパー関数を追加。

| 関数ID | 関数名 | 説明 |
|--------|--------|------|
| WWW1 | `scaleReflectionSymmetryV2` | 周期中点での反射対称性（ミラー音の比率） |
| WWW2 | `scaleTranslationSymmetry` | 自己音程によるシフトで不変な割合 |
| WWW3 | `scalePalindromeRatio` | ステップ列の回文度 |
| WWW4 | `scaleInversionEquivalence` | 反転スケールとの類似度（平均絶対差） |

## Round 92: 音階ピッチ密度分析 (XXX1–XXX4)

音階内のピッチ分布密度を測定する4つのヘルパー関数を追加。

| 関数ID | 関数名 | 説明 |
|--------|--------|------|
| XXX1 | `scalePitchDensity` | 100セントあたりのピッチ数（正規化） |
| XXX2 | `scaleCrowdingIndexV2` | 混雑区間（50セント未満）の比率 |
| XXX3 | `scaleSparsityIndex` | 疎区間（300セント超）の比率 |
| XXX4 | `scaleGapBalance` | 混雑度と疎密度の均衡指数 |

## Round 93: 音階音域分析 (YYY1–YYY4)

音階の音域（アンビトゥス）特性を測定する4つのヘルパー関数を追加。

| 関数ID | 関数名 | 説明 |
|--------|--------|------|
| YYY1 | `scaleAmbitusRatio` | 音域が周期に占める割合 |
| YYY2 | `scaleLowerDensity` | 音域下半部の音密度 |
| YYY3 | `scaleUpperDensity` | 音域上半部の音密度 |
| YYY4 | `scaleRegisterBalance` | 上下半部の密度均衡指数 |

## Round 94: 音階音程クラス分析 (ZZZ1–ZZZ4)

音階の音程クラス（ステップサイズ）分布を測定する4つのヘルパー関数を追加。

| 関数ID | 関数名 | 説明 |
|--------|--------|------|
| ZZZ1 | `scaleIntervalClassDiversity` | 異なる音程クラス数（正規化） |
| ZZZ2 | `scaleMajorIntervalRatio` | 大音程（180セント以上）の比率 |
| ZZZ3 | `scaleMinorIntervalRatio` | 小音程（180セント未満）の比率 |
| ZZZ4 | `scaleIntervalClassBalance` | 大音程と小音程の均衡指数 |

## Round 95: 音階和声リズム分析 (AAAA1–AAAA4)

音階のステップサイズ変化（和声リズム）を測定する4つのヘルパー関数を追加。

| 関数ID | 関数名 | 説明 |
|--------|--------|------|
| AAAA1 | `scaleHarmonicRhythmDensity` | 音程サイズの変化頻度（遷移比率） |
| AAAA2 | `scaleHarmonicAccelerationProxy` | 音程変化の加速度（2階差分の平均） |
| AAAA3 | `scaleHarmonicSteadinessProxy` | 和声リズムの安定性（加速度の補数） |
| AAAA4 | `scaleHarmonicComplexityProxy` | 密度と加速度の重み付き複合指数 |

## Round 96: 音階フィンガープリント分析 (BBBB1–BBBB4)

音階の識別署名（フィンガープリント）を生成する4つのヘルパー関数を追加。

| 関数ID | 関数名 | 説明 |
|--------|--------|------|
| BBBB1 | `scaleChecksumProxy` | ピッチ正規化値の合計mod1チェックサム |
| BBBB2 | `scaleHashVariance` | 正規化ピッチの分散フィンガープリント |
| BBBB3 | `scalePeriodicityFingerprint` | 等分割音律へのフィット度（2-12等分） |
| BBBB4 | `scaleUniquenessProxy` | 周期性の補数（音階の独自性指数） |

## Round 97: 音階トーン重心分析 (CCCC1–CCCC4)

音階のピッチ重心と引力バランスを測定する4つのヘルパー関数を追加。

| 関数ID | 関数名 | 説明 |
|--------|--------|------|
| CCCC1 | `scaleTonalCenterOfGravity` | ピッチ正規化値の重心（centroid） |
| CCCC2 | `scaleTonalGravityBalance` | 重心の中点（0.5）からの対称性 |
| CCCC3 | `scaleTonalPolarization` | 極端値への偏向度（中心からの距離の平均） |
| CCCC4 | `scaleTonalCentripetal` | 向心性（分極度の補数） |

## Round 98: 音階モーダル特性分析 (DDDD1–DDDD4)

音階の明暗モーダル特性（長調/短調的音程の含有率）を測定する4つのヘルパー関数を追加。

| 関数ID | 関数名 | 説明 |
|--------|--------|------|
| DDDD1 | `scaleModalBrightnessV2` | 明るい音程（M2/M3/P5/M6/M7）の含有率 |
| DDDD2 | `scaleModalDarknessV2` | 暗い音程（m2/m3/TT/m6/m7）の含有率 |
| DDDD3 | `scaleModalBrightnessBiasV2` | 明暗バイアス（0=暗、0.5=中立、1=明） |
| DDDD4 | `scaleModalComplexityV2` | 全モーダル音程クラスの充足率 |

## Round 99: 音階ピッチ空間充填分析 (EEEE1–EEEE4)

音階が音高空間（周期）をどれだけ効率的に充填するかを測定する4つのヘルパー関数を追加。

| 関数ID | 関数名 | 説明 |
|--------|--------|------|
| EEEE1 | `scaleFillRatio` | ±50セント近傍の合計カバレッジ比率 |
| EEEE2 | `scaleMaxGap` | 最大ギャップ（正規化） |
| EEEE3 | `scaleGapUniformity` | ギャップ均一性（変動係数の補数） |
| EEEE4 | `scaleCoverageEfficiency` | カバレッジ効率（12音基準） |

## Round 100: 音階音程ネットワーク分析 (FFFF1–FFFF4)

音階をネットワークとしてモデル化し、音程間の接続特性を測定する4つのヘルパー関数を追加。

| 関数ID | 関数名 | 説明 |
|--------|--------|------|
| FFFF1 | `scaleIntervalNetworkDensity` | 近接ノード対の密度（50セント以内） |
| FFFF2 | `scaleIntervalNetworkClustering` | 平均クラスタリング係数（150セント近傍） |
| FFFF3 | `scaleIntervalHubScore` | ハブノード偏在度（次数の変動係数） |
| FFFF4 | `scaleIntervalNetworkBalance` | ネットワーク均衡度（ハブスコアの補数） |

## Round 101: 音階スケール自己相似分析 (GGGG1–GGGG4)

音階の自己相似性・再帰的構造を測定する4つのヘルパー関数を追加。

| 関数ID | 関数名 | 説明 |
|--------|--------|------|
| GGGG1 | `scaleSubsetSimilarity` | 半周期サブセットとの類似度 |
| GGGG2 | `scaleStepRecurrence` | 繰り返し出現するステップサイズの比率 |
| GGGG3 | `scaleOctaveEquivalence` | オクターブ等価性の近似度 |
| GGGG4 | `scaleHierarchicalBalance` | 複数階層での均衡指数 |

## Round 102: 音階スペクトル密度分析 (HHHH1–HHHH4)

音高が周期内の低・中・高音域にどう分布するかを測定する4つのヘルパー関数を追加。

| 関数ID | 関数名 | 説明 |
|--------|--------|------|
| HHHH1 | `scaleLowRegisterDensity` | 低音域（0〜1/3周期）の音符密度 |
| HHHH2 | `scaleMidRegisterDensity` | 中音域（1/3〜2/3周期）の音符密度 |
| HHHH3 | `scaleHighRegisterDensity` | 高音域（2/3〜1周期）の音符密度 |
| HHHH4 | `scaleRegisterDistributionBalance` | 3音域の均衡指数（標準偏差の補数） |

## Round 103: 音階和声張力分析 (IIII1–IIII4)

音階内の不協和・張力特性を測定する4つのヘルパー関数を追加。

| 関数ID | 関数名 | 説明 |
|--------|--------|------|
| IIII1 | `scaleTritoneRatioV2` | 三全音（半周期±30セント）を含む音の比率 |
| IIII2 | `scaleDissonantIntervalCountV2` | 不協和ステップ（半音・増4度）の比率 |
| IIII3 | `scaleTensionResolutionRatioV2` | 解決音程（協和ステップ）の比率 |
| IIII4 | `scaleHarmonicTensionIndexV2` | 三全音比率と不協和比率の複合張力指数 |

## Round 104: 音階倍音列分析 (JJJJ1–JJJJ4)

音階が自然倍音列・純正律にどれだけ整合するかを測定する4つのヘルパー関数を追加。

| 関数ID | 関数名 | 説明 |
|--------|--------|------|
| JJJJ1 | `scaleOvertoneAlignment` | 第1–16倍音列との整合率（20セント許容） |
| JJJJ2 | `scaleSubharmonicAlignment` | 第2–8倍音の逆数（倍音下列）との整合率 |
| JJJJ3 | `scaleHarmonicSeriesCompleteness` | 第2–8倍音の充足率 |
| JJJJ4 | `scaleJustIntonationProximityV2` | 5リミット純正律音程との近傍率 |

## Round 105: 音階微分音分析 (KKKK1–KKKK4)

音階の微分音・異音律的特性を測定する4つのヘルパー関数を追加。

| 関数ID | 関数名 | 説明 |
|--------|--------|------|
| KKKK1 | `scaleMicrotonalDeviation` | 12-EDO最近傍からの平均偏差（正規化） |
| KKKK2 | `scaleMicrotonalIntervalCount` | 微分音ステップ（80セント未満）の比率 |
| KKKK3 | `scaleXenharmonicNovelty` | 12-EDO音程クラス外の音符比率 |
| KKKK4 | `scaleEDOApproximationScore` | 標準EDO（5/7/10/12/17/19/22/31）との最大整合度 |

## Round 106: 音階転調分析 (LLLL1–LLLL4)

音階の転調容易性・移調共有音を測定する4つのヘルパー関数を追加。

| 関数ID | 関数名 | 説明 |
|--------|--------|------|
| LLLL1 | `scaleCommonToneCount` | 移調後の最大共有音比率 |
| LLLL2 | `scalePivotChordPotential` | 3音以上共有できる移調の割合 |
| LLLL3 | `scaleCircleOfFifthsPosition` | 五度圏上の標準調との整合度 |
| LLLL4 | `scaleModulationDistanceV2` | 転調距離（最近傍移調との差分） |

## Round 107: 音階音色類似分析 (MMMM1–MMMM4)

音階のピッチ分布をスペクトル音色特性として測定する4つのヘルパー関数を追加。

| 関数ID | 関数名 | 説明 |
|--------|--------|------|
| MMMM1 | `scaleSpectralCentroidV2` | ピッチ重心（スペクトル重心の類似） |
| MMMM2 | `scaleSpectralSpread` | 重心周りの広がり（スペクトル拡散） |
| MMMM3 | `scaleSpectralFlux` | 連続ピッチ変化量（スペクトルフラックス） |
| MMMM4 | `scaleSpectralRolloff` | 下半分累積音高比率（ロールオフ） |

## Round 108: 音階クラスター分析 (NNNN1–NNNN4)

音階の近接音群（クラスター）特性を測定する4つのヘルパー関数を追加。

| 関数ID | 関数名 | 説明 |
|--------|--------|------|
| NNNN1 | `scaleClusterCount` | クラスター数（正規化） |
| NNNN2 | `scaleClusterDensity` | 平均クラスターサイズ（正規化） |
| NNNN3 | `scaleIsolatedNoteRatio` | 孤立音（クラスター外）の比率 |
| NNNN4 | `scaleClusterSpread` | クラスター重心の空間的広がり |

## Round 109: 音階方向性分析 (OOOO1–OOOO4)

音階インターバル列の方向性・対称性を測定する4つのヘルパー関数を追加。

| 関数ID | 関数名 | 説明 |
|--------|--------|------|
| OOOO1 | `scaleAscendingTendency` | インターバルが増加傾向にある連続対の比率 |
| OOOO2 | `scaleDescendingTendency` | インターバルが減少傾向にある連続対の比率 |
| OOOO3 | `scaleDirectionBalance` | 上昇・下降傾向のバランス度 |
| OOOO4 | `scaleIntervalSymmetry` | インターバル列の回文的対称性 |

## Round 110: 音階対称性分析 (PPPP1–PPPP4)

音階の幾何学的対称性を測定する4つのヘルパー関数を追加。

| 関数ID | 関数名 | 説明 |
|--------|--------|------|
| PPPP1 | `scaleReflectionSymmetry` | ピッチ反転（鏡映）対称性 |
| PPPP2 | `scaleTranslationSymmetry` | 等間隔（平行移動）対称性 |
| PPPP3 | `scaleRotationSymmetry` | 回転（巡回転置）対称性 |
| PPPP4 | `scaleInversionSymmetry` | インターバル逆読み対称性 |

## Round 111: 音階エントロピー分析 (QQQQ1–QQQQ4)

音階の情報エントロピーを多角的に測定する4つのヘルパー関数を追加。

| 関数ID | 関数名 | 説明 |
|--------|--------|------|
| QQQQ1 | `scalePitchEntropy` | ピッチ位置のシャノンエントロピー |
| QQQQ2 | `scaleIntervalEntropyV2` | インターバルサイズのシャノンエントロピー |
| QQQQ3 | `scaleRhythmicEntropy` | インターバル比率のエントロピー（リズム的複雑性） |
| QQQQ4 | `scaleHarmonicEntropy` | 和声エントロピー代理（音程複雑性の不確実性） |

## Round 112: 音階重心・慣性分析 (RRRR1–RRRR4)

音階のピッチ分布を物理的な質量分布として測定する4つのヘルパー関数を追加。

| 関数ID | 関数名 | 説明 |
|--------|--------|------|
| RRRR1 | `scaleCenterOfMass` | 正規化ピッチ位置の重心（平均） |
| RRRR2 | `scaleMomentOfInertia` | 重心周りの慣性モーメント（分散） |
| RRRR3 | `scaleGyrationRadius` | 回転半径（分散の平方根） |
| RRRR4 | `scaleAngularMomentum` | 角運動量代理（重心×回転半径） |

## Round 113: 音階ピッチ分布統計分析 (SSSS1–SSSS4)

音階の正規化ピッチ位置分布を統計的に測定する4つのヘルパー関数を追加。

| 関数ID | 関数名 | 説明 |
|--------|--------|------|
| SSSS1 | `scaleSkewness` | ピッチ分布の歪度（左右非対称性） |
| SSSS2 | `scaleKurtosis` | ピッチ分布の尖度（裾の重さ） |
| SSSS3 | `scaleQuartileSpread` | 四分位範囲（中間50%の広がり） |
| SSSS4 | `scaleOutlierRatio` | 外れ値ピッチの比率（IQR法） |

## Round 114 — TTTT1–TTTT4: 音階フラクタル次元分析

| ID | 関数名 | 説明 |
|----|--------|------|
| TTTT1 | `scaleBoxCountingDimension` | ボックスカウンティング次元: 2スケールでのボックス占有数比からフラクタル次元を推定 |
| TTTT2 | `scaleHausdorffEstimate` | ハウスドルフ次元推定: ギャップ分布の平均/最大比をフラクタル指標として使用 |
| TTTT3 | `scaleSelfSimilarityIndex` | 自己相似性指数: 音程パターンの前半・後半を比較し相似度を数値化 |
| TTTT4 | `scaleLacunarity` | ラクナリティ: ギャップ分布の変動係数2乗、スケールの疎密パターンを測定 |

## Round 115 — UUUU1–UUUU4: 音階対称変換分析

| ID | 関数名 | 説明 |
|----|--------|------|
| UUUU1 | `scaleRetrogradeSimilarity` | 逆行類似性: 音程列を逆順にしたときの類似度 |
| UUUU2 | `scaleInversionSimilarity` | 反転類似性: 音程を符号反転したときの類似度 |
| UUUU3 | `scaleComplementarity` | 補完性: クロマチックスケールに対する補完度(空き位置の割合) |
| UUUU4 | `scaleMirrorSymmetry` | 鏡像対称性: ピッチ範囲の中点を軸とした鏡像対称スコア |

## Round 116 — VVVV1–VVVV4: 音階音程変動分析

| ID | 関数名 | 説明 |
|----|--------|------|
| VVVV1 | `scaleStepSizeVarianceV2` | 音程サイズ変動: 連続音程の変動係数2乗(正規化)、均一性の逆指標 |
| VVVV2 | `scaleLargeSmallStepRatio` | 最大・最小音程比: 最大音程÷最小音程の比(正規化)、音程の多様性指標 |
| VVVV3 | `scaleStepUniformity` | 音程均一性: 変動係数の逆数、等間隔スケールで1に近づく |
| VVVV4 | `scaleMaxStepFraction` | 最大音程占有率: 最大音程が総音域に占める割合 |

## Round 117 — WWWW1–WWWW4: 音階密度分布分析

| ID | 関数名 | 説明 |
|----|--------|------|
| WWWW1 | `scaleRegisterBalanceV2` | 音域バランス: 音域の上半部/下半部に対する音符分布の偏り |
| WWWW2 | `scalePitchClusteringV2` | ピッチクラスタリング: 大きなギャップで区切られたクラスタの比率 |
| WWWW3 | `scaleRangeCoverageV2` | 音域カバレッジ: 隣接音程の200セント制限和÷総音域 |
| WWWW4 | `scaleOctaveCompletenessV2` | オクターブ完全性: 50セント刻みグリッドでオクターブを占有するビン数÷24 |

## Round 118 — XXXX1–XXXX4: 音階音程特性分析

| ID | 関数名 | 説明 |
|----|--------|------|
| XXXX1 | `scaleLeapFraction` | 跳躍音程率: 200セント超の跳躍音程が占める割合 |
| XXXX2 | `scaleStepFraction` | 順次音程率: 200セント以内の順次進行が占める割合 |
| XXXX3 | `scaleHalfStepCount` | 半音率: 50〜150セントの半音程が占める割合 |
| XXXX4 | `scaleWholeToneContent` | 全音率: 150〜250セントの全音程が占める割合 |

## Round 119 — YYYY1–YYYY4: 音階ピッチ分布統計検定

| ID | 関数名 | 説明 |
|----|--------|------|
| YYYY1 | `scaleNormalityIndex` | 正規性指数: IQR/標準偏差比が正規分布の1.35に近いほど高スコア |
| YYYY2 | `scaleUniformityIndex` | 均一性指数: 4区間チゥ二乗検定による一様分布適合度 |
| YYYY3 | `scaleBimodalityIndex` | 双峰性指数: 歪度と尖度から双峰分布係数を推定 |
| YYYY4 | `scaleDistributionSkewIndex` | 分布歪度指数: 歪度を[0,1]にマッピング(0.5=対称) |

## Round 120 — ZZZZ1–ZZZZ4: 音階倍音列関係分析

| ID | 関数名 | 説明 |
|----|--------|------|
| ZZZZ1 | `scaleHarmonicSeriesAlignmentV2` | 倍音列整列度: 音階ピッチと倍音列(±25セント)の一致率 |
| ZZZZ2 | `scaleSubharmonicAlignmentV2` | 下倍音整列度: 音階ピッチとサブハーモニック列(±25セント)の一致率 |
| ZZZZ3 | `scaleOvertoneRatioProximity` | 倍音比近接度: 音程ペアが純正比(±15セント)に近い割合 |
| ZZZZ4 | `scaleJustTuningDeviation` | 純正律偏差: 5リミット純正律から最も近い音程への平均偏差の逆数 |

## Round 121 — R1211–R1214: 音階音域バランス分析

| ID | 関数名 | 説明 |
|----|--------|------|
| R1211 | `scaleHighRegisterRatio` | 高音域比率: 音域上位1/3に含まれる音符の割合 |
| R1212 | `scaleLowRegisterRatio` | 低音域比率: 音域下位1/3に含まれる音符の割合 |
| R1213 | `scaleRegisterSpread` | 音域スプレッド: 最高音と最低音の差をオクターブ(1200セント)で正規化 |
| R1214 | `scaleRegisterConcentration` | 音域集中度: 音域スプレッドの逆数、狭い音域に集中するほど高スコア |

## Round 122 — R1221–R1224: 音階ピッチ多様性・集中分析

| ID | 関数名 | 説明 |
|----|--------|------|
| R1221 | `scalePitchVariety` | ピッチ多様性: 25セント解像度での個別ピッチクラス数 ÷ 総ピッチ数 |
| R1222 | `scalePitchRepetitionRatio` | ピッチ反復率: 10セント以内の重複音程の割合 |
| R1223 | `scaleSpanRatio` | スパン比: 実際の音域 ÷ 等間隔配置時の期待音域 |
| R1224 | `scaleAveragePitchHeight` | 平均ピッチ高さ: 音域内での平均ピッチ位置(0=最低, 1=最高) |

## Round 123 — R1231–R1234: 音階モーダル親和性分析

| ID | 関数名 | 説明 |
|----|--------|------|
| R1231 | `scaleMajorAffinity` | 長調親和性: 長音階(イオニアン)の7音と50セント以内で一致する音符の割合 |
| R1232 | `scaleMinorAffinity` | 短調親和性: 自然短音階の7音と50セント以内で一致する音符の割合 |
| R1233 | `scaleChromaticDegreeCount` | クロマ音度数: 12音クロマチックグリッドで占有されるポジション数÷12 |
| R1234 | `scaleDiatonicMatchScore` | 全旋法適合スコア: 7つの全音階旋法との最大一致率 |

## Round 124 — R1241–R1244: 音階テンション特性分析

| ID | 関数名 | 説明 |
|----|--------|------|
| R1241 | `scaleSemitoneClusterDensity` | 半音クラスタ密度: ソート後に隣接する音が100セント未満の間隔を持つ割合 |
| R1242 | `scaleAvoidNoteCount` | 回避音数: トリトーン関係を持つ音符の割合（緊張解決の必要性） |
| R1243 | `scaleColorToneRatio` | カラートーン比率: 長音階に含まれない音（クロマチック/色彩音）の割合 |
| R1244 | `scaleIntervalTension` | 音程緊張度: 全音程ペアの平均緊張値（三全音=1.0、完全音程=0.1） |

## Round 125 — R1251–R1254: 音階転調特性分析

| ID | 関数名 | 説明 |
|----|--------|------|
| R1251 | `scaleTranspositionCount` | 転調不変数: 同じ音高集合を生成する移調数（12分の1単位） |
| R1252 | `scaleAxisSymmetryScore` | 反転対称スコア: 最適対称軸での反転一致率（最大値） |
| R1253 | `scaleDegreeWeightBalance` | 音度重みバランス: オクターブを4分割した各領域への音符分布の均等性 |
| R1254 | `scaleHemitoniaRatio` | 半音比率: 全音・半音ステップのうち半音ステップが占める割合 |

## Round 126 — R1261–R1264: 音階クラスタ特性分析

| ID | 関数名 | 説明 |
|----|--------|------|
| R1261 | `scaleNoteGroupingScore` | 音符グループ化スコア: 隣接音符が200セント未満でまとまるペアの割合 |
| R1262 | `scaleInterclusterGap` | クラスタ間隔: クラスタ間の平均ギャップ（600セント=三全音で正規化） |
| R1263 | `scaleGroupCount` | グループ数: 200セント以上の間隔で区切られた自然クラスタ数÷6 |
| R1264 | `scaleClusterDensityVariation` | クラスタ密度変動: クラスタサイズの変動係数（÷2で正規化） |

## Round 127 — R1271–R1274: 音階周期性・反復構造分析

| ID | 関数名 | 説明 |
|----|--------|------|
| R1271 | `scaleIntervalPatternEntropy` | 音程パターンエントロピー: 50セント量子化後の音程ステップ分布のシャノンエントロピー（正規化） |
| R1272 | `scaleGapUniformityV2` | ギャップ均一性: ピッチ間隔の変動係数の逆数（1 - CV） |
| R1273 | `scaleMaximalEvennessV2` | 最大均等性: 等間隔理想配置からの偏差の逆数 |
| R1274 | `scalePeriodicity` | 周期性: オクターブ内に部分周期（/2、/3、/4、/6）が存在する度合い |

## Round 128 — R1281–R1284: 音階根音協和性・密度分析

| ID | 関数名 | 説明 |
|----|--------|------|
| R1281 | `scalePitchDensityGini` | ピッチ密度ジニ係数: 12半音ビン間のノート分布の不均一性（ジニ係数） |
| R1282 | `scaleRegisterImbalance` | 音域不均衡: 上半オクターブ（600c以上）と下半オクターブの音符数の差÷総数 |
| R1283 | `scaleTritoneAxisCount` | 三全音軸数: 三全音関係（±60セント）にある音程ペアの割合 |
| R1284 | `scaleRootConsonanceScore` | 根音協和スコア: 全音符の根音（0セント）に対する平均協和度 |

## Round 129 — R1291–R1294: 音階倍音整合性分析

| ID | 関数名 | 説明 |
|----|--------|------|
| R1291 | `scaleHarmonicCoherenceIndex` | 倍音整合指数: 音階ピッチが根音倍音列（±30セント）と一致する割合 |
| R1292 | `scaleSubdominantScore` | 完全4・5度スコア: 各音符の完全4度(500c)または5度(700c)への近接度の平均 |
| R1293 | `scaleLeadingToneStrengthV3` | 導音強度: 隣接する音符と100セント以内の半音関係にある音符の割合 |
| R1294 | `scaleOctaveEquivalenceScoreV2` | オクターブ等価スコア: 複数オクターブにわたって現れるピッチクラスの割合 |

## Round 130 — R1301–R1304: 音階モード分類分析

| ID | 関数名 | 説明 |
|----|--------|------|
| R1301 | `scaleModeAffinityScore` | モード親和スコア: 7つの教会旋法との最大一致度 |
| R1302 | `scaleModularityScore` | モジュール性スコア: 音程ギャップの変動係数による音群クラスタ化の度合 |
| R1303 | `scaleTonicStrengthScore` | 主音強度スコア: 完全5度・4度・長3度の存在による主音支持度 |
| R1304 | `scalePentatonicAffinity` | ペンタトニック親和度: 長短ペンタトニックスケールとの最大一致度 |

## Round 131 — R1311–R1314: 音階対称性反転分析

| ID | 関数名 | 説明 |
|----|--------|------|
| R1311 | `scaleInversionSymmetryV2` | 反転対称スコア: 音階を600セント軸で反転した際の自己一致度 |
| R1312 | `scaleRetrogradeSymmetryV2` | 逆行対称スコア: 音程列の前向きと後ろ向きの一致度（回文的対称性） |
| R1313 | `scaleTranspositionSymmetryV2` | 移調対称スコア: 移調しても同じ音階クラスを生成する移調数の割合 |
| R1314 | `scaleRotationalSymmetryV2` | 回転対称スコア: 音程列の回転による自己一致度（限定移調旋法で高い） |

## Round 132 — R1321–R1324: 音階音響心理学分析

| ID | 関数名 | 説明 |
|----|--------|------|
| R1321 | `scaleCriticalBandDensityV2` | 臨界帯域密度: 100セント以内に収まる音程ペアの割合（マスキング傾向） |
| R1322 | `scaleMaskingIndexV2` | マスキング指数: 200セント以内に隣接音を持つ音の割合 |
| R1323 | `scaleLoudnessBalance` | 音量バランス: 低域（<600c）と高域（≥600c）の音符数の均衡度 |
| R1324 | `scaleRoughnessEstimate` | 粗さ推定: 150セント未満の音程ペア割合（小音程は粗さを生む） |

## Round 133 — R1331–R1334: 音階和声進行分析

| ID | 関数名 | 説明 |
|----|--------|------|
| R1331 | `scaleDominantMotionPotential` | 支配的運動ポテンシャル: 三全音(600c)と導音(1100c)の存在によるV→I解決傾向 |
| R1332 | `scaleIIVIPotential` | ii-V-Iポテンシャル: 根音・長2度・完全4度・完全5度の存在度 |
| R1333 | `scaleSecondaryDominantCount` | 副属音数: 5度上に音がある音を副属音ルートとして数えた割合 |
| R1334 | `scaleModalMixtureScore` | モーダルミクスチャースコア: 長短の両バージョン（M3/m3等）が共存する音度数 |

## Round 134 — R1341–R1344: 音階スペクトル整合性分析

| ID | 関数名 | 説明 |
|----|--------|------|
| R1341 | `scaleSpectrumMatchScore` | スペクトル一致スコア: 音度が自然倍音列の主要ポジション（±25c）に一致する割合 |
| R1342 | `scalePartialAlignmentDensity` | 倍音整合密度: 倍音1-16のいずれか（±50c）に一致する音の割合 |
| R1343 | `scaleInharmonicityIndex` | 不協和指数: 各音程ペアの最近傍純正律音程からの平均偏差（50c正規化） |
| R1344 | `scaleSpectralCentroidBias` | スペクトル重心バイアス: 音度分布の重心が600cからどれだけ偏っているか |

## Round 135 — R1351–R1354: 音階音程ベクトル分析

| ID | 関数名 | 説明 |
|----|--------|------|
| R1351 | `scaleIntervalVectorEntropy` | 音程ベクトルエントロピー: 音程クラス1-6の分布のシャノンエントロピー |
| R1352 | `scaleIntervalClassBalanceV2` | 音程クラスバランス: 協和音程クラス(IC3/4/5)の全ペアに占める割合 |
| R1353 | `scaleConsistencyIndex` | 一貫性指数: 音程を積み重ねて得られる音が音階内に含まれる割合 |
| R1354 | `scaleProportionalBalance` | 比例バランス: 隣接音程サイズの変動係数の逆数（等距離に近いほど高い） |

## Round 136 — R1361–R1364: 音階旋律重力分析

| ID | 関数名 | 説明 |
|----|--------|------|
| R1361 | `scaleMelodicGravityScore` | 旋律重力スコア: 各音が根音・P4・P5などの安定音に近い度合の平均 |
| R1362 | `scaleAttractionForceIndex` | 引力指数: 隣接音間の最小音程に基づく音の引力の強さ |
| R1363 | `scaleTensionResolutionRatio` | 緊張解決比: 安定音度（根音/M3/P4/P5/m6）の全音度に対する割合 |
| R1364 | `scaleDirectionBias` | 方向バイアス: 中央値より上の音程和と下の音程和の非対称度 |

## Round 137 — R1371–R1374: 音階調性中心分析

| ID | 関数名 | 説明 |
|----|--------|------|
| R1371 | `scaleTonicClarityScore` | 主音明瞭度スコア: 根音・P5・M3の存在と三全音の欠如による主調明確性 |
| R1372 | `scaleDominantPresence` | 属音存在度: V和音の構成音(G/B/D/F)の存在による属和音機能の強さ |
| R1373 | `scaleSubdominantPresence` | 下属音存在度: IV和音の構成音(F/A/C)の存在による下属和音機能の強さ |
| R1374 | `scaleTonalCenterStrength` | 調性中心強度: 主音明瞭度・属音・下属音存在度の平均 |

## Round 138 — R1381–R1384: 音階和音色彩分析

| ID | 関数名 | 説明 |
|----|--------|------|
| R1381 | `scaleChordColorScore` | 和音色彩スコア: 長/短/属7/長7/減和音のうち内包される種類の割合 |
| R1382 | `scaleBrightnessV2` | 輝度スコア: 音度の平均セント値を1200で正規化（高音ほど明るい） |
| R1383 | `scaleWarmthIndex` | 温かみ指数: 短3度/短6度/短7度（暖色）対長3度/長6度/長7度（明色）の比率 |
| R1384 | `scaleChromaBalance` | クロマバランス: 12半音スロット中いくつの音度が存在するか |

## Round 139 — R1391–R1394: 音階倍音構造整合分析

| ID | 関数名 | 説明 |
|----|--------|------|
| R1391 | `scaleOvertoneMatchRatio` | 倍音一致率: 音度が根音の倍音列(1-16倍音)に±30c以内で一致する割合 |
| R1392 | `scaleUndertoneMatchRatio` | 下倍音一致率: 音度が根音の下倍音列に±30c以内で一致する割合 |
| R1393 | `scaleJustFifthChain` | 純正5度連鎖スコア: 702cの積み重ねで生成される12音に一致する割合 |
| R1394 | `scaleThirdChainScore` | 長3度連鎖スコア: 386cの積み重ねで生成される12音に一致する割合 |

## Round 140 — R1401–R1404: 音階旋律輪郭分析

| ID | 関数名 | 説明 |
|----|--------|------|
| R1401 | `scaleMelodicContourVariety` | 旋律輪郭多様性: 隣接音程の異なるサイズ数を音度数で正規化 |
| R1402 | `scaleAscendingBias` | 上昇バイアス: 600セント超の音度の割合（上向き傾向の測定） |
| R1403 | `scaleStepLeapRatio` | 順次跳躍比: 300セント未満の順次進行が全音程に占める割合 |
| R1404 | `scaleContourComplexity` | 輪郭複雑度: 大小音程の交互出現（方向転換）の頻度 |

## Round 141 — R1411–R1414 音階リズム・パターン分析

| ID | 関数名 | 概要 |
|----|--------|------|
| R1411 | `scalePulseRegularity` | スケール音間隔の均等性（1−変動係数） |
| R1412 | `scaleAccentPotential` | 拍子位置（300cents倍数±25c）に落ちる音の割合 |
| R1413 | `scalePolyrhythmicIndex` | 50cent刻みで2回以上出現する音程数÷音数 |
| R1414 | `scalePhaseCoherence` | 隣接音程差のcos平均を[0,1]正規化したリズム位相一致度 |

**設計根拠**: リズム解析の視点でスケール構造を捉える。均等分割→高いPulseRegularity、拍子整合→高いAccentPotential、反復音程→高いPolyrhythmicIndex、音程変化の滑らかさ→高いPhaseCoherence。

## Round 142 — R1421–R1424 音階音域・展開分析

| ID | 関数名 | 概要 |
|----|--------|------|
| R1421 | `scaleAmbitoRange` | 最低音から最高音までのセント幅を1200で正規化した音域指標 |
| R1422 | `scaleModalInterchangeScore` | 100セント差のペアを持つ音の割合（旋法混交・半音変容指標） |
| R1423 | `scaleChromaticTendencyScore` | 全音階的位置（30c以内）にない音の割合（半音導音傾向） |
| R1424 | `scaleIntervalSpread` | 隣接音程の標準偏差を600cで正規化した音程分散指標 |

**設計根拠**: 音域の広さ（Ambito）、旋法混交（ModalInterchange）、半音傾向音（ChromaticTendency）、音程分散（IntervalSpread）の4軸でスケールの展開特性を多角的に評価する。

## Round 143 — R1431–R1434 音階物理振動分析

| ID | 関数名 | 概要 |
|----|--------|------|
| R1431 | `scaleResonanceFrequencyScore` | 隣接音程が100cent倍数±20c内に入る割合（共鳴周波数整合度） |
| R1432 | `scaleHarmonicOscillatorIndex` | 隣接音程比が小整数比（3/2等）に近い割合（調和振動子整合） |
| R1433 | `scaleDampingRatioEstimate` | 音程の最大・最小比から推定する減衰比（1−min/max） |
| R1434 | `scaleSpringConstantProxy` | 隣接音程の平均を600cで正規化したバネ定数プロキシ |

**設計根拠**: 物理振動系の視点でスケール構造を解釈する。共鳴整合→高いResonance、調和振動子近似→高いHarmonicOscillator、音程ばらつき→高いDamping、音程密度→高いSpringConstant。

## Round 144 — R1441–R1444 音階成長・減衰パターン分析

| ID | 関数名 | 概要 |
|----|--------|------|
| R1441 | `scaleGrowthRateIndex` | 最初と最後の音程差の方向を[0,1]正規化した成長率指標 |
| R1442 | `scaleDecayConstant` | ソート済み音程の指数的減衰定数（大から小への変化速度） |
| R1443 | `scaleTopologyScore` | 150cent刻み音程タイプの多様性÷音程数（位相空間の多様度） |
| R1444 | `scaleConnectivityIndex` | 300c以内の隣接音程（ラップ含む）の割合（連結性指標） |

**設計根拠**: 成長・減衰の視点でスケールのダイナミクスを解析する。音程が大きくなるほど高いGrowth、急激な変化ほど高いDecay、位相多様性が高いほど高いTopology、短音程が多いほど高いConnectivity。

## Round 145 — R1451–R1454 音階音程含有数分析

| ID | 関数名 | 概要 |
|----|--------|------|
| R1451 | `scaleSemitoneContent` | 半音（100c±20c）音程の割合（半音含有度） |
| R1452 | `scaleWholeToneContent` | 全音（200c±20c）音程の割合（全音含有度） |
| R1453 | `scaleTritoneContent` | 三全音（600c±30c）を形成するペアの割合（三全音含有度） |
| R1454 | `scaleMinorThirdContent` | 短3度（300c±20c）音程の割合（短3度含有度） |

**設計根拠**: スケール内の特徴的音程の含有率を定量化する。半音・全音・三全音・短3度は西洋音楽理論の基本的音程で、含有率でスケールの性格を分析できる。

## Round 146 — R1461–R1464 音階重心・分布分析

| ID | 関数名 | 概要 |
|----|--------|------|
| R1461 | `scaleGravitationalCenter` | 全音度セント値の平均÷1200（音階の重心位置） |
| R1462 | `scalePitchVariance` | セント値の標準偏差÷600（音度分布の分散） |
| R1463 | `scaleBalancePoint` | 重心が600cに近い度合い（1−|mean−600|/600） |
| R1464 | `scaleMassDistribution` | 600c以上の音度の割合（上半オクターブ集中度） |

**設計根拠**: 物理系の重心概念をスケールに適用する。均等分布→高いVariance、中央重心→高いBalance、上方集中→高いMassDistribution、各軸の数値を空間的に解釈する。

## Round 147 — R1471–R1474 音階音度分布形状分析

| ID | 関数名 | 概要 |
|----|--------|------|
| R1471 | `scaleDistributionShape` | (平均−中央値)/標準偏差を[0,1]変換した分布歪度 |
| R1472 | `scaleAsymmetryIndex` | 600c以上の音度数と未満の差÷全音数を[0,1]変換した非対称指標 |
| R1473 | `scaleUnimodality` | 200cent刻みビンの占有数の逆数（少ビン=高一峰性） |
| R1474 | `scaleIntervalDensityPeak` | 最頻200centビンの中心を1200で正規化した音程密度ピーク位置 |

**設計根拠**: 確率分布の形状指標（歪度・非対称・一峰性・モード）をスケールに適用。低音集中→低いAsymmetry、均等分布→低いUnimodality、特定音程が多い→特定IntervalDensityPeak。

## Round 148 — R1481–R1484 音階スケール型整合分析

| ID | 関数名 | 概要 |
|----|--------|------|
| R1481 | `scaleHexatonicAffinity` | 音度数が6音に近い度合い（1−|n−6|/6） |
| R1482 | `scaleOctatonicAffinity` | 音度数が8音に近い度合い（1−|n−8|/8） |
| R1483 | `scaleOctaveBalance` | オクターブ四分の一ごとの音度分布の均等性 |
| R1484 | `scaleFifthCircleScore` | 五度圏12ポジション（100c刻み）に±20c内で一致する音の割合 |

**設計根拠**: スケールの音度数と分布をヘキサトニック・オクタトニック・均等性・五度圏の4軸で評価する。標準的な音楽スケール型への整合度を定量化する。

## Round 149 — R1491–R1494 音楽パターン/シーケンス分析

| ID | 関数名 | 概要 |
|----|--------|------|
| R1491 | `scalePatternRepetition` | 連続音程の反復度（隣接音程差<5cなら反復とカウント） |
| R1492 | `scaleMotifDensity` | 半音（100c）刻みのビンに何種類の音度が入るかの密度 |
| R1493 | `scaleRhythmicAffinity` | 各音程が100–700cのリズム的ステップに±25c内で一致する割合 |
| R1494 | `scaleSyncopation` | 前後が協和音程(0/400/700c)で挟まれた音が非協和の割合（シンコペーション） |

**設計根拠**: 音楽パターンの反復・密度・リズム親和性・シンコペーションの4軸でスケールのシーケンス特性を評価する。旋律的な使いやすさと複雑さの定量化に寄与する。

## Round 150 — R1501–R1504 音程周波数比分析

| ID | 関数名 | 概要 |
|----|--------|------|
| R1501 | `scaleSmallIntegerRatioScore` | 隣接音程が純正律の小整数比（0/316/386/498/702/884/1200c）に±15c内で一致する割合 |
| R1502 | `scaleJustIntonationAffinity` | 音度が5リミット純正律の12音階位置に±12c内で一致する割合 |
| R1503 | `scaleRatioComplexity` | 隣接音程が最近傍の半音位置からの距離（50c正規化）→高いほど複雑 |
| R1504 | `scalePrimeLimitScore` | 音度がピタゴラス律（3リミット）の12位置に±15c内で一致する割合 |

**設計根拠**: 音律の純正律・ピタゴラス律への整合度と複雑さを周波数比の観点から評価する。純正律/平均律/微分音スケールの定量的比較に使用できる。

## Round 151 — R1511–R1514 和声/声部進行分析

| ID | 関数名 | 概要 |
|----|--------|------|
| R1511 | `scaleVoiceLeadingSmoothness` | 隣接音程が100c以内なら1点、200c以内なら0.5点の声部進行滑らかさ |
| R1512 | `scaleChromaticDensity` | 完全音程(0/500/700c)を除いた半音位置±30c内に入る音度の密度 |
| R1513 | `scaleSecondaryDominantStrength` | 各音度から完全5度上の位置（副属音）に±20c内で一致する音の割合 |
| R1514 | `scaleModalColor` | 旋法的特徴音（100/300/600/900/1000c）に±25c内で一致する音度の割合 |

**設計根拠**: 西洋音楽の和声・声部進行の観点からスケールを評価する。半音の使い方・旋法的色彩・声部進行の滑らかさを定量化し、機能和声との親和性を測る。

## Round 152 — R1521–R1524 音高クラス多様性/対称性分析

| ID | 関数名 | 概要 |
|----|--------|------|
| R1521 | `scaleRhythmicComplexity` | 隣接音程を25c単位で丸めたユニーク数/全音程数（多様な音程使用度） |
| R1522 | `scaleIntervalClustering` | 音程の変動係数(CV)が低いほど高い（音程が密集している度合い） |
| R1523 | `scalePitchClassDiversity` | 25cビンで測る音高クラスの多様性（最大48ビン） |
| R1524 | `scaleAxisSymmetry` | 12の軸（100c刻み）のうち最大の反転対称性を持つ軸での対称度 |

**設計根拠**: 音高クラスの多様性・音程密集度・対称性を評価する。ホール音楽・民族音楽のスケール構造分析に有用な4指標。

## Round 153 — R1531–R1534 和声距離/異名同音分析

| ID | 関数名 | 概要 |
|----|--------|------|
| R1531 | `scaleHarmonicDistance` | 隣接音程と純正律音程（0/112/204/386/498/702c等）の差の平均が小さいほど高い（純正律近接度） |
| R1532 | `scaleEnharmonicEquivalence` | 各音が12TETグリッド（100c単位）の±10c以内に収まる割合（異名同音的整合性） |
| R1533 | `scaleDiatonicAlignment` | 長調音階（0/200/400/500/700/900/1100c）との±25c以内一致割合 |
| R1534 | `scaleMinorSecondDensity` | 全音程ペアのうち50–150c（短2度近辺）に収まる割合 |

**設計根拠**: 西洋音楽の和声理論・音律整合性の観点からスケールを評価する4指標。純正律との距離、12TETとの整合性、長調音階との整合性、半音密度を定量化する。

## Round 154 — R1541–R1544 機能和声度数分析

| ID | 関数名 | 概要 |
|----|--------|------|
| R1541 | `scaleFlatSeventhContent` | b7度(1000c±30c)に入る音度の割合（ブルース/ミクソリディアン指標） |
| R1542 | `scaleNeutralIntervalCount` | 隣接音程が50–150cの「中性音程帯」に入る割合（微分音的曖昧さ） |
| R1543 | `scaleNonDiatonicDensity` | 長調音階7音(±25c)に入らない非ダイアトニック音の割合 |
| R1544 | `scaleSubdominantStrength` | 完全4度(500c)・完全5度(700c)±20c内に入る音の割合（機能和声の柱） |

**設計根拠**: 機能和声の観点からスケールを評価する。b7の存在・中性音程・非ダイアトニック度・四度五度の充実度を定量化し、調性との親和性や微分音的特徴を測る。

## Round 155 — R1551–R1554 和音構成音分析

| ID | 関数名 | 概要 |
|----|--------|------|
| R1551 | `scaleMajorPentContent` | メジャーペンタトニック音(0/200/400/700/900c±25c)に入る割合 |
| R1552 | `scaleBlueNoteCount` | ブルーノート(300/600/1000c±30c)に入る音度の割合 |
| R1553 | `scaleAugmentedTriadContent` | 増三和音構成音(0/400/800c±25c)に入る音度の割合 |
| R1554 | `scaleDiminishedChordContent` | 減七和音構成音(0/300/600/900c±25c)に入る音度の割合 |

**設計根拠**: 特定の和音・音列への親和性を直接測定する。ブルース・ジャズ・印象主義など各音楽ジャンルのスケール特性を定量化し、音楽的色彩の多様性を評価する。

## Round 156 — R1561–R1564 スケール音組織分析

| ID | 関数名 | 概要 |
|----|--------|------|
| R1561 | `scaleWholeToneAffinity` | 全音音階(0/200/400/600/800/1000c±25c)への親和性 |
| R1562 | `scaleOctatonicAlignment` | 八音音階(減音階)各音(±20c)への整合率 |
| R1563 | `scaleHexatonicBalance` | ヘキサトニック(増音階)音(0/300/400/700/800/1100c±25c)との一致率 |
| R1564 | `scalePentatonicBalance` | 長調・短調ペンタトニック両親和性の平均（対称バランス指標） |

**設計根拠**: 対称スケール・限定転位音階への親和度を直接測定する。全音/減/増/ペンタトニックは各音楽ジャンルのシグネチャーとなり、スケールの「トーナル重心」を特徴付ける。

## Round 157 — R1571–R1574 音高分布統計分析

| ID | 関数名 | 概要 |
|----|--------|------|
| R1571 | `scaleAmbitusScore` | スケールの音域幅（最大-最小cents）を1200cで正規化した値 |
| R1572 | `scaleIntervalVariance` | 隣接音程の変動係数(CV/2)で音程不均等度を[0,1]で表現 |
| R1573 | `scalePitchCentroid` | 音高クラス(mod1200)の重心位置を1200cで正規化（調性重力中心） |
| R1574 | `scaleDistributionBalance` | 12半音ビンへの均等分布度（1-正規化偏差、完全均等=1） |

**設計根拠**: 音高の統計的分布特性を定量化する。音域の広さ・音程の均等性・重心位置・分布均一性は、スケールの空間的構造を客観的に記述する基本指標となる。

## Round 158 — R1581–R1584 リズム密度分析

| ID | 関数名 | 概要 |
|----|--------|------|
| R1581 | `scaleNoteOnsetDensity` | 音域スロット数に対する音の密度（音域100c単位でスロット化） |
| R1582 | `scaleRestDensity` | 12半音スロット(±30c)が空である割合（スケールの「休止」指標） |
| R1583 | `scaleRhythmicRegularity` | 隣接音程の変動係数(1-CV)で音程均等性を測定 |
| R1584 | `scaleTemporalPatternScore` | 隣接3音のインターバル比が2:1以内の局所整合ペア割合 |

**設計根拠**: スケールの密度・空白・均等性を定量化するリズム的指標群。音楽的な「充実感」「空間感」「規則性」を客観的に評価し、アルゴリズム作曲やスケール選択に活用できる。

## Round 159 — R1591–R1594 旋法様式分析

| ID | 関数名 | 概要 |
|----|--------|------|
| R1591 | `scaleLydianContent` | リディアン旋法(増4度特徴音)への音高一致率(±25c) |
| R1592 | `scaleDoianContent` | ドリアン旋法(長6度特徴音)への音高一致率(±25c) |
| R1593 | `scalePhrygianContent` | フリジアン旋法(短2度特徴音)への音高一致率(±25c) |
| R1594 | `scaleMixolydianContent` | ミクソリディアン旋法(短7度特徴音)への音高一致率(±25c) |

**設計根拠**: 西洋教会旋法(Church Modes)への親和性を直接定量化する。各旋法の特徴音を指標とすることで、スケールの「旋法的色彩」を評価し、ジャズ・民族音楽・現代音楽の分析に活用できる。

## Round 160 — R1601–R1604 追加旋法分析

| ID | 関数名 | 概要 |
|----|--------|------|
| R1601 | `scaleLocrianContent` | ロクリアン旋法(減5度特徴音)への音高一致率(±25c) |
| R1602 | `scaleAeolianContent` | エオリアン/自然短音階への音高一致率(±25c) |
| R1603 | `scaleIonianContent` | イオニアン/長音階への音高一致率(±25c) |
| R1604 | `scalePhrygianDominantContent` | フリジアン・ドミナント(スパニッシュ・フリジアン)への一致率(±25c) |

**設計根拠**: 残る3教会旋法(ロクリアン/エオリアン/イオニアン)とフリジアン・ドミナントを追加し、全7教会旋法+スペイン旋法を網羅する。フラメンコ・スパニッシュ・中東音楽の特徴音程を捕捉できる。

## Round 161: 特殊旋法分析 (R1605–R1608)

**Functions**: `scaleLydianDominantContent`, `scaleDoubleHarmonicContent`, `scaleHungarianMinorContent`, `scaleNeapolitanMajorContent`

**Motivation**: Extends modal analysis to exotic scales used in jazz, Byzantine, and Eastern European music. Lydian Dominant (acoustic scale) is fundamental to jazz composition. Double Harmonic (Byzantine) and Hungarian Minor provide augmented second intervals characteristic of Middle Eastern music. Neapolitan Major enables analysis of Baroque-era harmonic practices.

**Implementation**: Each function matches pitches within ±25 cents of the target modal degrees using modular arithmetic. Returns ratio of matched pitches in [0,1].

## Round 162: 拡張和声分析 (R1609–R1612)

**Functions**: `scaleAugmentedSecondContent`, `scaleTritoneSubstitutionContent`, `scaleNeapolitanChordContent`, `scaleGermanSixthContent`

**Motivation**: Extends harmonic analysis to chromatic and augmented sixth chord vocabulary. Augmented seconds are characteristic of harmonic minor and Hungarian scales. Tritone substitution is central to jazz harmony. Neapolitan and German sixth chords are hallmarks of Late Classical and Romantic harmonic language.

**Implementation**: Each function uses interval-based detection with cent-tolerance windows. Returns ratio in [0,1] using pitch-to-cents conversion via `pitchToCents()`.

## Round 163: ジャズ拡張和声分析 (R1613–R1616)

**Functions**: `scaleSharpElevenContent`, `scaleFlatNineContent`, `scaleSharpNineContent`, `scaleFlatThirteenContent`

**Motivation**: Detects jazz-specific chromatic alterations beyond basic modal content. Sharp 11 (#11/Lydian note) is fundamental to Lydian Dominant and acoustic scale harmony. Flat 9, sharp 9, and flat 13 are the characteristic "altered" extensions in dominant seventh chords (the altered scale). These are essential markers of bebop and post-bop jazz vocabulary.

**Implementation**: Each function checks what fraction of pitches fall within ±25 cents of the target degree (mod 1200). Returns ratio in [0,1].

## Round 164: 旋法密度分析 (R1617–R1620)

**Functions**: `scaleLeadingToneContent`, `scaleModalColorContent`, `scaleEnneatonicContent`, `scaleHeptatonicDensity`

**Motivation**: Measures structural properties of scales beyond mode matching. Leading tone detection identifies classical vs. modal orientation. Modal color content captures the minor/modal "flavor" via b3/b6/b7. Enneatonic and heptatonic density measure how many distinct pitch-class slots a scale fills against 9-tone and 7-tone templates respectively.

**Implementation**: Leading tone and modal color use ±25c tolerance matching. Enneatonic and heptatonic density quantize to 100c slots and compare set sizes.

## Round 165: 音程質量分析 (R1621–R1624)

**Functions**: `scaleFifthQualityScore`, `scaleThirdQualityScore`, `scaleSixthQualityScore`, `scaleSeventhQualityScore`

**Motivation**: Measures the prevalence of consonant interval classes within a scale. Fifth quality captures perfect-fifth richness (important for tonal stability). Third, sixth, and seventh quality scores reflect harmonic richness across the most common chord tones. Together these provide a harmonic profile complementary to the modal content scores.

**Implementation**: Each function counts all pitch pairs forming the target interval (within tolerance), normalized by total pairs. Returns ratio in [0,1].

## Round 166: スケール位相分析 (R1625–R1628)

**Functions**: `scaleConvexityIndex`, `scalePitchGapIndex`, `scaleIntervalProfile`, `scaleGapSymmetryScore`

**Motivation**: Analyses the topological shape of scale interval patterns. Convexity index measures how monotonically interval sizes change across the scale. Pitch gap index captures the largest empty region in pitch space, a measure of scale sparsity. Interval profile diversity scores how many distinct step sizes appear. Gap symmetry detects palindromic interval structures (as found in symmetric scales).

**Implementation**: All functions operate on sorted pitch-class arrays with modular arithmetic. Returns ratio in [0,1].

## Round 167: 音程カウント分析 (R1629–R1632)

**Functions**: `scaleSecondIntervalRatio`, `scaleSemitoneCount`, `scaleWholeToneCount`, `scaleMajorSecondRatio`

**Motivation**: Quantifies the stepwise motion characteristics of a scale. Second interval ratio measures how step-wise (vs. leaping) a scale is. Semitone and whole-tone counts identify chromatic vs. diatonic orientation. Major-to-minor second ratio captures the balance between whole-tone and half-tone motion, critical for distinguishing diatonic, chromatic, and microtonal scales.

**Implementation**: Sorts pitches into ascending pitch-class order, then classifies each adjacent step by cent distance. Returns normalized ratios in [0,1].

## Round 168: 和声機能分析 (R1633–R1636)

**Functions**: `scaleAppoggiaturaContent`, `scaleChordToneRatio`, `scaleNonChordToneRatio`, `scaleOrnamentationIndex`

**Motivation**: Extends harmonic analysis to functional categories. Chord tone ratio measures how "triadic" a scale is relative to the major triad template. Non-chord tone ratio is its complement, capturing scale notes that require melodic resolution. Appoggiatura content detects notes in the 50–150c neighbourhood of chord tones — the typical range for ornamental dissonances. Ornamentation index estimates passing/neighbor tone density between structural tones.

**Implementation**: All functions use ±25–30c cent-tolerance matching against [0, 400, 700] (major triad). Returns ratio in [0,1].

## Round 169: 和音配置分析 (R1637–R1640)

**Functions**: `scaleRootPositionStrength`, `scaleFirstInversionContent`, `scaleSecondInversionContent`, `scaleOpenVoicingRatio`

**Motivation**: Analyses chord voicing and inversion content within a scale. Root position strength measures whether a complete root-position triad (root + third + fifth) is present. First and second inversion content detect characteristic pitches for each inversion. Open voicing ratio captures the spacing density — high values indicate widely-spaced intervals typical of open (orchestral) voicing.

## Round 170: 微分音程分析 (R1641–R1644)

**Functions**: `scaleQuarterToneRatio`, `scaleMicrotoneCount`, `scaleSubsemitoneContent`, `scaleFifthOfSemitone`

**Motivation**: Detects microtonal interval content beyond 12-TET chromaticism. Quarter-tone ratio identifies Arabic maqam and 24-EDO scale characteristics. Microtone count captures sub-semitone step density. Sub-semitone content measures how many pitches deviate from 12-TET grid by more than 15c. Fifth-of-semitone detects extreme microtonality (~20c steps, characteristic of very high EDO systems).

**Implementation**: Sorts pitch classes, computes adjacent intervals, and counts matches by cent-range criteria. Sub-semitone content uses modular rounding to nearest 100c. Returns ratio in [0,1].

**Implementation**: Uses ±25c tolerance matching and sorted pitch-class intervals. Returns ratio in [0,1].

## Round 171: 音響重心分析 (R1645–R1648)

**Functions**: `scaleEnergyBalance`, `scalePitchMoment`, `scaleHarmonicWeight`, `scaleSpectralWeight`

**Motivation**: Provides spectral-domain analysis of pitch-class distributions. Energy balance measures the symmetry of pitches above vs below the tritone midpoint (600c). Pitch moment computes the mean cent position as a centroid. Harmonic weight scores alignment with reduced harmonic-series partials. Spectral weight applies a 1/f rolloff weighting to emphasize lower pitch positions.

**Implementation**: Energy balance uses a symmetry ratio. Pitch moment normalizes mean cents by 1200. Harmonic/spectral weight use tolerance matching and weighted sums respectively. All return [0,1].

## Round 172: 純正律近似分析 (R1649–R1652)

**Functions**: `scaleEDOAlignment`, `scaleJustApproximation`, `scaleCommaContent`, `scaleSchismaContent`

**Motivation**: Measures how closely a scale approximates standard tuning references. EDO alignment quantifies 12-TET conformity (useful for distinguishing microtonal from diatonic scales). Just approximation matches against the 5-limit JI grid. Comma content identifies the characteristic small-interval steps used in adaptive JI and comma-pump modulation. Schisma content detects ultra-fine tuning adjustments at the 2c and 19.5c level.

**Implementation**: EDO alignment uses 10c tolerance to nearest 100c. Just approximation uses 8c tolerance against 12 canonical 5-limit intervals. Comma/schisma content classify adjacent step sizes by cent range. All return ratio in [0,1].

## Round 173: 音階規模分析 (R1653–R1656)

**Functions**: `scaleToneCount`, `scaleCardinalityScore`, `scaleSaturation`, `scaleDegreeSpread`

**Motivation**: Quantifies the size and coverage of a scale. Tone count measures how many notes appear relative to the chromatic scale (12). Cardinality score counts distinct pitch classes (10c resolution). Saturation measures octave coverage in 50c slots (24 possible). Degree spread captures the interval range from lowest to highest pitch class.

**Implementation**: Tone count is a simple length normalization. Cardinality uses Set deduplication with 10c rounding. Saturation uses 50c floor bins. Degree spread uses min/max of cents values. All return ratio in [0,1].

### Round 174: 黄金比・フィボナッチ音階分析

- `scaleGoldenRatioContent(pitches)` — 音高が黄金比由来の度数（φ^k × 100 cent mod 1200）に近い割合
- `scaleFibonacciPattern(pitches)` — 隣接音程がフィボナッチ数列（半音×100 cent）に一致する割合
- `scaleBeautyIndex(pitches)` — 回文対称性と協和音程比率の複合美指数
- `scaleSymmetryScore(pitches)` — 音程列の回文対称スコア

### Round 175: モーダル・調性分析

- `scaleModalAmbiguityScore(pitches)` — 異なる旋法的音程クラスの数を正規化したモーダル曖昧度スコア
- `scaleChromaticDensityIndex(pitches)` — 隣接音程のうち半音以下の割合（半音彩度密度）
- `scaleVoiceLeadingSmoothnessScore(pitches)` — 隣接音程が全音以下の割合（声部進行の滑らかさ）
- `scaleEnharmonicPotential(pitches)` — 平均律境界（100centの倍数）に近い音高の割合（異名同音ポテンシャル）

### Round 176: 和声理論分析

- `scaleHarmonicTensionProfile(pitches)` — 音程ペアのトライトーン/短2度/長7度比率から導出した和声的緊張プロファイル
- `scalePentatonicAlignment(pitches)` — 長音階ペンタトニック度数（0/200/400/700/900 cent）への整合度
- `scaleRootDoubling(pitches)` — 根音・オクターブ（0/1200 cent付近）を重複させる音高の割合
- `scaleDominantDriveScore(pitches)` — 導音・トライトーン・完全5度の存在による属和音的推進力スコア

### Round 177: 音程モーション・跳躍分析

- `scaleLeapContentRatio(pitches)` — 隣接音程のうち長2度超（跳躍）の割合
- `scaleStepwiseMotionRatio(pitches)` — 隣接音程のうち全音以下（順次進行）の割合
- `scaleIntervalRegularity(pitches)` — 隣接音程の分散の低さから導出した規則性スコア（均等分割ほど高い）
- `scaleRegistralSpread(pitches)` — 音域の広がり（cent単位レンジ / 4800 centで正規化）
