# ソクラテス問答による検証記録 (2026-06)

ruri の新規実装(temperament / chord-search / voice-leading / envelope / fretless / edo / mts / kbm / tun)に対し、設計の前提を一つずつ問い直した記録。「動くか」ではなく「自分の哲学に忠実か」を問う。

各問いは **問 → 検証 → 判定** の形を取る。判定は ✅健全 / ⚠️要開示 / ❌矛盾 のいずれか。

---

## Q1. 「協和は timbre 依存」は `rankChords` で本当に成り立っているか？ ❌→⚠️(開示で解消)

**問**: README は「協和は timbre 依存」「acoustic-only、美的判定をしない」と宣言する。`rankChords` はこれを守っているか。

**検証**: `src/core/chord-search.ts:130-131` で各和音のスコアは2項の加重和:

- `roughness = chordDissonance(freqs, spectrum)` — スペクトルを受け取る。**timbre依存** ✅
- `periodicity = chordPeriodicity(freqs)` — `src/core/harmonicity.ts:53` を見ると **周波数しか受け取らない**。周波数比を純正比にスナップして周期性を測る = 調和級数を暗黙に仮定した**timbre非依存**の尺度。

既定 `periodicityWeight = 0.5` ゆえ、ベル音色を渡してもスコアの半分は「もし調和音色だったら」を前提に計算される。旗印の半分が既定で破れている。

**判定**: ⚠️ 矛盾だが、`periodicityWeight = 0` にすれば純 timbre 依存スコアが得られるので**設計の逃げ道は存在する**。問題は「既定が黙ってこれを混ぜる」隠蔽性。
→ **改善**: JSDoc で2軸の性質(roughness=timbre依存 / periodicity=timbre非依存)を明示。音色を差し替えると roughness 順位が変わり(timbre依存の証明)、periodicity 単独では変わらない(timbre非依存の証明)ことをテストで固定。隠れた前提を**消すのではなく可視化**するのがソクラテス的解。

## Q2. `regularTemperament` の dedup 許容 `1e-9` は `defineTuning` と整合するか？ ✅

**検証**: `temperament.ts:67` は隣接度数の差が `< 1e-9` なら throw。`defineTuning`(`tuning.ts:35`)は厳密昇順(`c <= prev` で throw)。dedup が差 `>= 1e-9 > 0` を保証するので昇順検査は必ず通る。順序の不整合は生じない。
**判定**: ✅ 健全。ただし `1e-9` は他モジュールと共有しない arbitrary 定数(軽微)。

## Q3. `edo(12)` と `equalTemperament12()` は「同一の調律系」か？ ❌→⚠️(開示で解消)

**検証**: 音高は同一(両者 cents 表現、同値、同 period、同 source)。しかし **`id` が異なる**: `edo(12)` → `'12-edo'`、`equalTemperament12` → `'12-tet'`(`tuning.ts:67,93`)。
`scaleToCents` は `Scale.tuningId` と `tuning.id` の一致を要求し、不一致なら throw(`tuning.test.ts:63-67` で確認)。
→ `tuningId: '12-tet'` で書かれた `Scale` は `edo(12)` と**音高は同じなのに結合できず黙って壊れる**。潜在的 foot-gun。
**判定**: ⚠️ id を変えると別の破壊(プリセットとの不一致)が起きるため、コード変更より**開示が正解**。`edo()` の JSDoc に非互換を明記。

## Q4. `minimalVoiceLeading` のコスト関数は何を最小化しているか？ ✅

**検証**: cents(対数周波数)上の L1 コスト `Σ|x_i − y_σ(i)|` をソート整合で最小化(`voice-leading.ts:42-54`)。交換論法は1次元 L1 で厳密に最適。docstring は「総 cents 移動の最小化」と正直に書き、知覚的最適とは主張していない。レジスタ依存(低音の100centは高音より不協和)は知覚論だが、関数の契約はそれを約束していない。
**判定**: ✅ 健全。契約と実装が一致。

## Q5. `applyEnvelope` の型は合成系と整合するか(Float32 / Float64)？ ✅

**検証**: `envelope.ts` は `adsrEnvelope`/`applyEnvelope` とも `Float32Array`。`ks-synth.ts`/`modal-synth.ts` も `Float32Array`。型不一致なし。
**判定**: ✅ 健全。

## Q6. `kbmNoteToFreq`: referenceNote が unmapped('x')のとき何が起きるか？ ✅

**検証**: `kbm.ts:237-242` — 参照ノートが null にマップされたら RangeError を throw。仕様通り。範囲外(first/last 外)でも range check を飛ばして計算し、unmapped のみ検出する。
**判定**: ✅ 健全。

## Q7. `rankChords` の min-max 正規化: 全候補が同値のとき NaN にならないか？ ✅

**検証**: `chord-search.ts:160-161` — `rangeR === 0 ? 0 : (...)`。0/0 を回避し 0 を返す。2音スケール等で roughness が全等値でもソートは壊れない。
**判定**: ✅ 健全。

## Q8. 新モジュールは end-to-end パイプラインとして検証されているか？ ❌

**検証**: `src/integration.test.ts` の import(2-14行)はベースライン9モジュールのみ。temperament / edo / chord-search / voice-leading / envelope / fretless / mts / kbm / tun は**単体テストのみで、連結パイプラインのテストが存在しない**。「regularTemperament → rankChords → voiceLeading → envelope → WAV」のような実使用フローは一度も通っていない。
**判定**: ❌ ギャップ。
→ **改善**: 新モジュールを連結する統合テストを追加。

---

## 改善サマリ

| 問                     | 判定        | 対応                                                        |
| ---------------------- | ----------- | ----------------------------------------------------------- |
| Q1 協和の timbre 依存  | ⚠️ 隠蔽     | JSDoc で2軸の性質を開示 + timbre依存/非依存を証明するテスト |
| Q3 edo vs 12-tet の id | ⚠️ foot-gun | `edo()` JSDoc に非互換を明記                                |
| Q8 統合テスト欠落      | ❌ ギャップ | 新モジュール連結の統合テスト追加                            |
| Q2,4,5,6,7             | ✅ 健全     | 変更不要(検証で確認)                                        |

ソクラテス的態度: 5件は「健全」と確認できたこと自体が成果(無批判な追加実装への歯止め)。残3件は**前提を消さず可視化**することで解いた。

---

# 第三巡 (2026-06): 実装の境界条件と隠れた前提を問う

一巡目は哲学的整合性、二巡目は数値的正しさを問うた。三巡目は**境界条件での正確性**——宣言した契約が端点・極端値・合成パスでも成立するか——を問う。

## Q14. `decodeSmf` のランニングステータス: エンコーダ出力以外で動くか？ ⚠️(開示)

**問**: `decodeSmf` は「minimal decoder for golden round-trip」とあるが、外部MIDI入力に対しても正しく動くか。

**検証**:

- `running = status` はメタイベント(`0xFF`)処理後も更新され、次のランニングステータスイベントが `0xFF` を status として継承する。その結果「data byteを meta type として消費 → VLQ で velocity を length として読む」というストリーム崩壊が起きる。
- `else { p += 2 }` はProgram Change (`0xC0`, データ1バイト)・Channel Pressure (`0xD0`, データ1バイト)を2バイトスキップするため1バイトずれる。SysEx (`0xF0`, 可変長)は壊滅的にずれる。
- ただし `encodeSmf` は **常に status バイトを明示**し、上記イベントを一切生成しない。ゆえにラウンドトリップ契約は成立している。

**判定**: ⚠️ 宣言した契約は満たすが、「外部MIDI も読める」という暗黙の能力表示が誤解を生む。
→ **改善**: `decodeSmf` のJSDocに「`encodeSmf` の出力専用、汎用パーサではない」と明記。ランニングステータス・Program Change・SysExでの挙動不定を文書化。

## Q15. `approxRatio` の `maxDen` はハードリミットか？ ⚠️→❌ (実バグ: NaN伝播)

**問**: `approxRatio(x, tol, maxDen)` は「分母が maxDen 以下の最良近似」を返すのか。

**検証**: ループ条件は `q1 <= maxDen` だが、判定は `q1 = q2`(新収束子)代入**後**に行う。`q1 > maxDen` で脱出した際の return は `{p1, q1}` — 分母が `maxDen` を超えている。

これ自体は設計的に合理的(より精密な近似を返す)だが、**下流のLCM計算で爆発する**:

- `relativePeriodicity` が `fr.reduce((l, f) => lcm(l, f.den), 1)` で LCM を累積するとき、
  6音以上のコードで互いに素な大きな分母(例 π→33102、e→4753、√2→2378、log₂e、log₁₀e→1073、ln2→1007)が揃うと LCM が `Number.MAX_SAFE_INTEGER`(≈9×10¹⁵)を超える。
- 超過分は浮動小数点精度欠落で`Infinity` ではなく不正な整数になり、`reduce` の後段では `Infinity / Infinity = NaN` に帰着する。
- NaN の `periodicity` を持つ和音は `rankChords` の `periodicityNorm` 計算でスコアを `NaN` にし、`sort` が未定義挙動を示す。

**判定**: ❌ 実バグ。通常の音楽入力（12-TET、EDO）では発火しないが、`tol=0` または極めて非調和な周波数を直接渡すと NaN スコアを生む。
→ **修正**:

