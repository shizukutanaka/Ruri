# 外部リサーチに基づく長所・短所・改善点(2026-07)

本書は、2025–2026 の関連研究・標準・ツール・コミュニティ動向を調査し、Ruri の
**長所 / 短所 / 改善点** を外部視点で選別・リスト化したもの。内部監査(`docs/product-review.md`)
を外部情報で裏付け・補強することが目的。各改善項目は Opus / Sonnet クラスのモデルが
単独で読んで着手できるよう、「根拠 / 期待される形 / 現状 / 優先度」を明記する。

> 本セッションでは調査に加え、下記「不足」のうち実務価値が高くコード肥大を招かない
> 項目(**CLI バッチツール**・**MOS L/sパターン解析**・**MIDI 2.0 UMPアダプタ**)を実装済み。
> 詳細は末尾「本セッションの実装」を参照。

---

## A. 調査ソース

### 論文
- **McBride, J. M. (2025)** "Musical consonance: a review of theory and evidence on
  perception and preference of auditory roughness in humans and other animals",
  arXiv:2510.14159. — ラフネス(粗さ)ベースの協和モデル(Plomp-Levelt / Sethares 系)の
  定義の循環性と実証データとの乖離を批判的にレビュー。協和は「干渉(roughness)+
  調波性(harmonicity)+文化的学習(familiarity)」の複合現象とする近年の合意を整理。
- **Harrison, P. & Pearce, M. (2020)** 協和の三要素モデル(interference / periodicity /
  familiarity)。上記レビューが依拠する主要な計算モデル。
- **McBride, Passmore & Tlusty (2023)** "Convergent evolution in a large cross-cultural
  database of musical scales", PLoS ONE 18(12): e0284851. データセット **DaMuSc**
  (github.com/jomimc/DaMuSc)— 世界規模の実測スケール DB。cents 表記・社会/言語データ紐付き。

### 標準・プロトコル
- **MIDI 2.0 / Universal MIDI Packet (UMP)** — per-note pitch bend と Note On 直接ピッチ
  指定がネイティブ化。2025 年時点でハード(Akai MPK 2025+)・DAW(Bitwig 6)実装が進行。
- **MTS-ESP (ODDSound)** — DAW 内リアルタイム調律共有の事実上の標準(C/C++ ライブラリ)。
- **MIDI Tuning Standard (MTS) SysEx バルクダンプ** — Ruri 実装済み(`src/adapters/mts.ts`)。

### ツール・エコシステム
- **Scale Workshop 3 / SonicWeave DSL**(xenharmonic-devs)— スケール記述 DSL の現行標準。
  FJS・monzo・EDO 記法対応。
- **xenharmonic-devs/moment-of-symmetry** — MOS スケール生成の参照 JS 実装。
- **Leimma / Apotome**(Khyam Allami × Counterpoint、Ars Electronica 2021 受賞)—
  非西洋調律の探索/生成ツール。文化的バイアスへの取り組み。
- **Tonal.js** — JS 音楽理論ライブラリの最大手。ただし 12-TET 前提でマイクロトーナル理論は非対応。
- **Surge XT** — オープンソース微分音シンセの事実上の標準(MTS-ESP マスター可)。

### 動画・コミュニティ
- **Sevish**(YouTube 3 万人超、2026 も活動)、**The Microtone Fox**(2026 版ソフト/ハード一覧)。
  31EDO 系コンテンツが安定した人気。

---

## B. 長所(外部比較で確認された強み)

1. **cents/比の二層表現が正しい**。純正律を厳密有理数で一次保持し cents を導出。
   Tonal.js が 12-TET に固定される中、Ruri は非西洋・微分音を一次対応 — 明確な差別化。
2. **協和判定が「acoustic-only」を明示的な設計原則にしている**(README 設計原則)。
   McBride 2025 の三要素(roughness / harmonicity / familiarity)のうち、Ruri は
   roughness(Sethares)と periodicity(Stolzenburg)を実装し、**familiarity=文化的親しみを
   意図的に除外**して「美的判定をしない」立場を取る。これは近年の研究が指摘する
   「familiarity は文化依存で普遍モデル化が困難」という論点と整合する、防御可能な設計判断。
