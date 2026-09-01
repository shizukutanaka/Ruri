# Ruri 作業指示書(Opus / Sonnet 向け)

> 対象読者: このリポジトリで作業を再開する AI モデル(Claude Opus / Sonnet クラス)。
> 目的: 再発見コストゼロで、正しい前提・正しい検証・正しい優先順位のもとに実装を継続できること。
> 最終更新: 2026-07(session_01TmahfBEYBbq8Vmr8uk8mYz)。

---

## 1. 現在地(まず把握すること)

- **プロダクトは完成・公開済み**。このリポジトリのデフォルトブランチ
  (`claude/product-analysis-sonnet-x86ho5` — master/main は存在しない)の head が
  v0.1.0 相当の検証済み完成品。**push した時点で GitHub 公開**となる。
- 規模感: `src/` **37,799行**、高速テスト **2,833件**(`npm test`、**約9秒**)。
  公開API **304**(curated)。devDeps 脆弱性 **0**(vitest 4)。モジュールは core(理論)/
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
7. **CARE/OCAP ゲートは `source: 'measured'` にのみ適用**(`loadTuningPreset` の実装が正)。
   民族実測データ(gamelan/maqam/raga 等)は文化的文脈+人的レビュー必須。一方、
   公刊済みの理論的調律(`source: 'theoretical'`、例: Werckmeister 1691・Kirnberger 1779・
   Pythagorean・Bohlen-Pierce)は**ゲート対象外** — 出典・ライセンス・「一例に過ぎない」
   注記で足りる。この区別を取り違えると、正当な作業を過剰にブロックする(実際に発生した
   — `docs/first-principles-2026-07.md` §4)。**新規プリセットには必ず独立した検証
   オラクル**(既存関数との一致 or その音律の定義的性質)を付けること。

## 2.5 公開APIは意図的に絞られている(戻さないこと)

- `src/core/index.ts` / `src/data/index.ts` は**curated barrel**。かつて 1,445 名を
  明示 export していたが README が記載するのは 56 — 26:1 で検索不能だった。
  現在 **304 export**。`scale.ts`/`presets.ts` の機械生成層は**実装は無傷**で
  パス直指定 import は可能。変えたのは「パッケージが何を提供するか」だけ。
- `src/api-surface.test.ts` がこれを固定(README掲載シンボルの解決・解析モジュールの
  到達性・生成名が公開されていないこと・総数の上下限)。**barrel に `export *` を
  足して生成層を戻さないこと** — 戻すならこのテストの上限を上げる判断が要る。

## 3. 検証プロトコル(全変更で必須の順序)

```
npm run check        # typecheck + lint + format:check + 高速テスト全緑
npm run build        # dist 再生成(CLI は dist/cli.js を実行するため必須)
node bin/ruri.mjs …  # 変更機能を実ファイルで実機ドライブ(scratchpad に .scl を作る)
git commit / push    # メッセージに検証結果を書く
```

**リリース可否の最終確認**(パッケージとして完成しているかの判定):

```
npm pack && (別ディレクトリで) npm install <tarball>
node -e "import('ruri').then(m=>...)"      # ルート + 'ruri/adapters' サブパス
./node_modules/.bin/ruri edo 31             # bin エントリ
```

2026-07 実施: `edo`/`mosSizes`/`fjsName`/`optimalGenerator`/`getTuningById`/
`parseScaleWorkshop`/`.scl`出力/CLI(`edo`・`convert`・`gen --fit-timbre`)すべて
インストール済みパッケージから動作確認済み。

- **実機ドライブを省略しない**。このセッションの実バグ2件(`.mid` が生 SysEx で
  無効な MIDI ファイル / 量子化ノイズで等分割を偽 MOS 報告)はどちらも
  **テスト緑のまま**実機ドライブで発見された。
- **機械生成テストは削除済み**(2026-07、99,237行・12,311ケース)。`test`/`lint`/`coverage`
  すべてから除外されており実際には一度も走っていなかった = 保護ゼロ。手書きスイートが
  同じモジュールを 5,797 ケースで覆う。削除後もテスト数は 7,485 で不変 = 寄与ゼロの証拠。
  **機械生成テストを再導入しない**。
- **カバレッジゲートは修正済み・合否判定に使える**(2026-07)。閾値 95/90/98/95
  (lines/branches/functions/statements)に対し実測 **98.63 / 94.85 / 100 / 98.19**。
  落ちたらゲートが機能した証拠なので**閾値を下げず**カバレッジを足すこと。
  生成層の削除後は **carve-out なしで `src/` 全ファイルを計測**している。
  かつて「80%閾値 vs 実測35.8%」と乖離していたのは**測る対象が誤っていた**ため —
  12.8万行の機械生成実装を分母に含めていた。その実装自体を削除したので、
  現在は除外なしで全ファイルを測って通過する。**閾値は下げず引き上げた**。