1. `lcm` に `l > MAX_SAFE_INTEGER ? Infinity : l` ガードを追加。
2. `relativePeriodicity` を reduce でなくステップ累積に書き換え、中間結果が `Infinity` なら即 `return Infinity`(これで `Infinity / Infinity` を回避)。
3. `rankChords` の正規化で `!Number.isFinite(c.periodicity)` なら `periodicityNorm = 1`(最悪値)にフォールバック。
4. 回帰テスト: `relativePeriodicity([π, e, √2, log₂e, log₁₀e, ln2], 0)` → NaN でないこと。`rankChords` 全スコアが finite であること。

## Q16. `chordPeriodicity` の `tol=0.0136` は粗いEDOで意味を失うか？ ✅

**問**: Stolzenburg の `tol≈0.0136` は12-TET校正。7-EDOや5-EDOなど粗いスケールでは、全音程が同一JI比にスナップして periodicity が区別不能にならないか。

**検証**: 7-EDO の「三度」 = 2^(2/7) ≈ 1.2294:

- 5/4 = 1.25 との相対誤差 = 0.0165 > `tol * 1.25 = 0.017` → スナップしない。
- 次収束子 11/9 ≈ 1.2222: 誤差 0.0072 < `tol * 1.2294 = 0.0167` → **スナップする**。

同様に 7-EDO の「五度」 = 2^(4/7) ≈ 1.486 → 3/2=1.5 との差 0.014 < `tol*1.5 = 0.0204` → 3/2 にスナップ。

結果: 7-EDO の三和音は `1:11/9:3/2` として評価され、`periodicity = LCM(9,2)/1 = 18`。12-TET は `1:5/4:3/2 → 15`。別値が返るので区別可能。モデルが「意味ある別値を返している」かは音楽的な判断だが、機械的には壊れていない。

**判定**: ✅ 健全。粗いEDOで "西洋的" でない比にスナップするのはStolzenburgモデルの仕様内動作。誤りではなく開示事項。

## Q17. `fingerFretlessChord` のnull契約: 到達不能弦が他の音と衝突する場合は？ ✅

**問**: `candidates.some(c => c.length === 0) return null` の早期脱出は正しいか。注入可能な割当が存在しても `null` を返す誤検出はないか。

**検証**:

- 「ある音がすべての弦で到達不能」→ 注入的割当は存在しない → `null` 正当 ✅
- 「各音は少なくとも1本の弦で到達可能だが、組合せが衝突する」→ 早期脱出せず `assignments` generator が全パターンを試みて空で終わる → `best === null` → `null` 正当 ✅
- タイブレークの `strings.join(',')` 辞書順比較: 弦数が10以上のとき `'1,10' < '2,3'` となり数値順と一致しない。ただし `fretlessOud`(6弦)・`violin`(4弦)はいずれも10弦未満なので安全。

**判定**: ✅ 健全。タイブレーク問題は10弦超の仮想楽器でのみ発生し、工場関数は範囲内。

---

## 第三巡サマリ

| 問                                   | 判定      | 対応                                                                                                  |
| ------------------------------------ | --------- | ----------------------------------------------------------------------------------------------------- |
| Q15 LCMオーバーフロー → NaN スコア   | ❌ 実バグ | `lcm` ガード + `relativePeriodicity` ステップ累積 + `rankChords` Infinity フォールバック + 回帰テスト |
| Q14 `decodeSmf` スコープ未開示       | ⚠️ 開示   | JSDocに「`encodeSmf` 出力専用」明記                                                                   |
| Q16 粗いEDOでの periodicity スナップ | ✅ 健全   | 記録のみ(モデル仕様内)                                                                                |
| Q17 fretless null 契約               | ✅ 健全   | 記録のみ(10弦超は工場関数の外)                                                                        |

第三巡の核心: LCMオーバーフローは「通常入力では発火しない」故にテストをすり抜けていた。NaN の伝播パスは `chordPeriodicity → rankChords → sort(undefined order)` と長く、どこかで止まっているように見えた。根本は「`lcm` の戻り値が `Infinity` でも `NaN` でもなく*誤った大整数*になる」浮動小数点の落とし穴。修正はガード追加と早期 return で3箇所、テストは境界値と property で確定した。

---

# 第四巡 (2026-06): 境界条件と契約の精緻さを問う

三巡の修正を経て残る「ほぼ正しいが前提が隠れている」ケースを問う。バグと呼べる水準は下がるが、**驚く場所がゼロか**を確かめることが四巡目の価値。

## Q18. `adsrEnvelope` の `gateS=0` 分岐に死んだ代入がある ❌(デッドコード → 修正)

**問**: リリース計算における `valueAtGate` の代入は全て生きているか。

**検証** (`envelope.ts:95-99` 旧コード):

```ts
if (gateS === 0) {
  valueAtGate = attackS === 0 ? 1 : 0; // ← 代入1
  // Actually with gateS=0 the gate never opens, so start from 0.
  valueAtGate = 0; // ← 代入2: 無条件上書き → 代入1は到達不能
}
```

コメントで「やっぱり 0 が正しい」と書き直した痕跡が残り、代入1は*永遠に読まれない*。正しい挙動(全ゼロ)は代入2が保証しているが、不正確な代入1は誤解を招く。

**判定**: ❌ デッドコード。正確性には影響しないが「コードとコメントが互いに矛盾した説明をする」状態。
→ **修正**: 死んだ代入と誤ったコメントを削除し `valueAtGate = 0;` のみに。回帰テスト: `gateS=0` が全ゼロを返すこと、`gateS=0 && attackS=0` でも全ゼロを返すこと。

## Q19. `parseKbm` は `firstNote > lastNote` を受理するか？ ⚠️→❌(実バグ → 修正)

**問**: 逆順の範囲 (`firstNote=100, lastNote=50`) を含む .kbm を `parseKbm` はどう扱うか。

**検証**: `parseKbm` は各フィールドを MIDI 範囲 [0, 127] でのみ検証し、`firstNote <= lastNote` は確認しない。この KBM を `kbmNoteToFreq` に渡すと:

- `midiNote < firstNote` → すべての MIDI ノートが firstNote=100 未満か lastNote=50 超 → **全ノートが `null` を返す**
- エラーなし、診断なし。「なぜ音が出ないか」が分からない。

**判定**: ❌ バリデーション欠如。KBM 仕様で firstNote ≤ lastNote は暗黙の前提。逆順は「有効な空範囲」でなく「不正な入力」として扱うべき。
→ **修正**: `parseKbm` に `firstNote > lastNote → throw RangeError` を追加。回帰テスト1件。

## Q20. `adsrEnvelope` のアタック峰は「最終アタックサンプル」に到達するか？ ⚠️(開示)

**問**: ドックストリングは「Attack: 0 → 1 over attackS seconds」と宣言する。最終アタックサンプル(index = `attackEnd - 1`)で本当に `1` になるか。

**検証**: アタック式 = `n / (attackS * sampleRate)`. 最終アタックサンプル `n = attackEnd - 1`:

```
env = (attackEnd - 1) / attackEnd = 1 - 1/attackEnd
```

`attackEnd = 0.1s × 1000Hz = 100` → `env[99] = 0.99`, not 1.0.

Peak の `1.0` は `n = attackEnd`(ディケイ初サンプル)でディケイ式 `1 - (1-sustainLevel) × 0 = 1` として初めて現れる。**アタックフェーズ自体は 1 に達しない。**

既存の `test_sample_100_near_one` は「end of attack」と誤ったコメントを付けているが、実際はディケイ初サンプルを測定している。

DSP ではよくある近似（別解 `(n+1)/attackEnd` は n=0 から非ゼロ; `n/(attackEnd-1)` は 1-sample attack で 0/0）ゆえ式変更はしない。

**判定**: ⚠️ 開示事項。式・挙動は変えず、ドックストリングに「アタックフェーズの最終サンプルは `(attackEnd-1)/attackEnd` ≈ 1; 正確に 1 に到達するのはディケイフェーズの初サンプル」と追記。回帰テスト: `env[attackEnd-1] ≈ 0.99`, `env[attackEnd] ≈ 1.0`。

## Q21. `minimalVoiceLeading` の上限エラーメッセージが「factorial guard」と言うが、O(n!) 計算はどこか？ ⚠️(開示)

**問**: `validateFreqs` の `length > 12` ガードに "factorial guard" と書かれている。実際に O(n!) 計算はあるか。

**検証**: `minimalVoiceLeading` は両配列をソートして一対一ペアリングするだけ = O(n log n)。階乗が出てくるのは `fingerFretlessChord` の `assignments` generator（全注入写像列挙 O(n!)）であり、`minimalVoiceLeading` とは無関係。"factorial guard" は誤ったコメント。

音楽的には 12 ボイス上限は妥当（12 音音楽で 12 パートは最大）だが、それはアルゴリズム上の制約ではない。

**判定**: ⚠️ コメント誤り。エラーメッセージを「practical musical limit; voice-leading uses O(n log n) sorting」に訂正。挙動は不変。

---

## 第四巡サマリ

