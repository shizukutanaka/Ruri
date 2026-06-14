# Ruri (流離)

World tuning / scale / chord backbone for DTM output. 12-TET から非12平均律(マカーム・ラーガ・ガムラン等)までを統一表現し、DTM へ出力する。無料・MIT。

## 状態

Phase 0-2 のコア完成。`src/core`(調律・生成・協和・運指・合成)+ `src/adapters`(SMF/Scala(.scl/.kbm)/MPE/WAV/MTS/.tun)+ `src/data`(出典付き調律)+ `shell-web`(デモUI)。421テスト、カバレッジ約99%(文/行 98.9%・分岐 97.6%・関数 100%)、zero runtime-dep。`npm run build` で dist/(ESM + 型定義)を生成、exports マップ付きで npm 配布可能。Pre-1.0 ゆえ API は変わりうる。

## リポジトリ構成

```
src/core/        調律・cents/比・生成(MOS/最大均等)・協和(粗さ+harmonicity)・運指・合成
src/adapters/    出力: SMF(.mid) / Scala(.scl/.kbm) / MPE / WAV / MTS SysEx / .tun
src/data/        出典付き調律プリセット + provenance/CARE検証ローダ
shell-web/       単一HTMLデモUI(オフライン)
docs/            設計・調査記録(Plan / WORKFLOW / research / 競合分析 / データ出典 / 監査)
```

## 使い方

```ts
// a) 調律系の生成と周波数取得
import { edo, equalTemperament12, degreeToFreq, generatedTuning, maximallyEvenTuning } from 'ruri';

const tuning19 = edo(19);                        // 19-EDO, A4=440Hz
const tuning12 = equalTemperament12(440);        // 12-TET
const freq = degreeToFreq(tuning19, 3);          // 3度目の音の Hz

// MOS(生成音階)と最大均等集合を直接 TuningSystem として取得
const diatonic = generatedTuning(700, 1200, 7);  // 5度積み上げダイアトニック
const me7of12 = maximallyEvenTuning(12, 7);      // Clough-Douthett 7-of-12
```

```ts
// 旋法/jins/raga(Scale層)を周波数へ — 採点・合成・エクスポートの入口
import { equalTemperament12, scaleToFreqs } from 'ruri';

const tuning = equalTemperament12(261.63);       // C4 基準
const dorian = { id: 'dorian', name: 'Dorian', tuningId: '12-tet', degreeIndices: [0, 2, 3, 5, 7, 9, 10] };
const freqs = scaleToFreqs(dorian, tuning);      // 旋法 → Hz(chordDissonance/pluck へそのまま)
```

```ts
// b) 和音 → 不協和度評価 → Scala エクスポート
import {
  chordFromSemitones, realizeChordFreqs,
  chordDissonance, harmonicSpectrum,
} from 'ruri';
import { sclFromCents, writeScl } from 'ruri/adapters';

const chord = chordFromSemitones('major', [0, 4, 7]);
const freqs = realizeChordFreqs(chord, 261.63);         // C4 root
const roughness = chordDissonance(freqs, harmonicSpectrum());
const scl = sclFromCents('major triad', [400, 700, 1200]);
const sclText = writeScl(scl);                          // .scl 文字列
```

```ts
// c) DAW/シンセ連携: MTS SysEx と .kbm キーボードマッピング
import { edo } from 'ruri';
import { tuningToMtsFrequencies, mtsBulkDump } from 'ruri/adapters';
import { parseKbm, kbmNoteToFreq } from 'ruri/adapters';
import { parseScl } from 'ruri/adapters';

// 19-EDO を MTS 非リアルタイム一括ダンプ(408 バイト)に変換して DAW へ送信
const sysex: Uint8Array = mtsBulkDump(tuningToMtsFrequencies(edo(19)), '19-edo');

// .kbm で任意の MIDI ノートを周波数に解決(未マップキーは null)
const scale = parseScl(sclFileText);
const mapping = parseKbm(kbmFileText);
const hz: number | null = kbmNoteToFreq(scale, mapping, 69);  // MIDI 69 → Hz
```

```ts
// d) 協和は音色依存: 同じ走査でも音色が変われば協和音程が変わる(本ライブラリの核心)
import { consonantIntervals, harmonicSpectrum, bellSpectrum } from 'ruri';

// 倍音音色 → 純正律の協和音程(3/2, 4/3, 5/4…)が極小として現れる
const harm = consonantIntervals(harmonicSpectrum());
// → [{ ratio: ~1.333, cents: ~498, dissonance }, { ratio: ~1.5, cents: ~702, ... }, ...]

// ベル音色 → 同じ [1,2] 走査でも別の協和音程集合になる(西洋の音程名に依存しない)
const bell = consonantIntervals(bellSpectrum());
```

```ts
// e) ランキング → 実周波数 → ボイスリーディング: 和音探索から最滑進行まで一本のパイプライン
import { generatedTuning, rankChords, realizeRankedChordFreqs, voiceLeadingCost, harmonicSpectrum } from 'ruri';

const tuning = generatedTuning(700, 1200, 7);          // ダイアトニック MOS → TuningSystem
const chords = rankChords(tuning, { size: 3 });        // 協和度ランキング
const freqsA = realizeRankedChordFreqs(chords[0]!, 261.63);  // RankedChord → Hz
const freqsB = realizeRankedChordFreqs(chords[1]!, 261.63);
const smoothness = voiceLeadingCost(freqsA, freqsB);   // 最小声部進行コスト(cents)
```

## 設計原則

- **cents/比の二層**: 純正律は比を一次保持、cents は導出(精度保全)。
- **調律に単一正規形なし**: `reference_hz` / `octave_ratio`(非オクターブ可) / `source` を必須メタに。
- **協和は timbre 依存**: スペクトル層を協和判定と合成の単一真実源とし、Plomp-Levelt/Sethares 粗さ + Stolzenburg harmonicity で採点。**acoustic-only**(文化的親しみは含めない=美的判定をしない)。
- **生成はイディオム非依存**: MOS(生成音階)・最大均等(Clough-Douthett)。三度堆積を前提しない。
- zero runtime-dependency、単一/最小依存配布、Carmack/Martin/Pike。

## モジュール (`src/core`)

| ファイル | 役割 |
|----------|------|
| `ratio` | 純正律の厳密有理数 |
| `cents` | cents↔周波数、Pitch(cents/比) |
| `midi` | 12-TET↔周波数、MPE(ノート+pitch-bend) |
| `tuning` | 調律系(周期・基準・出自) + 不変条件 |
| `scale` | 旋法/スケール/ジンス/ラーガ |
| `chord` | 和音抽象(ルート相対音程) |
| `spectrum` | 楽器の部分音集合(harmonic/stretched/bell) |
| `dissonance` | Plomp-Levelt/Sethares 感覚的不協和 |
| `generate` | MOS・well-formed判定・最大均等 |
| `harmonicity` | Stolzenburg 周期性/harmonicity |

## 開発

```
npm install
npm run check      # typecheck + lint + format:check + test
npm run coverage
```

tsc strict / eslint 警告ゼロ / prettier / vitest(性質テスト + 既知極小オラクル)。

`npm run build` で dist/(ESM + 型定義)を生成、npm 配布可能。

## ライセンス

MIT。調律データを追加する際は出典・ライセンスを明記(同梱データは個別表記)。