- **未テスト関数は実在バグの在処**。functions 閾値が 0.02pt 足りず落ちたのを
  追ったところ、テストが1件も無い公開関数6件が出てきて、うち2件が壊れていた:
  `tuningHarmonicityProfile` は**全調律で定数**を返し(`scaleMode` は degree-index
  空間で回すので、全degreeを選ぶ scale の回転は恒等写像 — 修正は cents 空間で
  `c[(k+i) mod n] − c[k]` を組む)、その結果 `tuningHarmonicityCorrelation` は
  **常に NaN**、`comparePresets(...).correlation` も同様だった。
  **閾値に合わせて数字を足すのではなく、未テスト関数を実際に呼んで検算する**。
- **「黙って間違う」より「はっきり断る」**。`decodeSmf` は Program Change / Channel Pressure
  (データバイト1個)の後を2バイト進めており、実機ファイル冒頭の音色指定で**以降の全音符を
  黙って失っていた**。制限は docstring に書いてあったが、**沈黙のデータ欠損を文書化しても
  fail-fast にはならない**。解釈不能なもの(可変長 SysEx 等)は推測せず throw する。
- **ガードは条件が合っているか検算する**。`optimalGenerator` の `t.num * t.den || 2` は
  「積が 0」を守っていたが正整数の積は 0 にならない。退化するのは**積が 1**(ユニゾン、
  Tenney 高 0 → ゼロ除算)で、結果は全フィールド NaN だった。
- **使われない引数は削除する**。`bestModeForTuning` の `maxDegrees` は「大きな調律で
  探索空間を絞る」ためとされていたが、両ランキングが対象とする `scaleModeSeries` の
  回転はすべて調律と同じ degree 数なので、`>= n` なら何も絞らず `< n` なら全部落として
  throw する — 結果を狭める設定値が存在しなかった(呼び出し側も皆無)。削除済み。

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

- **`src/core/scale.ts` に関数を追加しない**。2026-07 に到達不能な生成関数を削除し
  3,711→440 宣言(80,234→4,759行)に縮小した。再肥大させないこと。理論層
  (MOS・well-formed・最大均等・協和・temperament)は完備。新しい価値は
  「既存関数の CLI/アダプタへの配線」「実バグ修正」「相互運用」にある。
- **機械生成コードを再導入しない**。`presets.ts` も 2,206→32 宣言(38,695→702行)。
  `src/` 全体は 186,604→**37,799行**。`adapters/wav.ts` も 57→16 export(2,284→439行)。
  到達可能性は curated barrel + CLI + 手書きアダプタ/結合テストからの推移閉包で判定した。
- **西洋理論層・12-TET 固定層・出典なし民族データ表を `src/core` に置かない**。
  2026-08 に8モジュール(`gamelan`/`key-detect`/`tonnetz`/`pcset`/`maqam`/`japanese-scale`/
  `progression`/`rhythm`)を削除した。根本原因は「provenance ゲートが `src/data` にしか無く、
  同種のデータが core に関数として生えるとゲートを迂回できた」こと。とくに `gamelan.ts` は
  出典付き `SLENDRO_EXAMPLE` の劣化重複で、実測の伸張オクターブ(1208c)を 1200c に潰していた。
  `src/api-surface.test.ts` が削除名13件の**不在を固定**している。経緯は `docs/audit-2026-08.md`。
- familiarity スコアの実装(§2-3)、タグ/workflow push の再試行ループ(§4)、
  調律プリセットの独断追加(§6 C-4 の人的ゲート)。

## 6. 改善バックログ(優先度・実装ガイド付き)

### ゲートなし(単独で着手可)