| 問                                     | 判定                  | 対応                                                                |
| -------------------------------------- | --------------------- | ------------------------------------------------------------------- |
| Q18 adsrEnvelope gateS=0 デッドコード  | ❌ デッドコード       | 死んだ代入・誤コメント削除 + 回帰テスト                             |
| Q19 parseKbm firstNote>lastNote 未検証 | ❌ バリデーション欠如 | `firstNote > lastNote → throw` + 回帰テスト                         |
| Q20 アタック峰 off-by-1                | ⚠️ 開示               | JSDoc に「最終アタックサンプルは 1 - 1/attackEnd」明記 + 境界テスト |
| Q21 "factorial guard" ラベルの誤り     | ⚠️ 開示               | エラーメッセージ修正(挙動不変)                                      |

第四巡の核心: すべて「動く」。問われるのは「宣言した通りか」。Q18 は正しさへの錯覚(コメントが正しい挙動を説明しているように見えるが、それは上書きされた行)。Q19 は「何も起きないことで壊れる」バグ。Q20/Q21 は「ドックとコードが同じ事実の別の側面を述べているが読み手を惑わす」事例。問い続けることで、正しい動作が偶然ではなく意図に基づくことを確かめた。

---

# 第二巡 (2026-06): 数値アルゴリズムの正しさを問う

一巡目は新モジュールの「哲学への忠実さ」を問うた。二巡目は基盤の**数値的正しさそのもの**——特にバイナリ/テキスト出力が「自分が宣言した契約(=パーサが読める正しいファイル)」を本当に満たすか——を問う。

## Q9. `dissonancePair` は非負・対称・同一周波数で0、を本当に満たすか？ ✅

**検証**: `dissonance.ts:15-21`。`df=0` → 両指数項が1 → 差0 → 0。`A1=3.5 < A2=5.75` ゆえ `exp(-A1·s·df) > exp(-A2·s·df)` で差は常に正 → 非負。`fmin`/`df`/`lmin` はいずれも a,b 対称 → 対称。
**判定**: ✅ 健全。なお振幅重みに `min(amp)` を使う(Sethares 正典は積 `amp_a·amp_b`)、全体係数も正典の `C1=5` を省く——だが極小の**位置**は df 依存で決まり振幅重み・定数倍に不変なので、既知極小オラクル(harmonic→純正音程)は成立し、`rankChords`/`localMinima` の相対順位にも影響しない。モデル変種だが契約は満たす。

## Q10. MTS バルクダンプのチェックサムは仕様準拠か？ ✅

**検証**: `mts.ts:151-156` は bytes[1..405](`7E ^ devID ^ 08 ^ 01 ^ program ^ name16 ^ data384`)の XOR を `&0x7F`。これは MMA「Bulk Tuning Dump」のチェックサム定義(name を含む最も権威ある読み)と一致。
**判定**: ✅ 仕様準拠。ただし実機(Surge XT)検証は人的ゲートで未実施(adapters/CLAUDE.md 既載)。

## Q11. `freqToMtsKey` の上端クランプは予約値 `7F 7F 7F` を生まないか？ ⚠️(開示)

**検証**: 上端クランプ `{semitone:127, fraction14:16383}` → バイト `xx=7F, yy=7F, zz=7F`。MTS は `7F 7F 7F` を別文脈で「no change」センチネルとして予約。バルクダンプでも予約とみなすシンセがあり得る。発火は MIDI 127 超(≈12543Hz 超)の病的入力に限られる。
**判定**: ⚠️ 仕様の曖昧さ + 実機検証不能ゆえ**数値挙動は変えず** JSDoc で開示(MIDI 範囲内に収めるよう明記)。検証できない修正はしない。

## Q12. `writeTun` は計算に使った basefreq をファイルに書くか？ ❌ **バグ → 修正**

**検証**: `tun.ts` は cents を `basefreqHz`(指定値)基準で計算(93,103行)するのに、`basefreq=` ヘッダ行は**常にデフォルト定数**を出力していた(旧100行)。`writeTun(freqs, 'x', {basefreqHz: 440})` を呼ぶと:

- cents は 440Hz 基準(正しい)
- ファイルは `basefreq=8.175…`(デフォルト)と宣言
- 準拠パーサは cents を 8.175Hz 基準で解釈 → **全音高が log2(440/8.175)≈5.9 オクターブずれる**。ファイルが内部矛盾し解析不能。

既存テストは `note 69=0.00000`(cents)だけ検証し、`basefreq=` 行の整合性を見ていない**盲点**だった。
**判定**: ❌ 実バグ。
→ **修正**: 100行を `basefreqHz.toPrecision(20)` に。回帰テスト3件追加(ヘッダがデフォルトでなく指定値/round-trip で input 周波数を復元/別 basefreq 256Hz)。

## Q13. `parseScl` の入力検証は比と cents で対称か？ ⚠️(軽微・据置)

**検証**: 比は `num<=0 || den<=0` で throw(`0/1`,`-3/2` 不可)。一方 cents は `Number.isFinite` のみで**負 cents を受理**(`-700.0` 可)。adapters/CLAUDE.md は「負cents/ゼロ比は不正」と書くが、コードは負 cents を通す。
**判定**: ⚠️ 非対称だが、下降スケール等の正当な用途を壊しうるため**挙動変更せず**記録に留める。

---

## 第二巡サマリ

| 問                              | 判定                       | 対応                                       |
| ------------------------------- | -------------------------- | ------------------------------------------ |
| Q12 .tun の basefreq 未記載     | ❌ 実バグ(6オクターブずれ) | ヘッダを実 basefreq に修正 + 回帰テスト3件 |
| Q11 MTS 上端の予約値 7F7F7F     | ⚠️ 仕様曖昧                | JSDoc 開示(挙動は不変)                     |
| Q9 Sethares 振幅重み(min vs 積) | ✅ 契約満たす              | 記録のみ                                   |
| Q10 MTS チェックサム            | ✅ 仕様準拠                | 記録のみ(実機は人的ゲート)                 |
| Q13 scl 検証の非対称            | ⚠️ 軽微                    | 据置(正当用途を壊さない)                   |

第二巡の核心: 「出力が正しいか」は「出力が自分の宣言した契約を満たすか」で問う。.tun は「パーサが読める valid file」を約束しながら、custom basefreq でそれを破っていた。テストの盲点(値は見たが**整合性**は見ていない)が見逃しの温床だった。

---

# 第五巡 (2026-06): 「到達不能コード」を問う

四巡まで「実行時に何が起きるか」を問うてきた。五巡目は**数学的に到達不能なコードパス**と**エクスポートされたが検証されていないAPIの存在**を問う。

## Q22. `adsrEnvelope` の `releaseS === 0` 分岐は本当に実行されるか？ ❌ **デッドコード → 削除**

**問**: `envelope.ts` の else ブランチ(ゲートクローズ後)に `if (releaseS === 0) { env = 0; }` が存在した。この行が実行される入力は存在するか。

**検証**: `totalSamples = Math.ceil((gateS + releaseS) * sampleRate)`。`releaseS = 0` のとき、`totalSamples = ceil(gateS * SR) = ceil(gateEnd)` (ただし `gateEnd = gateS * SR`)。ループ `for (let n = 0; n < totalSamples; n++)` において:

- `gateEnd` が整数の場合: `totalSamples = gateEnd`。ループは `n < gateEnd` を満たす n のみ → ゲート常に開。
- `gateEnd` が非整数の場合: `totalSamples = floor(gateEnd) + 1`。最大の n は `floor(gateEnd) < gateEnd` → ゲート常に開。

すべての n において `n < gateEnd` が成立 → `else` ブランチ(ゲートクローズ)には**到達しない**。QED。

「インスタントカット」の実装は `releaseS=0` 時のサンプル数削減で表現されており、コード分岐は不要だった。これは意図ではなく見逃し（`if...else` の構造を維持したままデッドブランチが残った）。

**判定**: ❌ デッドコード(数学的証明)。「シナリオが存在しない場合の防御的コードは書かない」哲学と矛盾。
→ **対応**: `if (releaseS === 0) { env = 0; }` 削除。`else` ブランチのコメントに不変条件を明記: 「`releaseS > 0` guaranteed here: when `releaseS = 0`, `totalSamples = ceil(gateEnd)` and all `n < totalSamples` satisfy `n < gateEnd`」。JSDoc の `releaseS = 0` 説明も「no release samples are allocated; the `totalSamples` formula ensures no loop iteration reaches the release phase」に更新。

## Q23. `stretchedSpectrum` はエクスポートされているが、一度も呼ばれていないのでは？ ❌ **未テスト → テスト追加**

**問**: `spectrum.ts` は `harmonicSpectrum`, `stretchedSpectrum`, `bellSpectrum`, `realizeSpectrum` を公開する。カバレッジは `78.26%`、関数カバレッジは `75%` (3/4)。どれが漏れているか。

**検証**: `grep -r "stretchedSpectrum"` → `spectrum.ts` 定義のみ。テストも、`chord-search`(例示コメント)も呼び出さない。コメントは「Piano-like stretched spectrum (Railsback-style inharmonicity coefficient B)」と述べるが、ライブラリが宣言する「エクスポートした API はテストで検証」を実践できていない。

`bellSpectrum` は `chord-search.ts` の JSDoc コメントに言及されるが、同様にテストから呼ばれていない(bell 音色でランキングを変えると主張するが証明なし)。

**判定**: ❌ エクスポート済み API が未検証。「spectrumHelpers」describe ブロックを generate.test.ts に追加: `stretchedSpectrum` の長さ・第一倍音≈1・第六倍音 > 6(非調和性の確認)、`bellSpectrum` の長さ・第一比≈1。

