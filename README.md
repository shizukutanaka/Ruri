# Ruri (流離)

World tuning / scale / chord backbone for DTM output. 12-TET から非12平均律(マカーム・ラーガ・ガムラン等)までを統一表現し、DTM へ出力する。無料・MIT。

## 状態

Phase 0-2 のコア完成。`src/core`(調律・生成・協和・運指・合成)+ `src/adapters`(SMF/Scala(.scl/.kbm)/MPE/WAV/MTS/.tun)+ `src/data`(出典付き調律)+ `shell-web`(デモUI)。642テスト、カバレッジ約99%(文/行 98.9%・分岐 97.6%・関数 100%)、zero runtime-dep。`npm run build` で dist/(ESM + 型定義)を生成、exports マップ付きで npm 配布可能。Pre-1.0 ゆえ API は変わりうる。

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
// 旋法/jins/raga(Scale層)を周波数へ / 旋法ランキング — 採点・合成・エクスポートの入口
import { equalTemperament12, scaleToFreqs, scaleMode, rankModes } from 'ruri';
import { harmonicSpectrum, bellSpectrum } from 'ruri';

const tuning = equalTemperament12(261.63);       // C4 基準
const ionian = { id: 'ionian', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0, 2, 4, 5, 7, 9, 11] };
const freqs = scaleToFreqs(ionian, tuning);      // 旋法 → Hz(chordDissonance/pluck へそのまま)

// 旋法転回: Ionian の第2旋法 = Dorian (マカーム・ラーガで基本操作)
const dorian = scaleMode(ionian, 1, tuning);     // degreeIndices: [0,2,3,5,7,9,10]

// 旋法ランキング: 「この調律のどの旋法が最も響くか」を音色別に評価
const ranked = rankModes(ionian, tuning, harmonicSpectrum()); // 調和音色で評価
const ranked2 = rankModes(ionian, tuning, bellSpectrum());    // ベル音色では別順位に
// ranked[0].scale → 最も協和する旋法 / ranked[0].modeIndex → その旋法番号

// Scale → TuningSystem: ダイアトニック和音探索の入口
import { scaleToTuning, tuningToScale } from 'ruri';
import { rankChords, rankedChordToChord } from 'ruri';
const dorianTuning = scaleToTuning(dorian, tuning);    // 7音の sub-TuningSystem
const dorianChords = rankChords(dorianTuning, { size: 3 }); // ダイアトニック3和音のみ

// 生成層 → 旋法層 → 発見 → 再利用: 完全パイプライン
import { generatedTuning } from 'ruri';
const mosTuning = generatedTuning(700, 1200, 7);       // 5度積み上げ MOS
const mosScale = tuningToScale(mosTuning);             // TuningSystem → Scale
const mode2 = scaleMode(mosScale, 1, mosTuning);       // 第2旋法
const mode2Triads = rankChords(scaleToTuning(mode2, mosTuning), { size: 3 });
const portable = rankedChordToChord(mode2Triads[0]!);  // 再利用可能 Chord
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

// 純正律(JI)は比を一次保持 — 比工場で精度保全
import { chordFromRatios } from 'ruri';
const justMajor = chordFromRatios('just-major', [[1,1],[5,4],[3,2]]);
// chordToCents(justMajor)[1] ≈ 386.31c (vs 12-TET 400c: 13.7c差)
```

```ts
// b-2) 和音 → 運指: Chord から guitarStandard() へ直接橋渡し
import { chordFromSemitones, chordToCentOffsets } from 'ruri';
import { guitarStandard } from 'ruri';
import { fingerChord } from 'ruri';

const guitar = guitarStandard();
const major = chordFromSemitones('major', [0, 4, 7]);
// ギター 5 弦開放 A2 = openStringsCents[1] = 500c をルートに
const fingerings = fingerChord(guitar, chordToCentOffsets(major, 500));
```

```ts
// c-0) 文化的調律プリセット: ID で直接取得
import { getTuningById } from 'ruri/data';

const makam = getTuningById('makam-ussak-example');  // Makam Uşşak → TuningSystem
const slendro = getTuningById('slendro-example');    // ガムランスレンドロ(伸張オクターブ)
// 利用可能 id: '12-tet' | 'just-5-limit' | 'makam-ussak-example' | 'slendro-example' | 'pelog-example'
if (makam) {
  const chords = rankChords(makam, { size: 3 });     // そのまま和音ランキングへ
}
```

```ts
// c) DAW/シンセ連携: MTS SysEx と .kbm キーボードマッピング
import { edo } from 'ruri';
import { tuningToMtsFrequencies, mtsBulkDump } from 'ruri/adapters';
import { parseKbm, kbmNoteToFreq } from 'ruri/adapters';
import { parseScl } from 'ruri/adapters';

// 19-EDO を MTS 非リアルタイム一括ダンプ(408 バイト)に変換して DAW へ送信
const sysex: Uint8Array = mtsBulkDump(tuningToMtsFrequencies(edo(19)), '19-edo');

// TuningSystem → Scala .scl: 微分音エコシステムへの直接エクスポート
import { tuningToScl, writeScl } from 'ruri/adapters';
const sclText: string = writeScl(tuningToScl(edo(19)));   // 19-EDO を .scl テキストへ

// .kbm で任意の MIDI ノートを周波数に解決(未マップキーは null)
const scale = parseScl(sclFileText);
const mapping = parseKbm(kbmFileText);
const hz: number | null = kbmNoteToFreq(scale, mapping, 69);  // MIDI 69 → Hz
```

```ts
// d) 協和は音色依存: 同じ走査でも音色が変われば協和音程が変わる(本ライブラリの核心)
import { consonantIntervals, harmonicSpectrum, bellSpectrum, spectrumToTuning } from 'ruri';