| 項目                                          | 期待される形                                                                                                                                                 | 再利用する既存実装                                                        | 検証                                                                                                                                       |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| ~~`ruri gen … -o out.wav`~~ **完了(893bad4)** | `writeTuningOutput` に `.wav` ケース追加済み                                                                                                                 | `tuningToScaleWav`                                                        | —                                                                                                                                          |
| ~~FJS 命名~~ **完了**                         | `fjs.ts`(マスターアルゴリズムで形式コンマ導出 + 音程命名)。残るは SonicWeave の _import_ 側                                                                  | —                                                                         | —                                                                                                                                          |
| ~~Scale Workshop 取込~~ **完了**              | `adapters/scale-workshop.ts`(4記法対応・CLI が .txt/.sw を受理)                                                                                              | —                                                                         | —                                                                                                                                          |
| SonicWeave DSL import(C-7、残り)              | `.sw`/FJS → `TuningSystem`(まず cents/ratio/EDO 記法の最小サブセット)                                                                                        | `parseScl`/`sclToTuning` のパターン(`src/adapters/scala.ts`)              | golden round-trip + 実機 convert                                                                                                           |
| ~~CLI `--name` オプション~~ **完了**          | convert/gen/presets の出力調律名を上書き済み                                                                                                                 | —                                                                         | —                                                                                                                                          |
| ~~RTT: 最適生成音程~~ **完了**                | `generator-tuning.ts`(閉形式・重み付き最小二乗)。CLI 表面は未実装(温度律カタログが要るため)                                                                  | —                                                                         | —                                                                                                                                          |
| RTT 指標の拡充(任意)                          | TE誤差・badness・rank-2 temperament の探索(Erlich "A Middle Path")。土台は実装済み: `edo-error.ts`(相対誤差・consistency)と `val.ts`(patent val・コンマ消失) | `src/core/edo-error.ts`、`src/core/val.ts`、`src/core/temperament.ts`     | **公刊された既知値をオラクルにする**(例: 46-EDO が13-odd-limit最小、17-EDO の patent val = `<17 27 39]`、meantone EDO = 12/19/26/31/43/50) |
| 歴史的調律の追加拡充                          | Young II・Vallotti・Meantone 各種等(**理論的調律は CARE ゲート対象外** — §2-7)                                                                               | 既存プリセット5件のパターン(`src/data/presets.ts` 末尾)+ 検証オラクル必須 | オラクルテスト + `ruri presets` 実機                                                                                                       |
| `info` の追加診断                             | 平均ステップ・協和スコア等(慎重に、ノイズにしない)                                                                                                           | `tuningMosPattern`・`chordDissonance` 等                                  | 実機で有用性確認                                                                                                                           |

### 人的ゲート付き(ユーザー承認なしに着手禁止)

- **C-4 DaMuSc プリセット取込**: McBride PLoS ONE 2023 の実測スケール DB。
  ライセンス確認 + 文化的レビュー(`docs/GOAL-AUDIT.md` の人的ゲート)が前提。
  技術面は `Provenance` 必須の `src/data/tuning-data.ts` 形式に合わせる。
- **C-6 vitest 3→4**: devDeps の高/致命的脆弱性(esbuild/vite 系)の根本解決。
  破壊的変更 — テスト分割・CI 構成が壊れるリスクを説明して承認を得る。
- ~~**C-8 カバレッジ方針**~~ **解決済み(2026-07)**: 選択肢(b)を採用 —
  生成実装を coverage から除外。手書きコードの実測は 98.18% で、閾値を
  95/90/98/95 に**引き上げて**通過。ユーザー判断を要する論点は残っていない。

## 7. 長所(セールスポイント — 壊さないこと)

- cents/比の二層表現(往復無劣化)、非オクターブ周期の一次対応。
- 出典必須データモデル(CARE/OCAP)— Leimma/Apotome と同じ問題意識を実装レベルで担保。
- 理論生成層の完備(MOS・L/s パターン・Myhill・最大均等)— Tonal.js にない差別化。
- DAW 実務フォーマット網羅(SMF/MPE/MTS/.scl/.kbm/.tun/UMP)+ バイト厳密往復テスト。
- zero runtime-dependency・決定的合成・property-based テスト。
- fs 非依存 CLI(生成→検査→変換→レンダリングの完全ワークフロー)。

## 8. ドキュメントマップ

| ファイル                                            | 内容                                                                      |
| --------------------------------------------------- | ------------------------------------------------------------------------- |
| `docs/model-handbook.md`                            | 本書(作業指示・不変条件・バックログ)                                      |
| `docs/first-principles-2026-07.md`                  | 目的から再導出した過不足分析(90.6%の過剰・データ不足・CAREゲートの誤適用) |
| `docs/product-review.md`                            | 内部監査ベースの過不足リスト(2026-06/07)                                  |
| `docs/research-2026-07.md`                          | 外部リサーチ(論文・標準・ツール)+ 出典付き改善リスト                      |
| `docs/release-note.md`                              | v0.1.0 リリース手順(オーナー権限が必要な残作業)                           |
| `docs/ci-workflow-note.md` / `docs/ci.yml.proposed` | CI workflow の手動適用手順                                                |
| `src/core/CLAUDE.md` / `src/adapters/CLAUDE.md`     | 層別の不変条件・バイナリ Gotchas                                          |
| `CHANGELOG.md`                                      | Keep a Changelog 形式(0.1.0 確定済み・Unreleased 継続中)                  |