## Q24. `generatedScale` の `periodCents <= 0` エラーパスは、テストで実際に実行されるか？ ❌ **カバレッジ欠落 → テスト追加**

**問**: `generate.ts:14-16` は `count < 1 || periodCents <= 0` で throw する。既存テストは `maximallyEven(5,7)` → RangeError のみ。`generatedScale` のエラー系は？

**検証**: `generate.test.ts` を検索 → `generatedScale` を呼ぶエラーテストは存在しない。`periodCents = 0` を渡した場合 `wrap(x, 0) = ((x%0)+0)%0 = NaN` が伝搬するはずだが、throw 前にガードされているので実際には throw。このパスは未確認。

**判定**: ❌ エラーパス未実行。`test_zero_period_throws` / `test_negative_period_throws` を追加。

## Q25. `edo` の `periodCents <= 0` チェックはテストされているか？ ❌ **カバレッジ欠落 → テスト追加**

**問**: `tuning.ts:93-95` の `edo` 関数は `periodCents <= 0` を RangeError で弾く。現在の `tuning.ts` カバレッジ `97.01%`、行 94-95 未到達。

**検証**: `edo` は Q4 で追加されたが、そのテストは有効値のみ検証（12-EDO が equalTemperament12 と一致するかなど）。`edo(12, 440, 0)` はテストされていない。

**判定**: ❌ エラーパス未確認。`test_non_positive_period_throws` / `test_negative_period_throws` を追加。

---

## 第五巡サマリ

| 問                                               | 判定                   | 対応                                                                     |
| ------------------------------------------------ | ---------------------- | ------------------------------------------------------------------------ |
| Q22 `releaseS=0` の `env=0` 分岐が到達不能      | ❌ デッドコード(数学証明) | 分岐削除 + `totalSamples` 不変条件コメント + JSDoc 更新                  |
| Q23 `stretchedSpectrum` / `bellSpectrum` 未テスト | ❌ エクスポート未検証  | `spectrum helpers` テスト 4 件追加                                       |
| Q24 `generatedScale periodCents<=0` 未確認      | ❌ エラーパス未実行    | `test_zero_period_throws` + `test_negative_period_throws` 追加           |
| Q25 `edo periodCents<=0` 未確認                  | ❌ エラーパス未実行    | `test_non_positive_period_throws` + `test_negative_period_throws` 追加   |

第五巡の核心: 「到達不能」は2種類ある。(1) 数学的証明で到達不能(Q22 — totalSamples 不変条件)と(2) テスト設計の見落としで未到達(Q23-25)。前者は「書かれたコードが誤った前提に立つ」証拠であり削除すべき。後者は「テストが API の表面積を覆えていない」証拠であり補完すべき。いずれも「コードが動く」ことで隠れる欠陥であり、カバレッジを「哲学への忠実度計」として使うことで発見できる。

---

## 第六巡: 残余ギャップの解消と到達不能コードの地図作成

**目標**: ブランチカバレッジを最大化しつつ、「到達不能と証明できるブランチ」を文書化する。

## Q26. `tuning-data.ts` line 72 の `withRoot` 分岐は網羅されているか？ ❌ **カバレッジ欠落 → テスト追加**

**問**: `loadTuningPreset` の `withRoot` 計算(line 69-72)は「最初の degree が 0 でない場合 `cents(0)` を先頭に挿入」する。既存テストの `base` フィクスチャは `degrees: [0, 700]` — 常に 0 始まりのため line 72 の false ブランチ未到達。

**検証**: tuning-data.test.ts 全体検索 → `degrees: [200, ...]` 形式のテストが存在しない。`centsVals[0] < 1e-6` 条件は常に true。line 72 未到達。

**判定**: ❌ `test_non_zero_first_degree_prepends_root` 追加(`degrees: [200, 700]` → `withRoot` が `[cents(0), cents(200), cents(700)]` を構築)。

## Q27. `parseDegree` の文字列パスは完全にカバーされているか？ ❌ **カバレッジ欠落 → テスト追加**

**問**: `parseDegree(spec: DegreeSpec)` の文字列パスは 2 分岐ある。(1) `RATIO_RE.test(spec) === false` → RangeError (line 42)、(2) `spec.includes('/') === false` → `[spec, '1']` で整数比 (line 43)。ALL_PRESETS が使うスペックは数値か `'n/d'` 形式のみ → 両分岐が未到達。

**検証**: `RATIO_RE = /^\d+(\/\d+)?$/` → `'abc'` は不一致 → throw。`'2'` はスラッシュなし → `[n, d] = ['2', '1']` → `ratio(2, 1)` → 1200c。

**判定**: ❌ 2 件追加: `test_invalid_string_degree_throws`（line 42 true ブランチ）/ `test_integer_ratio_no_slash_is_valid`（line 43 false ブランチ、`periodCents=1500` で `'2'`=1200c が範囲内）。

## Q28. `fingering.ts` の 2 つのブランチ欠落は埋められるか？ ❌ **カバレッジ欠落 → テスト追加**

**問**: (A) `frettedSpan()` line 29: `frets.length === 0 ? 0 : ...` の true ブランチ（全オープン弦コード）は未到達。(B) sort 比較子 line 80-81: `x.cost - y.cost || Math.max(...)` の `||` 右辺（コスト同値時のタイブレーク）は未到達。

**検証**:
- (A) `[0c, 500c]` コード: 0c は string0 fret0 のみ、500c は string0 fret5 または string1 fret0。string0 競合で唯一有効な代入は `(s=0,f=0)+(s=1,f=0)` — 全フレット=0 → `frets = []` → `frettedSpan = 0`。
- (B) `[900c, 1400c]` with `highPositionWeight=0`: `(s=1,f=4)+(s=2,f=4)` cost=0 max=4 と `(s=0,f=9)+(s=1,f=9)` cost=0 max=9 の 2 解 → コスト同値 → `||` 右辺評価 → max フレット小さい方が先。

**判定**: ❌ 2 件追加: `test_all_open_strings_zero_fretted_span` + `test_equal_cost_tie_break_by_max_fret`。

## Q29. `chord-search.ts` の 4 ヶ所は到達不能と証明できるか？ ✅ **数学的証明 → 合法的デッドコード**

**問**: lines 77-79（`k=0` の `combinations` 分岐）、lines 159-160（`candidates.length === 0`）、line 190（Infinity periodicity の正規化）、line 211（同一スコア・同一次数配列のタイブレーク）が残る。これらは到達不能か？

**証明**:
- **77-79**: `combinations(nonRootDegrees, size - 1)` 呼び出し元で `size >= 2`（line 109 で `size < 2` が throw）→ `k = size - 1 >= 1` → `k === 0` は不変条件違反。到達不能。
- **159-160**: `size > n` は line 112-114 で throw。`size <= n` かつ `k = size - 1 >= 1` → `combinations(n-1 elements, k)` は `k <= n-1` が保証され少なくとも 1 組合せ存在 → `candidates.length >= 1`。到達不能。
- **190**: `chordPeriodicity` が Infinity を返すには `relativePeriodicity` の LCM が MAX_SAFE_INTEGER を超える必要がある。`tol=0.0136` の下で `approxRatio` は nearly すべての音楽的比率を小さな分数にスナップするため、実用的な EDO コードでは LCM が 1e9 程度に留まり MAX_SAFE_INTEGER(≈9e15) を超えない。防衛的ガード（理論的正しさのため）だが、現在の API 入力空間では到達不能に等しい。
- **211**: `combinations` は重複なし → 2 つの異なるコードは degree 配列が異なる → スコア同値でも `a.degrees[i] !== b.degrees[i]` で早期 return → line 211 到達不能。

**判定**: ✅ すべて正当なデッドコード。削除は不適切（防衛コードとして意図的）。コメントで文書化。

## Q30. `fretless.ts` / `kbm.ts` の `noUncheckedIndexedAccess` ガードは削除すべきか？ ✅ **TS型システムアーティファクト → 現状維持**

**問**: `fretless.ts` line 122 `if (current === undefined) return;` および `kbm.ts` lines 195-198, 228-231 の null チェックは、`noUncheckedIndexedAccess` による自動挿入的な防衛コード。到達不能なら削除すべきか？

**分析**: これらは「TypeScript コンパイラが配列インデックスの undefined 可能性を認識する」ための明示的ガードである。削除すると型エラーが発生し、コンパイルが通らない。また、コードの安全性契約（fail-fast の哲学）と整合する。カバレッジツールが「到達不能」と報告しても、型安全のためのコストとして許容するのが正しい。

**判定**: ✅ 現状維持。削除すると型チェックが壊れる。98.86% / 97.55% が本プロジェクトの実用的上限。

---

## 第六巡サマリ