// 倍音音色 → 純正律の協和音程(3/2, 4/3, 5/4…)が極小として現れる
const harm = consonantIntervals(harmonicSpectrum());
// → [{ ratio: ~1.333, cents: ~498, dissonance }, { ratio: ~1.5, cents: ~702, ... }, ...]

// ベル音色 → 同じ [1,2] 走査でも別の協和音程集合になる(西洋の音程名に依存しない)
const bell = consonantIntervals(bellSpectrum());

// 命題の帰結: 音色から最適調律を直接生成 → 全パイプライン(rankChords/mtsBulkDump/etc.)に直結
const harmTuning = spectrumToTuning(harmonicSpectrum()); // 純正律系の TuningSystem
const bellTuning = spectrumToTuning(bellSpectrum());     // ベル音色固有の TuningSystem

// d-2) 既存調律の音色適合度を評価: 「12-TETはどのくらい倍音音色に最適か？」
import { tuningSuitability } from 'ruri';
import { edo } from 'ruri';

const fit12 = tuningSuitability(edo(12), harmonicSpectrum()); // coverage ~0.7–1.0
const fitBell = tuningSuitability(edo(12), bellSpectrum());   // coverage < fit12.coverage
// 倍音音色の自己導出調律 → 定義上 coverage = 1.0（上限基準として使用）
const ceiling = tuningSuitability(spectrumToTuning(harmonicSpectrum()), harmonicSpectrum());
// → { coverage: 1, avgErrorCents: 0, ... }
```

```ts
// d-3) Chord オブジェクト → Web Audio ボイス: 2ステップを1コールに統合
import { chordFromSemitones } from 'ruri';
import { voicesForChordObject, voicesForChord } from 'ruri';

const chord = chordFromSemitones('major', [0, 4, 7]);
// Before (2 steps): realizeChordFreqs → voicesForChord
// After (1 call): Chord + rootHz + spectrum → Voice[]
const voices = voicesForChordObject(chord, 261.63, harmonicSpectrum());
// voices[i] = { freq: Hz, gain: amplitude } → schedule on OscillatorNode
```

```ts
// e) ランキング → 進行スムーズネス: 和音探索から進行評価まで一本のパイプライン
import { generatedTuning, rankChords, realizeRankedChordFreqs, progressionSmoothness,
         rankedChordToChord, chordProgressionSmoothness, harmonicSpectrum } from 'ruri';

const tuning = generatedTuning(700, 1200, 7);          // ダイアトニック MOS → TuningSystem
const chords = rankChords(tuning, { size: 3, limit: 4 });  // 協和度ランキング
// 上位4和音の進行コスト (cents) — 数値が小さいほど滑らか
const cost = progressionSmoothness(chords, 261.63);

// 個別ペアの実周波数も取り出せる
const freqsA = realizeRankedChordFreqs(chords[0]!, 261.63);  // RankedChord → Hz

// 発見した和音を再利用可能な Chord として保存 → fingerChord / writeScl / 別調律へ持ち込み可
const portable = chords.map(c => rankedChordToChord(c));      // RankedChord[] → Chord[]
const cost2 = chordProgressionSmoothness(portable, 261.63);  // Chord[] でも同じ進行評価が可能

// 最適順序を求める: rankChords の返却順序は協和度順であり、声部導線コストは最適でない
import { optimalChordOrder } from 'ruri';
const optimal = optimalChordOrder(portable, 261.63);
// optimal.chords → 最小ボイスリーディングコストの順番に並んだ Chord[]
// optimal.order  → 元配列へのインデックス (例: [2, 0, 3, 1])
// optimal.totalCents → 進行全体のコスト (cents)
```

```ts
// f) 和音合成 → WAV: rankChords → 1コール合成 → エクスポート
import { generatedTuning, rankChords, realizeRankedChordFreqs } from 'ruri';
import { pluckChord, strikeChord, harmonicSpectrum, bellSpectrum } from 'ruri';
import { encodeWav } from 'ruri/adapters';

const tuning = generatedTuning(700, 1200, 7);
const chords = rankChords(tuning, { size: 3, limit: 1 });
const freqs = realizeRankedChordFreqs(chords[0]!, 261.63);

// Karplus-Strong ギター和音 → WAV (1コール)
const ksWave = pluckChord(freqs);
const wavBytes = encodeWav(ksWave);

// ベル音色モーダル和音 → WAV (音色をそのまま協和評価と共有)
const bellWave = strikeChord(freqs, bellSpectrum());
```

```ts
// g) MOS 判定: TuningSystem が Myhill's property を持つか直接確認
import { generatedTuning, maximallyEvenTuning, isTuningWellFormed } from 'ruri';

isTuningWellFormed(generatedTuning(700, 1200, 7));   // true (ダイアトニック MOS)
isTuningWellFormed(generatedTuning(700, 1200, 5));   // true (ペンタトニック MOS)
isTuningWellFormed(maximallyEvenTuning(12, 7));      // true (gcd(12,7)=1)
isTuningWellFormed(maximallyEvenTuning(12, 6));      // false (全音音階、gcd=6)

// Scale と TuningSystem の整合性を事前確認 (assertTuningMatch の公開版)
import { isScaleCompatible } from 'ruri';
const myScale = { id: 'my', name: 'my', tuningId: '12-tet', degreeIndices: [0, 2, 4, 7] };
if (isScaleCompatible(myScale, tuning)) {
  const freqs = scaleToFreqs(myScale, tuning);  // 安全に呼べる
}
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
