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

| 問 | 判定 | 対応 |
|----|------|------|
| Q1 協和の timbre 依存 | ⚠️ 隠蔽 | JSDoc で2軸の性質を開示 + timbre依存/非依存を証明するテスト |
| Q3 edo vs 12-tet の id | ⚠️ foot-gun | `edo()` JSDoc に非互換を明記 |
| Q8 統合テスト欠落 | ❌ ギャップ | 新モジュール連結の統合テスト追加 |
| Q2,4,5,6,7 | ✅ 健全 | 変更不要(検証で確認) |

ソクラテス的態度: 5件は「健全」と確認できたこと自体が成果(無批判な追加実装への歯止め)。残3件は**前提を消さず可視化**することで解いた。
