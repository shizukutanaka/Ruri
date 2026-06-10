# src/core — CLAUDE.md (高リスク領域)

> 変換系は I7(AI生成エラー1.75倍前提)対象。変更時は性質テスト緑を必須とする。

## 不変条件

- **比(ratio)が一次、centsは導出**。純正律/倍音調律は `fromRatio` で保持し、`pitchToCents` で必要時のみ変換。cents から比への逆変換は不可逆(近似)につき実装しない。
- **cents↔周波数は基準Hz相対**。絶対音高は `(cents, referenceHz)` の対でのみ確定。
- **調律に単一正規形なし**: `periodCents` は1200固定でない(伸張オクターブ・非オクターブ反復)。`degreeToCents` は周期ラップで処理。`reference_hz`/`source` を捨てない。
- **MPE変換は受信側の bendRange と一致必須**。`freqToMpe`/`mpeToFreq` は同じ `bendRangeSemitones` で対にする。14-bitベンドの分解能 = `range*100/16384` cents/step、丸め誤差はその半分が上限(性質テストで保証)。

## 検証

- `vitest run` で 26 テスト緑。性質テスト: 比積=cents和 / cents↔freq往復 / 整数ノート往復 / MPE往復 / 粗さ非負 / 粗さ対称。
- **粗さscorer(Plomp-Levelt/Sethares)は既知極小で検証**: harmonic音色→純正律協和音程(386/498/702/884c…)に極小、bell音色→別の協和音程集合。協和は timbre 依存。
- バイナリ出力(SMF/MTS SysEx)は Phase 2 で追加。実機検証は Surge XT。

## 不変条件(追加)

- **協和は西洋規則でなく楽器スペクトルで判定**。`chordDissonance(freqs, spectrum)` のスペクトルは合成音色と同一物を用いる(単一真実源)。`dissonancePair` は非負(A1<A2)・対称・同一周波数で0。

## Gotchas

- `noUncheckedIndexedAccess` 有効。配列インデックスは `undefined` 可能性を処理。
- `ratio()` は正整数のみ。非整数/ゼロは即 `RangeError`(fail fast)。