| 問                                                  | 判定                     | 対応                                                                       |
| --------------------------------------------------- | ------------------------ | -------------------------------------------------------------------------- |
| Q26 `withRoot` false ブランチ未到達                 | ❌ カバレッジ欠落        | `test_non_zero_first_degree_prepends_root` 追加                            |
| Q27 `parseDegree` 文字列パス 2 分岐未到達           | ❌ カバレッジ欠落        | 無効文字列 throw + 整数比ノースラッシュのテスト追加                        |
| Q28 `fingering.ts` 全オープン弦 + タイブレーク      | ❌ カバレッジ欠落        | 2 テスト追加（frettedSpan 0 + || タイブレーク）                            |
| Q29 `chord-search.ts` 4 箇所                        | ✅ 数学的証明で到達不能  | 現状維持（防衛コード / `noUncheckedIndexedAccess` アーティファクト）       |
| Q30 `fretless.ts` / `kbm.ts` noUnchecked ガード    | ✅ TS型システムアーティファクト | 現状維持                                                               |

**到達した境地**: カバレッジ向上には「テスト補完で埋められるギャップ」と「型システムや数学的不変条件に由来する正当なデッドコード」の二種類がある。前者は無限にある。後者は証明して文書化し、受け入れる。98.86% 文/行、97.55% ブランチ、100% 関数が本プロジェクトの実用的カバレッジ上限である。

381 テスト / 全パス。

---

## 第七巡: 抽象境界の破れ — generate.ts の出力は残りのパイプラインと接続されているか

**目標**: 「idiom-independent scale generation is first-class」という哲学の実装への忠実度を問う。

## Q31. `generatedScale` / `maximallyEven` の出力は、残りのライブラリから直接利用できるか？ ❌ **抽象境界の破れ → ブリッジ関数を追加**

**問**: ライブラリは「MOS(生成音階)・最大均等(Clough-Douthett)。三度堆積を前提しない」を設計原則とする。しかし `generatedScale(700, 1200, 7)` は `number[]`、`maximallyEven(12, 7)` は `number[]`(インデックス)を返す。`rankChords` / `mtsBulkDump` / `fingerChord` などはすべて `TuningSystem` を要求する。つまりこれらを使おうとすると毎回 3 手順の変換が必要になる。

**現状のコスト例(ダイアトニックスケールを和音ランキングに渡す)**:
```ts
const scaleCents = generatedScale(700, 1200, 7);        // step 1
const degrees = scaleCents.map(c => ({ kind:'cents', cents: c }));  // step 2
const t = defineTuning({ id:'…', name:'…', referenceHz:440, periodCents:1200, degrees, source:'theoretical' });  // step 3
const chords = rankChords(t);                           // step 4
```

**判定**: ❌ 設計原則「生成はイディオム非依存・一級市民」に反する。手順 1-3 を一発で済ませる `generatedTuning` と `maximallyEvenTuning` が必要。

**実装**: `src/core/generate.ts` に追加:
- `generatedTuning(generatorCents, periodCents, count, referenceHz=440, id?)` → `TuningSystem`
  - `generatedScale` を内部で呼び、`Pitch[]` に変換し `defineTuning` を経由。
  - デフォルト id = `mos-${count}`。
- `maximallyEvenTuning(c, d, periodCents=1200, referenceHz=440)` → `TuningSystem`
  - `maximallyEven(c, d)` のインデックスを `i * (periodCents / c)` cents に変換し `defineTuning` を経由。
  - id = `me-${d}-of-${c}`。
  - `periodCents <= 0` は fail-fast RangeError。

**検証**: `test_compatible_with_rankChords` により `generatedTuning(700,1200,7)` → `rankChords` のパイプラインが 1 コールで動作することを確認。

**使用例(改善後)**:
```ts
const chords = rankChords(generatedTuning(700, 1200, 7));
// Clough-Douthett diatonic in 12-TET → TuningSystem → chord ranking, 2行。
const diatonic = maximallyEvenTuning(12, 7);
```

**テスト**: 15 件追加（`generatedTuning` 8 件 + `maximallyEvenTuning` 7 件）。406 テスト / 全パス。

---

## 第七巡サマリ

| 問                                       | 判定                     | 対応                                                        |
| ---------------------------------------- | ------------------------ | ----------------------------------------------------------- |
| Q31 `generatedScale`→`TuningSystem` ブリッジ欠落 | ❌ 抽象境界の破れ | `generatedTuning` + `maximallyEvenTuning` 追加              |

**到達した境地**: 「一級市民(first-class)」とは型システムで自然につながることを意味する。`number[]` を返す生成関数と `TuningSystem` を要求するランキング/エクスポート関数の間に手動変換が必要なとき、その型は一級市民ではない。哲学を実装に持ち込むとは、「生成スケールから和音ランキングまで手続きの中断なしに書ける」ことである。

406 テスト / 全パス。generate.ts 100%カバレッジ。

---

## 第八巡: 「一級市民」の Scale 層は、実は frequency 世界へ接続していない

**目標**: docs が「melodic/modal は一級市民」と主張する `Scale` 層が、ライブラリの他層と接続しているかを問う。

## Q32. `Scale`(旋法/jins/raga)は周波数を生成できるか？ ❌ **行き止まりの葉ノード → `scaleToFreqs` を追加**

