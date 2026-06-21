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