3. **理論生成層がイディオム非依存で完備**。MOS 生成(`generatedScale` / `generatedTuning`)、
   Myhill well-formed 判定(`isWellFormed`)、最大均等(Clough-Douthett, `maximallyEven`)を
   すべて公開 API として保持。xenharmonic-devs の各参照実装に相当する機能を単一ライブラリで提供。
4. **出典必須のデータモデル(Provenance / CARE)**。Leimma/Apotome と同じ問題意識
   (西洋中心バイアスの是正)を実装レベルで担保。
5. **DAW/シンセ実務フォーマットを網羅**。SMF・MPE・Scala `.scl`/`.kbm`・AnaMark `.tun`・
   MTS SysEx。バイト厳密な往復テストで検証。
6. **zero runtime-dependency / 決定的合成 / property-based テスト**。

---

## C. 短所 / 改善点(過不足リスト)

各項目に **[根拠] / [期待される形] / [現状] / [優先度]** を付す。

### C-1. 【対象外と判明】複合協和スコア(roughness + harmonicity + familiarity)
- **[根拠]** McBride 2025 / Harrison & Pearce 2020 の三要素モデル。
- **[期待される形]** 三要素を合成した単一協和スコア API。
- **[現状]** roughness と periodicity は個別実装済み、両者を平均する `combinedScore` も
  `scale.ts` に存在。第三要素 familiarity は **設計原則により意図的に除外**(長所 B-2)。
- **[優先度]** 低(実装ではなく設計判断の問題)。**改善は「新 API 追加」ではなく
  「README/docs で三要素モデルとの対応関係を明記する」ことに限定するのが妥当**。
  familiarity を足すと「美的判定をしない」原則に反するため、実装は非推奨。

### C-2. 【対象外と判明】MOS スケール生成
- **[根拠]** xenharmonic-devs/moment-of-symmetry、xen wiki。
- **[現状]** **実装済み**(`src/core/generate.ts`: `generatedScale` / `generatedTuning` /
  `isWellFormed` / `isTuningWellFormed`)。公開 API。
- **[優先度]** なし(充足済み)。補強するなら L/s ステップパターン列挙(`LLsLLLs` 等の
  文字列表現)と MOS 族ツリー(親子関係)の追加が考えられるが、コア機能は揃っている。

### C-3. CLI / 実行可能インターフェースの欠如 → **本セッションで実装**
- **[根拠]** ライブラリの positioning は「DTM output backbone」。Scale Workshop・
  Leimma 等の競合はすべて実行可能なフロントを持つ。Ruri はプログラマ向け API のみだった。
- **[期待される形]** コマンドラインから調律の変換・レンダリングを一括実行。
- **[現状]** **実装済み**(下記「本セッションの実装」)。
- **[優先度]** 高 → 完了。

### C-4. DaMuSc 由来のプリセット拡充
- **[根拠]** McBride et al. 2023(PLoS ONE)、DaMuSc データセット(cents・出典・ライセンス付き)。
- **[期待される形]** 世界各地の実測スケールを `Provenance` 付きで `src/data/tuning-data.ts` に追加。
  DaMuSc は出典・社会/言語紐付けが揃っており、Ruri の「CARE 準拠の出典整備が前提」という
  従来ブロッカーを解消できる一次資料。
- **[現状]** 未着手。プリセットは限定的。
- **[優先度]** 中。データ取り込みスクリプト + DaMuSc のライセンス確認(CC 系か)が必要。
  文化的レビュー(人的ゲート)は GOAL-AUDIT の方針に従う。

### C-5. MIDI 2.0 / UMP per-note pitch エンコーダ → **実装済み**
- **[根拠]** MIDI 2.0 仕様、2025 年のハード/DAW 実装動向。
- **[期待される形]** UMP の per-note pitch bend / Note On 直接ピッチを出力する
  アダプタ。MPE(MIDI 1.0 世代)の後継。