**問**: `scale.ts` のコメントは「Microtonal cultures are primarily melodic/modal (improvement #3), so this is a first-class layer」と述べる。微分音音楽の*主要*ユースケースが旋律/旋法である、と。ところが `Scale` から得られるのは `scaleToCents` だけ。ライブラリの他層 — `chordDissonance(freqs)` / `pluck(hz)` / `strike(hz)` / MTS・`.tun` エクスポート — はすべて**周波数(Hz)**を話す。`Scale` を実際に鳴らす・採点する・エクスポートするには、ユーザが手動で cents → freq 変換を書く必要がある。

**さらに**: `scale.ts` には専用テストファイルが存在しない(`scaleToCents` は `tuning.test.ts` で間接的にテストされるのみ)。一級市民を名乗る層に専用テストがない。

**検証**: `grep -rn "scaleToFreqs"` → ヒットなし。`degreeToFreq`(tuning.ts)は存在するのに、`Scale` 用のラッパが欠落。`Scale` は cents に変換して**止まる**葉ノードだった。

**判定**: ❌ 「一級市民」の主張に実装が追いついていない。`scaleToFreqs(scale, tuning)` を追加し、旋法層を周波数世界へ接続する。

**実装**: `src/core/scale.ts`:
- 共有ガード `assertTuningMatch(scale, tuning)` を抽出(`scaleToCents` と `scaleToFreqs` で DRY)。
- `scaleToFreqs(scale, tuning): number[]` = `degreeIndices.map(d => degreeToFreq(tuning, d))`。周期ラップ・非オクターブ周期は `degreeToFreq` の定義通り。
- 新規 `src/core/scale.test.ts`(9 件): major mode cents / octave-spanning wrap / 周波数=referenceHz / degreeToFreq との一致 / 非オクターブ(Bohlen-Pierce 13-EDO・周期3/1)/ id不一致 throw(両関数)。

**使用例(改善後)**:
```ts
const t = generatedTuning(700, 1200, 7, 261.63, '12-tet');
const scale = { id:'pent', name:'penta', tuningId:'12-tet', degreeIndices:[0,1,2,3,4] };
const freqs = scaleToFreqs(scale, t);                  // 旋法 → Hz
const roughness = chordDissonance(freqs, harmonicSpectrum());  // そのまま採点
```

---

## 第八巡サマリ

| 問                                          | 判定                       | 対応                                            |
| ------------------------------------------- | -------------------------- | ----------------------------------------------- |
| Q32 `Scale` が周波数世界へ接続していない    | ❌ 行き止まりの葉ノード     | `scaleToFreqs` 追加 + 専用 `scale.test.ts` 新設 |

**到達した境地**: Q31(generate)と Q32(scale)は同じ病の二つの症状である — 「一級市民」を名乗る層が、型の上では他層とつながっていない。ライブラリの中核思想(「微分音は旋律/旋法が主」)を本当に一級市民にするとは、`Scale` から音(周波数)・採点(不協和度)・エクスポート(MTS/.scl)へ**手続きの中断なく**到達できることである。docstring の主張は、対応する変換関数があって初めて真になる。

415 テスト / 全パス。

---

## 第九巡: ランキング層は voice-leading 層と接続されているか

**目標**: `rankChords` が返す `RankedChord` が、ライブラリの他の計算層(voice-leading / 合成 / 協和採点)と型の上で直接つながっているかを問う。

## Q33. `RankedChord` から `voiceLeadingCost` へは何ステップ必要か？ ❌ **行き止まり → `realizeRankedChordFreqs` を追加**

**問**: `rankChords` は「最も協和度の高い和音」を見つける。DTM のユースケースではその次に「見つかった和音間の最も滑らかな進行を選ぶ」が来る。`voiceLeadingCost(fromFreqs, toFreqs)` がその計算をする。では `RankedChord` から `voiceLeadingCost` へは直接届くか？

**検証**: `RankedChord` が持つのは `cents: readonly number[]`(ルート相対セント)と `roughness` / `score` などの数値。`voiceLeadingCost` は `readonly number[]` (Hz)を要求する。変換するには:
```ts
const chord = rankedChords[0]!;
const freqs = chord.cents.map(c => rootHz * 2 ** (c / 1200));  // 手動
voiceLeadingCost(freqs, ...);
```
`2 ** (c / 1200)` は `centsToFreqFactor` と等価だが型的な接続がなく、毎回書き直しになる。`realizeChordFreqs(chord: Chord, rootHz)` は存在するが、`RankedChord` は `Chord` 型ではないため使えない。

**さらに**: `RankedChord.roughness` は内部で特定 `rootHz` と `spectrum` で計算されているが、それと同じ周波数を取り出す方法がない — `roughness` を `chordDissonance` で検証しようとすると手動変換が必要で、内部整合性の確認さえ難しい。

**判定**: ❌ ランキング層の出力が frequency 世界への行き止まりになっている。Q31(generate→TuningSystem)・Q32(Scale→freqs)と同じ病理の第三例。

**実装**: `src/core/chord-search.ts` に追加:
```ts
export function realizeRankedChordFreqs(chord: RankedChord, rootHz: number): number[] {
  return chord.cents.map((c) => rootHz * centsToFreqFactor(c));
}
```
`cents[0]` は常に 0(ルート) → `rootHz * 1 = rootHz`。

**使用例(改善後)**:
```ts
const chords = rankChords(tuning, { size: 3 });
const freqsA = realizeRankedChordFreqs(chords[0]!, 261.63);
const freqsB = realizeRankedChordFreqs(chords[1]!, 261.63);
const smoothness = voiceLeadingCost(freqsA, freqsB);  // 1コール
```

**テスト(6件)**:
- ルート周波数 = `rootHz`(cents[0]=0 → factor 1.0)
- 400c 音程 → `rootHz * 2^(400/1200)` の精度確認
- 異なる `rootHz` でもボイス間の比率が保存される(スケール不変性)
- `roughness` と `chordDissonance(realizeRankedChordFreqs(...), spectrum)` が一致(内部整合性)
- Integration: `rankChords → realizeRankedChordFreqs → voiceLeadingCost` end-to-end パイプライン
- fast-check プロパティ: 任意 EDO・任意 rootHz で全周波数が有限正値

---

## 第九巡サマリ

| 問                                                              | 判定                     | 対応                                                                      |
| --------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------- |
| Q33 `RankedChord` → `voiceLeadingCost` に手動変換が必要        | ❌ 行き止まりの葉ノード   | `realizeRankedChordFreqs(chord, rootHz)` 追加 + 6 テスト                  |

**到達した境地**: Q31(generate)・Q32(scale)・Q33(ranking)は同じパターンの三例 — 計算を生産する層が、それを消費する次の層と型の上でつながっていない。「一級市民」の連鎖が完成するとは、`generatedTuning → rankChords → realizeRankedChordFreqs → voiceLeadingCost` が**すべて直接呼び出せる**ことである。ライブラリの設計原則「zero runtime-dep / 単一真実源」は実装に追いついたが、「レイヤ間の型的連続性」はQ31-33で補完されて初めて実現した。

421 テスト / 全パス。

---

## 第十巡: `Chord` 型は運指エンジンと接続されているか

**目標**: `Chord`(ルート相対音程)が `fingerChord`(絶対セント)と直接つながっているかを問う。

## Q34. `Chord → fingerChord` へは直接届くか？ ❌ **行き止まり → `chordToCentOffsets` を追加**

**問**: `fingerChord(inst, chordCentsAbs)` は「楽器座標系での絶対セント」を要求する。`guitarStandard()` は最低弦開放 = 0c として他弦・フレットを相対表現する。一方 `chordToCents(chord)` は「ルート相対セント」([0, 400, 700])を返す。間を埋める関数はあるか？

**検証**: `chord.ts`・`fingering.ts`・`instrument.ts` に橋渡し関数は存在しない。`realizeChordFreqs(chord, rootHz)` は Hz を返すが、Hz → 楽器セントには別途 `freqToCents(hz, lowestStringHz)` が必要。しかも `StringInstrument` には `referenceHz` フィールドがない — 楽器は移調可能な抽象モデルであり、Hz 基準を持たない設計。

**ユーザが今日必要な手順**:
1. `realizeChordFreqs(chord, rootHz)` → Hz 配列
2. 最低弦の Hz を別途把握
3. `freqToCents(hz, lowestStringHz)` で楽器セントへ変換
4. `fingerChord(inst, abscentsList)` を呼ぶ

**なぜ設計選択か**: `StringInstrument` は「同じ運指パターンが異なるキーに移調できる」モデルのため Hz アンカーを持たない。これは正しい。しかしその代償として、ルート位置を「楽器セント」で指定する薄いラッパが必要になる。

**判定**: ❌ `Chord → fingerChord` の橋渡し欠落。最小修正: `chordToCentOffsets(chord, rootCentsOnInstrument)` — ルート相対セントに定数を加算するだけ。

**実装**: `src/core/chord.ts` に追加:
```ts
export function chordToCentOffsets(chord: Chord, rootCentsOnInstrument: number): number[] {
  return chordToCents(chord).map((c) => c + rootCentsOnInstrument);
}
```

**使用例(改善後)**:
```ts
const guitar = guitarStandard();
const major = chordFromSemitones('major', [0, 4, 7]);
// ギター 5 弦開放 A2 = openStringsCents[1] = 500c
const fingerings = fingerChord(guitar, chordToCentOffsets(major, 500));
```

**テスト(10件)**: 専用 `src/core/chord.test.ts` を新設。`chordFromSemitones` の cents 値・`realizeChordFreqs` の rootHz 一致・`chordToCentOffsets` の ゼロオフセット≡chordToCents / rootが正確にrootCentsOnInstrument / 音程保存 / minor7th / integration fingerChord / 任意Chord。

---

## 第十巡サマリ

| 問                                                   | 判定                    | 対応                                                           |
| ---------------------------------------------------- | ----------------------- | -------------------------------------------------------------- |
| Q34 `Chord` → `fingerChord` の橋渡し欠落            | ❌ 行き止まりの葉ノード  | `chordToCentOffsets(chord, rootCentsOnInstrument)` 追加 + 10テスト / 専用 `chord.test.ts` 新設 |

**到達した境地**: Q31(generate)・Q32(scale)・Q33(ranking)・Q34(chord→fingering)は同一パターンの四例。「変換を生産する層」と「それを消費する層」の間に常に手動変換が必要だった。今回の修正で `Chord → chordToCentOffsets → fingerChord` がワンライナーになる。`StringInstrument` の「Hz なし移調可能モデル」は設計上正しい — ただしその抽象の境界に橋渡し関数が必要だった。これは音楽ライブラリ特有の「座標系が複数ある」問題(Hz / セント / 楽器セント / MIDI ノート番号)の具体例である。

431 テスト / 全パス。

---

## 第十一巡: DTM 出力は「進行」を一級市民として扱えるか

**目標**: 「DTM へ出力する」を掲げるライブラリが、単独和音の採点を超えて**和音進行**をスコアリングできるかを問う。

## Q35. `voiceLeadingCost` は2和音間のコストを返す。3和音以上の進行のコストは計算できるか？ ❌ **集計関数なし → `progressionSmoothness` を追加**

**問**: ユーザが「Imaj7→IIm7→V7→Imaj7」のような4和音進行を評価したい場合、今日できることは何か？

**検証**: `voiceLeadingCost(fromFreqs, toFreqs)` は**ペア**に対してのみ動く。進行を評価するには:
```ts
const chords = rankChords(tuning, { limit: 4 });
const ab = voiceLeadingCost(realizeRankedChordFreqs(chords[0]!, r), realizeRankedChordFreqs(chords[1]!, r));
const bc = voiceLeadingCost(realizeRankedChordFreqs(chords[1]!, r), realizeRankedChordFreqs(chords[2]!, r));
const cd = voiceLeadingCost(realizeRankedChordFreqs(chords[2]!, r), realizeRankedChordFreqs(chords[3]!, r));
const total = ab + bc + cd;  // 6行手動
```

`progressionSmoothness` は存在しないため、毎コードペアを手動でループする必要がある。これは「DTM 出力」を掲げるライブラリが最も基本的な「進行評価」を直接サポートしていないことを意味する。

**判定**: ❌ 進行全体のスムーズネス計算が1コールで行えない。Q31-Q34 と同じ「集計すべき関数がない」パターン。

**実装**: `src/core/chord-search.ts` に追加:
```ts
export function progressionSmoothness(
  chords: readonly RankedChord[],
  rootHz: number,
): number {
  if (chords.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < chords.length; i++) {
    total += voiceLeadingCost(
      realizeRankedChordFreqs(chords[i - 1]!, rootHz),
      realizeRankedChordFreqs(chords[i]!, rootHz),
    );
  }
  return total;
}
```

**使用例(改善後)**:
```ts
const chords = rankChords(tuning, { size: 3, limit: 4 });
const cost = progressionSmoothness(chords, 261.63);  // 1コール
```

**テスト(7件)**:
- 空配列 → 0
- 単一和音 → 0
- 2和音 → `voiceLeadingCost` の結果と一致
- 3和音 → A→B + B→C の和(中間経路を含む)
- 結果は非負
- 途中に遠い和音を挿入するとコスト増加(単調性の例示)
- 異なるサイズの和音を混在させると `voiceLeadingCost` がスローする

---

## 第十一巡サマリ

| 問                                                            | 判定                     | 対応                                                                    |
| ------------------------------------------------------------- | ------------------------ | ----------------------------------------------------------------------- |
| Q35 和音進行のスムーズネスを1コールで計算できない             | ❌ 集計関数なし           | `progressionSmoothness(chords, rootHz)` 追加 + 7 テスト                |

**到達した境地**: Q31-Q35 は「生産と消費の接続」の系譜を完成させた。`generatedTuning`(Q31)が TuningSystem を生産し、`rankChords` が候補を生産し、`realizeRankedChordFreqs`(Q33)が Hz を生産し、`progressionSmoothness`(Q35)が進行全体のコストを生産する。これで「微分音スケールを生成して最も協和する4和音進行を探す」ワークフローが**すべて1コールの連鎖**で表現できる。

438 テスト / 全パス。

---

## 第十二巡: データ層の発見可能性 — ユーザはどうやってプリセットに辿り着くか

**目標**: `src/data` が宣言する「出典付き調律プリセット」が、ソースを読まずにアクセス可能かを問う。

## Q36. `loadTuningPreset` は `TuningPreset` オブジェクトを要求する。IDで引けるか？ ❌ **発見不能 → `getTuningById` を追加**

**問**: ユーザが「Makam Uşşak の調律が欲しい」と思ったとき、何をすべきか。

**検証**: `loadTuningPreset(preset: TuningPreset)` はプリセットオブジェクトを直接受け取る。利用するには:
```ts
import { MAKAM_USSAK } from 'ruri/data';  // ← 名前定数を知っている必要がある
const t = loadTuningPreset(MAKAM_USSAK); // ← 2ステップ
```
`ALL_PRESETS` は配列として公開されているが、ID で引く関数がない。ID(`'makam-ussak-example'`)はソースを読まないと分からない。

さらに: `getTuningById('makam-ussak-example')` のような **1コール・文字列ベースのルックアップ** がなければ、IDのオートコンプリートも使えず、ユーザは実装の詳細を知る必要がある。

**判定**: ❌ データ層の発見可能性が低い。ユーザが `getTuningById('makam-ussak-example')` で直接 `TuningSystem` を取得できる関数が必要。

**実装**: `src/data/presets.ts` に追加(`ALL_PRESETS` と同じファイルで、循環参照を回避):
```ts
export function getTuningById(
  id: string,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): TuningSystem | undefined {
  const preset = presets.find(p => p.id === id);
  return preset !== undefined ? loadTuningPreset(preset) : undefined;
}
```

**テスト(6件)**:
- `'12-tet'` → 12度の `TuningSystem`
- `'makam-ussak-example'` → 中立二度 181c 確認
- `'slendro-example'` → stretched pseudo-octave > 1200c
- `'does-not-exist'` → `undefined`
- ALL_PRESETS の全 ID が getTuningById で解決される
- カスタムプリセットプール指定: 別のリストを渡すと別の結果

---

## 第十二巡サマリ

| 問                                                  | 判定                       | 対応                                                    |
| --------------------------------------------------- | -------------------------- | ------------------------------------------------------- |
| Q36 データ層へのID引きルックアップが存在しない      | ❌ 発見可能性の欠如         | `getTuningById(id, presets?)` 追加 + 6テスト            |

**到達した境地**: API の発見可能性(discoverability)はドキュメントの問題ではなく、設計の問題である。`loadTuningPreset` は「オブジェクトを知っている人」向けの低レベルAPIだった。`getTuningById` はその上に「文字列を知っている人」向けの公開 API を加え、READMEに1行書けばユーザが動けるようにする。データ層の「零依存・出典必須」哲学に何も追加しない — ただ既存の階層に薄い入口を開けた。

444 テスト / 全パス。

---

## 第十三巡: Q31-Q36 の橋渡し関数は互いに使われているか

**目標**: Q31-Q36 で追加した橋渡し関数が単独テストしか持たず、**組み合わせて使われていない**ことを問う。

## Q37. `getTuningById → rankChords → progressionSmoothness` のエンドツーエンド統合テストはあるか？ ❌ **統合未検証 → `integration-extended.test.ts` に追加**

**問**: Q31-Q36 の各関数はユニットテストを持つが、「プリセット調律 → 和音ランキング → 進行スムーズネス」を一連に検証するテストが存在しない。個別に正しくても組み合わせが壊れる可能性がある。

**検証**:
- `integration-extended.test.ts` の既存テストは Q31-Q36 追加前に書かれており、`rankChords` の結果を手動で `best.degrees.map(d => degreeToFreq(tuning, d))` しているが、`realizeRankedChordFreqs` を使っていない
- `getTuningById` + `progressionSmoothness` を組み合わせるテストは存在しない
- `Chord → realizeChordFreqs → fingerFretlessChord` の経路も統合テストなし

**判定**: ❌ 統合的な検証が欠落。フレットレス楽器(`fretlessOud`)との接続も未確認。

**実装**: `integration-extended.test.ts` に新規 describe ブロック追加:
1. `makam_preset_through_full_pipeline`: `getTuningById('makam-ussak-example')` → `rankChords` → `progressionSmoothness` → 各ステップの型的整合性を確認
2. `chord_to_fretless_oud_pipeline`: `chordFromSemitones → realizeChordFreqs → fingerFretlessChord(fretlessOud)` がエラーなく動作
3. `edo_preset_smoothness_is_finite_for_multiple_chord_sizes`: 7/12/19-EDO で `progressionSmoothness` が有限正値を返す

**テスト(3件)**: 非Western調律(Makam)・フレットレス楽器・複数EDOで横断的に動作を確認。

---

## 第十三巡サマリ

| 問                                                           | 判定                    | 対応                                                                    |
| ------------------------------------------------------------ | ----------------------- | ----------------------------------------------------------------------- |
| Q37 Q31-Q36 の橋渡し関数が統合テストを持たない              | ❌ 統合未検証            | `integration-extended.test.ts` に 3 統合テスト追加                     |

**到達した境地**: 関数をユニットテストすることと、関数が**組み合わせて**正しく動作することは別の主張である。ライブラリが「パイプライン的に使われることを意図する」なら、パイプラインそのものをテストしなければならない。Q31-Q36 の橋渡し関数は今はじめて「一連の呼び出し」として検証された。

447 テスト / 全パス。

---

## 第十四巡: 「比が一次、centsは導出」は `Chord` 工場関数でも実現されているか

**目標**: 設計原則「純正律は比を一次保持」が、`Chord` を生成するファクトリ関数でも体現されているかを問う。

## Q38. `chordFromSemitones` しか存在しない — JI 和音を一次精度で作れるか？ ❌ **比の工場関数なし → `chordFromRatios` を追加**

**問**: ライブラリは「比が一次、centsは導出(精度保全)」を設計原則とする。`Pitch` 型は `{kind:'ratio'}` を一級サポートし、`fromRatio(ratio(5,4))` は `{kind:'ratio', ratio:{num:5,den:4}}` を保持する。しかし `Chord` を作れる工場関数は `chordFromSemitones` だけ — これは常に cents ベースの `Pitch` を生成する。

純正律の長三和音(1/1, 5/4, 3/2)を作るには:
```ts
const justMajor: Chord = {
  name: 'just-major',
  intervals: [
    fromRatio(ratio(1,1)),
    fromRatio(ratio(5,4)),
    fromRatio(ratio(3,2)),
  ]
};
```
と手動構築が必要。設計原則「比を一次保持」をライブラリ自身が実践していない。

**判定**: ❌ JI 和音の比一次表現に工場関数がなく、原則と実装が乖離している。

**実装**: `src/core/chord.ts` に追加:
```ts
export function chordFromRatios(
  name: string,
  ratios: ReadonlyArray<readonly [number, number]>,
): Chord {
  return {
    name,
    intervals: ratios.map(([n, d]) => fromRatio(ratio(n, d))),
  };
}
```
`ratio(0,1)` や `ratio(1,0)` は既存の fail-fast で RangeError。

**テスト(7件)**:
- JI 長三度 = `1200*log2(5/4) ≈ 386.31c` ≠ 12-TET 400c (実装精度確認)
- ルートは 0c
- `intervals[1].kind === 'ratio'`(比が一次保存)
- `realizeChordFreqs` が正確な `5/4` 比を復元
- JI と 12-TET で周波数差 >2 Hz
- ゼロ分母 → RangeError
- ゼロ分子 → RangeError

---

## 第十四巡サマリ

| 問                                                     | 判定                    | 対応                                                     |
| ------------------------------------------------------ | ----------------------- | -------------------------------------------------------- |
| Q38 JI 和音工場関数なし、設計原則「比を一次」と乖離   | ❌ 原則と実装の乖離      | `chordFromRatios` 追加 + 7 テスト                        |

**到達した境地**: 設計原則が実装に忠実かどうかは、「どんなユーザー入力を受け付けるか」で問われる。`ratio` と `fromRatio` が存在し `Pitch` 型が比を一級サポートするにも拘わらず、`Chord` を作る唯一の道が cents 変換を経由するなら、その原則はドキュメントの中だけにある。`chordFromRatios` はその欠落を埋め、「比を一次に持ち続ける和音を 1 行で構築できる」ようにする。

454 テスト / 全パス。

---

## Q39. `Scale` は「旋法は一級市民」と主張するが、旋法転回が 1 コールで実現できるか？ ❌→✅

**問(新視点 — ソクラテス式)**: README と CLAUDE.md は `Scale` 層を「微分音文化は旋法中心」として一級市民に格上げした。しかしマカームやラーガの実践において最も基本的な操作 — **旋法転回(modal rotation)** — が `Scale` API に存在するか？ ドリアンはイオニアンの 2 番目の旋法である。これを既存 API で得るには？

**検証**: `scale.ts` を調べると `scaleToCents` / `scaleToFreqs` しかない。旋法転回を行うには呼び出し側が手動で:
1. `degreeIndices` をスライス+再結合
2. 高オクターブ側のインデックスに `tuning.degrees.length`（周期度数）を足す
3. 新 `Scale` オブジェクトを構築

この 3 ステップは `Scale` の不変条件(昇順インデックス・0 起点)を知らなければ正しく実装できない。**旋法転回は `Scale` の内部実装を知る者だけが安全にできる操作**であり、「一級市民」の主張と矛盾する。

**判定**: ❌ 設計原則と実装の乖離 → `scaleMode(scale, modeIndex, tuning): Scale` を追加して解消。

**実装**:
```ts
export function scaleMode(scale: Scale, modeIndex: number, tuning: TuningSystem): Scale {
  assertTuningMatch(scale, tuning);
  const n = scale.degreeIndices.length;
  if (!Number.isInteger(modeIndex) || modeIndex < 0 || modeIndex >= n)
    throw new RangeError(`modeIndex must be in [0, ${n - 1}], got ${modeIndex}`);
  const periodDegrees = tuning.degrees.length;
  const rootDegree = scale.degreeIndices[modeIndex];
  const newIndices = [
    ...scale.degreeIndices.slice(modeIndex).map((d) => d - rootDegree),
    ...scale.degreeIndices.slice(0, modeIndex).map((d) => d - rootDegree + periodDegrees),
  ];
  return { id: `${scale.id}-mode-${modeIndex + 1}`, name: `${scale.name} mode ${modeIndex + 1}`,
    tuningId: scale.tuningId, degreeIndices: newIndices };
}
```

**設計の要点**:
- `rootDegree` を引くことで 0 起点を保証(モード後の最初の音 = 0 度)
- 先頭スライス部分には `+ periodDegrees` を加えてオクターブを「巻き上げ」
- 非整数周期(スレンドロ、ボーレン=ピアス)でも `periodDegrees = tuning.degrees.length` が正しく機能
- 不変条件(Dorian のステップ集合 ⊆ Ionian のステップ集合)をプロパティテストで保証

**テスト(10 件)**:
- `mode 0` → 恒等 (cents 一致)
- Ionian `mode 1` → Dorian: `[0,200,300,500,700,900,1000]`
- Ionian `mode 6` → Locrian: `[0,100,300,500,600,800,1000]`
- id/name 更新・tuningId 保持
- 全 7 モードで先頭 cents = 0
- **ステップ集合の不変性**: 全 7 モードのステップ multiset が同一(旋法転回の核心不変条件)
- 範囲外インデックス → RangeError
- 非整数 modeIndex → RangeError
- tuning 不一致 → RangeError
- 非オクターブ調律(13-EDO Bohlen-Pierce)での旋法転回

---

## 第十五巡サマリ

| 問                                                          | 判定           | 対応                                         |
| ----------------------------------------------------------- | -------------- | -------------------------------------------- |
| Q39 `Scale` に旋法転回なし、「旋法は一級市民」と矛盾        | ❌ 設計と実装の乖離 | `scaleMode` 追加 + 11 テスト            |

**到達した境地**: 「一級市民」という主張は操作の完全性で測られる。`Scale` が旋法を表現できても旋法転回を表現できなければ、最も基本的なマカーム操作(ウシャク → ブーセリク → ヒジャズ)が外部ループを要求する。11 個のテストのうち最も重要なのは「ステップ multiset の不変性」 — これがソクラテス式の核心: 「旋法転回とは何か」を問えば「同じ音程集合の別の出発点」という不変条件が現れ、その不変条件がテストになる。

464 テスト / 全パス。

---

## Q40. `rankChords` が返す `RankedChord` を「再利用可能な和音」として保存できるか？ ❌→✅

**問(新視点)**: `rankChords` は調律系上で最適な和音を発見するが、その結果は `RankedChord` 型 — 調律依存の絶対度数インデックスと cents 配列を持つ探索出力形式である。発見した和音をギタータブ・SMF・別の調律システムに持ち込みたい場合、ユーザーは `Chord`(根音相対インターバル)が必要だ。`RankedChord → Chord` の変換が 1 コールで存在するか？

**検証**: `chord-search.ts` を調べると `realizeRankedChordFreqs`(Hz 変換)・`progressionSmoothness`(進行コスト)は存在するが、**`RankedChord → Chord` への持ち上げ**は存在しない。`RankedChord.cents` は既に根音相対(cents[0] = 0)だが、それを `Chord` に変換するには構造体を手動組み立てする必要がある。

**判定**: ❌ ラウンドトリップが不完全 → `rankedChordToChord` を追加して解消。

**実装**:
```ts
export function rankedChordToChord(ranked: RankedChord, name?: string): Chord {
  return {
    name: name ?? `chord-${ranked.degrees.join('-')}`,
    intervals: ranked.cents.map((c) => ({ kind: 'cents' as const, cents: c })),
  };
}
```

`RankedChord.cents` は既に根音相対なので変換は「持ち上げ」のみ。`name` を省略すると度数から自動命名。

**テスト(7 件)**:
- 最初の cents = 0(根音相対保証)
- `chordToCents(chord)` が `ranked.cents` に一致
- `realizeChordFreqs(chord, 440)` が `realizeRankedChordFreqs(ranked, 440)` に一致
- 名前の自動生成(度数インデックスから)
- 名前の明示指定
- インターバル数 = ranked のサイズ
- 粗さ往復不変量: 同じ rootHz で採点すると `roughness` が一致

---

## 第十六巡サマリ

| 問                                                              | 判定              | 対応                                              |
| --------------------------------------------------------------- | ----------------- | ------------------------------------------------- |
| Q40 `rankChords` 結果 → 再利用可能 `Chord` への変換が 1 コールで不在 | ❌ ラウンドトリップ欠落 | `rankedChordToChord` 追加 + 7 テスト            |

**到達した境地**: `rankChords` は「発見」であり `Chord` は「記譜・持ち運び」である。この2つは別の存在論的層にあるが、橋がないと発見した音楽はそのセッションにしか存在しない。`rankedChordToChord` は発見から記譜への1行の橋であり、ラウンドトリップ(調律 → 発見 → 和音 → 別の調律/楽器/エクスポート)を完成させる。

471 テスト / 全パス。

---

## Q41. `Scale` から `rankChords` で「ダイアトニック和音」を発見できるか？ ❌→✅

**問**: `rankChords(tuning, opts)` は調律系の全度数を探索する。マカームやラーガの実践者は「この旋法の中だけで最も協和する和音は何か」(ダイアトニック和音探索)を知りたい。`Scale` から直接 `rankChords` に渡す道があるか？

**検証**: `rankChords` は `TuningSystem` を受け取る。`Scale.degreeIndices` は親調律の一部の度数を指す。この橋が欠けているため、ユーザーは親調律の全度数を受け取り、手動でフィルタリングする必要がある — `Scale` が「第一級市民」である主張と矛盾。

**判定**: ❌ `Scale → TuningSystem` の橋が欠落 → `scaleToTuning(scale, tuning): TuningSystem` を追加して解消。

**実装**:
```ts
export function scaleToTuning(scale: Scale, tuning: TuningSystem): TuningSystem {
  assertTuningMatch(scale, tuning);
  return defineTuning({
    id: `${scale.id}-tuning`,
    name: `${scale.name} (tuning)`,
    referenceHz: tuning.referenceHz,
    periodCents: tuning.periodCents,
    degrees: scale.degreeIndices.map((d) => ({
      kind: 'cents' as const,
      cents: degreeToCents(tuning, d),
    })),
    source: tuning.source,
    region: tuning.region,
  });
}
```

これにより `rankChords(scaleToTuning(dorian, t12))` は12音中のダイアトニック和音のみを探索する。`scaleMode` と組み合わせると `scaleMode → scaleToTuning → rankChords` で「旋法ごとの協和和音」パイプラインが完成。

**テスト(8 件)**:
- 度数数 = スケール長
- cents が `scaleToCents` に一致
- `referenceHz`・`periodCents` の保存
- id は `${scale.id}-tuning`
- tuning 不一致 → RangeError
- C(6,2)=15 ダイアトニック3和音 < C(11,2)=55 全12音3和音(スケール制約の証明)
- Ionian と Dorian の `scaleToTuning` → `rankChords` が異なるトップ和音を返す

---

## 第十七巡サマリ

| 問                                                              | 判定              | 対応                                              |
| --------------------------------------------------------------- | ----------------- | ------------------------------------------------- |
| Q41 `Scale → rankChords` のダイアトニック探索路がない           | ❌ 橋の欠落       | `scaleToTuning` 追加 + 8 テスト                   |

**到達した境地**: `Scale` は「選択の記述子」(どの度数を使うか)であり `TuningSystem` は「音律の完全な仕様」だ。この2つは別の存在だが、`scaleToTuning` によって選択記述子が音律仕様に「昇格」できる。この昇格を経ることで、スケールの選択は `rankChords`・`mtsBulkDump`・`fingerChord` などあらゆる音律ベースのパイプラインへの入口になる。「旋法が第一級」とは、旋法が処理パイプラインの起点になれることを意味する。

479 テスト / 全パス。
