# Ruri 作業指示書(Opus / Sonnet 向け)

> 対象読者: このリポジトリで作業を再開する AI モデル(Claude Opus / Sonnet クラス)。
> 目的: 再発見コストゼロで、正しい前提・正しい検証・正しい優先順位のもとに実装を継続できること。
> 最終更新: 2026-07(session_01TmahfBEYBbq8Vmr8uk8mYz)。

---

## 1. 現在地(まず把握すること)

- **プロダクトは完成・公開済み**。このリポジトリのデフォルトブランチ
  (`claude/product-analysis-sonnet-x86ho5` — master/main は存在しない)の head が
  v0.1.0 相当の検証済み完成品。**push した時点で GitHub 公開**となる。
- 規模感: 高速テスト **7,300+件**(`npm test`、~2分)。モジュールは core(理論)/
  adapters(SMF・Scala .scl/.kbm・MPE・MTS SysEx・AnaMark .tun・MIDI 2.0 UMP・WAV)/
  data(出典必須プリセット)/ CLI(`ruri info/convert/gen/render`)。
- CHANGELOG は `[0.1.0] - 2026-07-14` を確定済み。**タグと GitHub Release は未作成**
  (権限制約 — §4)。手順は `docs/release-note.md`。

## 2. 不変条件(違反禁止 — 各層の CLAUDE.md と併読)

1. **比が一次、cents は導出**。cents→比の逆変換は不可逆なので実装しない。
   例外は表示専用ヒントのみで、必ず `≈` と誤差を明記(`nearestJiHint` in `src/cli.ts`
   が模範: ≤1.0c 誤差 かつ odd-limit ≤15 でゲート)。
2. **`mosPattern` と `isWellFormed` は量子化定数 `ROUND` を共有**
   (`src/core/generate.ts`、現在 1e-3 cent = 0.001c)。片方だけ変えると相互矛盾する。
   **1e-6 に戻してはならない** — `.scl` の6桁精度と同スケールになり、往復ノイズで
   等分割が偽 MOS(19-EDO が `14L5s`)と誤報告される実バグがあった(2026-07に修正済)。
3. **協和は acoustic-only**(roughness + harmonicity)。第三要素 familiarity
   (文化的親しみ)は README 設計原則により**意図的に除外** — 実装しない・提案しない。
4. **TS ソース(`src/`)に `node:` import・`@types/node` を持ち込まない**。
   CLI ロジックは `runCli(argv, io)`(fs 非依存・`CliIo` 注入)に置き、
   実 fs/process は `bin/ruri.mjs`(plain ESM)だけが触る。lint は `no-console: error`。
5. **バイナリ出力アダプタは golden round-trip 必須**(encode→decode 一致 + 手計算の
   既知バイト列)。`src/adapters/CLAUDE.md` の形式別 Gotchas を実装前に読むこと。
6. 調律に単一正規形なし(`periodCents` は 1200 固定でない)。`referenceHz`/`source`
   を捨てない。fail-fast(`defineTuning`・`ratio()` は不正値で即 throw)。

## 3. 検証プロトコル(全変更で必須の順序)

```
npm run check        # typecheck + lint + format:check + 高速テスト全緑
npm run build        # dist 再生成(CLI は dist/cli.js を実行するため必須)
node bin/ruri.mjs …  # 変更機能を実ファイルで実機ドライブ(scratchpad に .scl を作る)
git commit / push    # メッセージに検証結果を書く
```

- **実機ドライブを省略しない**。このセッションの実バグ2件(`.mid` が生 SysEx で
  無効な MIDI ファイル / 量子化ノイズで等分割を偽 MOS 報告)はどちらも
  **テスト緑のまま**実機ドライブで発見された。
- 低速テスト(`*-generated.test.ts`、~5時間)は CI・`npm test` から除外済み。
  意図的に流す場合のみ `npm run test:generated`。**機械生成テストは増やさない**。
- カバレッジゲート(`npm run coverage`)は既知の不整合あり(§6 C-8)。合否判定に使わない。

## 4. セッション権限の既知制約(再試行で無駄にしない)

- **push できるのはブランチのみ**。タグ push → GitHub が HTTP 403。
  workflow ファイル(`.github/workflows/*`)を含むコミットの push → App に
  `workflows` 権限がなく **remote rejected**(混入させるとそのコミットを落とすまで
  一切 push 不能になる — 実際に発生した)。