- **[現状]** **実装済み**(`src/adapters/ump.ts`)。Pitch 7.9 属性付き Note On/Off
  (`umpNoteOnPitch79`/`umpNoteOff`)、per-note pitch bend(`umpPerNotePitchBend`、
  `bendRangeSemitones` は必須引数 — 仕様に既定感度がないため)、`chordToUmp`/
  `tuningDegreeToUmp` で既存 `Chord`/`TuningSystem` 型と直結。`decodeUmp`+
  golden round-trip・手計算バイト列・fast-check性質テストで検証(17テスト)。
- **[優先度]** 完了。

### C-6. CI セキュリティ監査が非ブロッキング
- **[根拠]** 内部監査(product-review.md)。
- **[期待される形]** 高深刻度脆弱性検出時に CI を赤くする。
- **[現状]** `ci.yml` の `npm audit --audit-level=high || true` が失敗を握りつぶす。
  なお脆弱性 6 件はすべて devDependencies(vite/vitest/esbuild 系)で、公開パッケージは
  zero runtime-dependency のため利用者には影響しない。解消には vitest 3→4 の
  破壊的アップグレードが必要。
- **[優先度]** 低。vitest メジャーアップグレードと同時に対処するのが安全。

### C-7. SonicWeave / FJS 相互運用
- **[根拠]** Scale Workshop 3 / SonicWeave が xen コミュニティの現行標準記法。
- **[期待される形]** SonicWeave 記法・FJS の import/export。
- **[現状]** 未着手。相互運用は `.scl`/`.kbm`/`.tun` 経由で最低限は可能。
- **[優先度]** 低。まず既存フォーマットで十分。

### C-8. 機械生成コードとテストの肥大(過剰)
- **[根拠]** 内部監査(product-review.md 2026-07 追補)。
- **[現状]** `scale.ts` に ~4,437 個の機械生成関数、低速テスト ~5 時間分(CI 除外済み)。
  カバレッジ閾値(80%)と実行範囲(実測 35.8%)の不整合が未解決。
- **[優先度]** 中(構造的負債)。新規実装で更に肥大させないことが最優先の運用方針。

---

## D. 対象外と判断したもの

- **MTS-ESP 直接統合** — C/C++ 専用ライブラリで DAW 内リアルタイム共有が目的。
  TS ライブラリからは統合不可。Ruri の静的 MTS SysEx 出力とは補完関係で、競合しない。
- **リアルタイム DAW プラグイン** — ライブラリの責務外。VST/AU 化は別プロジェクト。
- **familiarity(文化的親しみ)スコア** — 設計原則「美的判定をしない」に反するため実装しない
  (C-1 参照)。

---

## 本セッションの実装

**選定方針**: 調査の結果、Ruri の理論層(MOS・well-formed・最大均等・複合協和)は
すでに完備・公開されており、これ以上の理論関数追加は既知の「コード肥大」(C-8)を悪化させる。
そのため実装対象は「①実行可能インターフェースの欠如(C-3)」「②理論層の未公開の隙間
(MOS命名規則そのものは既存だが L/s パターン表現が欠落)」「③エコシステム標準への未対応
(C-5)」の3点に絞り、いずれも既存の型・関数を再利用するだけで完結し理論肥大を招かないものを選んだ。

### C-3: CLI バッチツール
- **`src/adapters/scala.ts`**: `sclToTuning()` を追加。`tuningToScl()` の**欠けていた逆変換**
  (ScalaScale → TuningSystem)。比の degree を厳密有理数として保持し往復で精度劣化しない。
  + 回帰テスト 5 件(`scala.test.ts`)。
- **`src/cli.ts`**: 移植可能(fs 非依存)な `runCli(argv, io)` とコマンド実装。
  `info` / `convert` / `render` / `help`。入出力は注入された `CliIo` 経由で完全に単体テスト可能。
  + テスト 14 件(`cli.test.ts`、in-memory IO で全コマンド網羅)。
- **`bin/ruri.mjs`**: 薄い Node ブートストラップ(plain ESM)。実 fs/process を `runCli` に配線。
  TypeScript ソースに `node:` 依存も `@types/node` も持ち込まず、ライブラリの
  zero-dependency / 移植性を維持。
