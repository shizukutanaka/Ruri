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