- GitHub MCP にタグ/Release **作成**系ツールは存在しない(get/list のみ)。
- 対処は「引き継ぎ文書」方式: リリース手順=`docs/release-note.md`、
  CI workflow 適用手順=`docs/ci-workflow-note.md`(内容は `docs/ci.yml.proposed`)。
- push は失敗時 2s/4s/8s/16s の指数バックオフで最大4回。npm publish は資格情報なしで不可。

## 5. やらないこと(過剰の再発防止)

- **`src/core/scale.ts` に関数を追加しない**。~4,437 個の機械生成関数で既に肥大
  (生 77,000 行超)。理論層(MOS・well-formed・最大均等・協和・temperament)は完備。
  新しい価値は「既存関数の CLI/アダプタへの配線」「実バグ修正」「相互運用」にある。
- familiarity スコアの実装(§2-3)、タグ/workflow push の再試行ループ(§4)、
  調律プリセットの独断追加(§6 C-4 の人的ゲート)。

## 6. 改善バックログ(優先度・実装ガイド付き)

### ゲートなし(単独で着手可)

| 項目 | 期待される形 | 再利用する既存実装 | 検証 |
|------|--------------|--------------------|------|
| `ruri gen … -o out.wav` | `writeTuningOutput`(`src/cli.ts`)に `wav` ケース追加。現状 gen は音を出せない | `tuningToScaleWav`(`src/adapters/wav.ts`)+ `DEFAULT_SYNTH_SCALE` | 実機: `gen edo 19 -o x.wav` が RIFF |
| SonicWeave/FJS import(C-7) | `.sw`/FJS → `TuningSystem`(まず cents/ratio/EDO 記法の最小サブセット) | `parseScl`/`sclToTuning` のパターン(`src/adapters/scala.ts`) | golden round-trip + 実機 convert |
| CLI `--name` オプション | gen/convert の出力調律名を上書き | `Args` パーサ(`src/cli.ts`) | テスト + 実機 |
| `info` の追加診断 | 平均ステップ・協和スコア等(慎重に、ノイズにしない) | `tuningMosPattern`・`chordDissonance` 等 | 実機で有用性確認 |

### 人的ゲート付き(ユーザー承認なしに着手禁止)

- **C-4 DaMuSc プリセット取込**: McBride PLoS ONE 2023 の実測スケール DB。
  ライセンス確認 + 文化的レビュー(`docs/GOAL-AUDIT.md` の人的ゲート)が前提。
  技術面は `Provenance` 必須の `src/data/tuning-data.ts` 形式に合わせる。
- **C-6 vitest 3→4**: devDeps の高/致命的脆弱性(esbuild/vite 系)の根本解決。
  破壊的変更 — テスト分割・CI 構成が壊れるリスクを説明して承認を得る。
- **C-8 カバレッジ方針**: 80% 閾値 vs 実測 35.8% の不整合。選択肢
  (a: 閾値引下げ / b: `coverage.include` 絞込 / c: 低速テストを CI へ)をユーザーが選ぶ。

## 7. 長所(セールスポイント — 壊さないこと)

- cents/比の二層表現(往復無劣化)、非オクターブ周期の一次対応。
- 出典必須データモデル(CARE/OCAP)— Leimma/Apotome と同じ問題意識を実装レベルで担保。
- 理論生成層の完備(MOS・L/s パターン・Myhill・最大均等)— Tonal.js にない差別化。
- DAW 実務フォーマット網羅(SMF/MPE/MTS/.scl/.kbm/.tun/UMP)+ バイト厳密往復テスト。
- zero runtime-dependency・決定的合成・property-based テスト。
- fs 非依存 CLI(生成→検査→変換→レンダリングの完全ワークフロー)。

## 8. ドキュメントマップ

| ファイル | 内容 |
|----------|------|
| `docs/model-handbook.md` | 本書(作業指示・不変条件・バックログ) |
| `docs/product-review.md` | 内部監査ベースの過不足リスト(2026-06/07) |
| `docs/research-2026-07.md` | 外部リサーチ(論文・標準・ツール)+ 出典付き改善リスト |
| `docs/release-note.md` | v0.1.0 リリース手順(オーナー権限が必要な残作業) |
| `docs/ci-workflow-note.md` / `docs/ci.yml.proposed` | CI workflow の手動適用手順 |
| `src/core/CLAUDE.md` / `src/adapters/CLAUDE.md` | 層別の不変条件・バイナリ Gotchas |
| `CHANGELOG.md` | Keep a Changelog 形式(0.1.0 確定済み・Unreleased 継続中) |