- **`package.json`**: `bin` エントリと `files` への `bin` 追加。`README.md`: CLI 使用例セクション。
- **検証(実機ドライブ)**: 実 `.scl`(純正ペンタトニック)で `info`(386.31c=5/4等を正確表示)・
  `convert → .tun`(128鍵周波数表)・`convert → .syx`(408バイトMTSダンプ、正準サイズ)・
  `render → .wav`(RIFF/WAVE)をすべて確認。

### MOS L/s ステップパターン解析(理論層の隙間)
- **`src/core/generate.ts`**: `mosPattern()` / `tuningMosPattern()` を追加。
  xen コミュニティ標準の `5L2s`(ダイアトニック)等の命名・`LLsLLLs` 型パターンを、
  既存の `isWellFormed`(Myhill性)と対になる1ステップ層の解析として提供。
  + テスト 8 件(`generate.test.ts`)、fast-check 性質テスト込み。

### C-5: MIDI 2.0 / UMP per-note pitch アダプタ
- **`src/adapters/ump.ts`**: Pitch 7.9 属性付き Note On/Off(1/512半音 ≈ 0.195c 分解能)、
  per-note pitch bend(`bendRangeSemitones` は仕様に既定値がないため必須引数)、
  `chordToUmp`/`tuningDegreeToUmp` で既存 `Chord`/`TuningSystem` 型と直結。
  `decodeUmp`+`umpToBytes` で golden round-trip 検証(このディレクトリの CLAUDE.md 方針に準拠)。
  + テスト 17 件 — 手計算バイト列(A4 Note On = `[0x40904503, 0x80008A00]`)・
  encode→decode 恒等性・fast-check 性質テスト(往復誤差 ≤0.1c)。
- **`src/adapters/index.ts`/`CLAUDE.md`**: barrel export + UMP固有の Gotchas
  (velocity 0 は note-off ではない、bend既定感度なし 等)。
- **`README.md`**: UMP使用例 + 協和の三要素モデルとの対応関係を1行明記(C-1参照)。

### CLI ワークフローの拡充と実バグ修正(後続イテレーション)
- **`ruri gen`(生成コマンド)**: EDO・MOS・最大均等を理論から直接生成(入力ファイル不要)。
  出力形式ディスパッチを `writeTuningOutput` に共通化し `convert`/`gen` で共用。
  `edo`/`generatedTuning`/`maximallyEvenTuning` を再利用。
- **`.mid` 出力の修正(実バグ)**: 従来 `.mid` は生 MTS SysEx を書き出しており
  有効な Standard MIDI File(`MThd` ヘッダなし)ではなかった。`scaleToSmf` による
  再生可能な旋律 SMF に変更し、生 SysEx は正しい拡張子 `.syx` に限定。標準 MIDI の
  12-TET 制約で微分音が失われる場合は stderr に丸め警告。
- **量子化バグの修正(実バグ)**: `mosPattern`/`isWellFormed` の共有量子化 `ROUND` が
  1e-6 cent と `.scl` の6桁精度と同スケールだったため、往復ノイズが等分割を偽 MOS
  (19-EDO → `14L5s`・well-formed=yes)と誤報告。1e-3 cent(知覚閾の1000分の1)に粗くして修正。
- **`info` の近似JI比ヒント**: cents 表記の音程に最寄りの単純純正比を表示専用で注釈
  (≤1.0c 誤差 かつ odd-limit ≤15)。純正律・19-EDO の 6/5 等の真に純正な音程のみに付く。
- いずれも実バグ2件は**テスト緑のまま実機ドライブで発見**された点が教訓
  (`docs/model-handbook.md §3`)。

### 累積検証
全テスト **7,306 件緑**(セッション開始時 7,268 から +38)、typecheck / lint / format すべて緑。
各変更後に `npm run build` → `node bin/ruri.mjs`(info/convert/gen/render)を実 `.scl` で
ドライブして無回帰を確認。次セッション向けの作業指示は `docs/model-handbook.md`。
