# Ruri v0.1.0 プロダクトレビュー(長所・短所・改善点)

外部レビュー(2026-06)。コードベース全体・テスト・配布設定・既存docsの監査に基づく。

## 長所

- **cents/比の二層表現**: 純正律は厳密有理数(GCD既約)を一次保持し cents は導出。往復変換での精度劣化がない。`Pitch`/`ScalaDegree` の判別共用体で表現形式を保存したままシリアライズ可能。
- **出典必須のデータモデル**: 全プリセットに `Provenance`(出典+ライセンス)を強制。非西洋実測調律には文化的文脈を要求し、CARE/OCAP 原則を実装レベルで担保(`src/data/tuning-data.ts`)。
- **非オクターブ周期の一次対応**: ガムランのストレッチオクターブ等を `octave_ratio`/period cents として正面から扱う。`defineTuning` の fail-fast 不変条件検査。
- **テスト品質**: 120テスト・カバレッジ約98%。fast-check による property-based テスト(MPE往復・SMFゴールデン往復・比の可換性)、既知極小オラクル(協和曲線の極小が純正音程に一致)、モジュール横断の整合性検査。
- **アダプタの正確さ**: SMF Type-0 はバイト厳密な往復、Scala `.scl` は cents/比の原表現を保存、MPE は14bitピッチベンドの正しいクランプ。
- **アルゴリズムの正確さ**: Plomp-Levelt/Sethares 定数、Stolzenburg 連分数近似、Karplus-Strong の分数遅延(マイクロトーナル対応)、Clough-Douthett 最大均等式。
- **zero runtime-dependency** / tsc strict / eslint 警告ゼロ / 決定的合成(シード付きPRNG)。

## 短所

### バグ
1. **`localMinima()` の下降平坦部誤検出** (`src/core/dissonance.ts`): `cur < prev && cur <= next` のため `[3,1,1,0]` のような下降途中の平坦部先頭を極小と誤報告。→ **修正済**(平坦部は両側の異なる値より厳密に低い場合のみ先頭indexで1回報告 + 回帰/プロパティテスト)。
2. **piano運指の単一音エッジケース** (`src/core/piano.ts`): `notes.length - 1` を分母とする指割当のガードがインラインで脆弱・未テスト。→ **修正済**(明示分岐 + 回帰テスト)。

### 配布(最重要)
3. **npm から利用不能**: `main` が `src/core/index.ts`(TSソース)直指しで、ビルド工程・`exports` map・`types`・`files` が皆無。`npm install ruri` しても import できない。→ **修正済**(`tsconfig.build.json` で dist に ESM+d.ts を emit、exports map、`prepublishOnly`、CIにビルド+ESM解決スモークテスト追加)。
4. **CI が Node 20 単一**・ビルド検証なし。→ **修正済**(Node 20/22 matrix + build/smoke ステップ)。

### ドキュメント
5. README に使用例・API例が皆無(モジュール表のみ)。→ **修正済**(Usage セクション追加)。

## 改善点(機能ギャップ)

| 項目 | 状態 |
|------|------|
| EDO/n-TET 生成ヘルパ(`edo(n)`) | **実装済** (`src/core/tuning.ts`) |
| MTS (MIDI Tuning Standard) SysEx バルクダンプ出力 — VST/ハードシンセ連携の事実上の標準 | **実装済** (`src/adapters/mts.ts`) |
| Scala `.kbm` キーボードマッピング(parse/write/周波数解決) | **実装済** (`src/adapters/kbm.ts`) |
| トップレベルエントリポイント `src/index.ts` | **実装済** |
| Regular temperament(生成音程ベース、ミーントーン・ピタゴラス) | **実装済** (`src/core/temperament.ts`) |
| 和音列挙+協和ランキングの自動化(`rankChords`) | **実装済** (`src/core/chord-search.ts`) |
| ボイスリーディング(最小移動)コスト | **実装済** (`src/core/voice-leading.ts`) |
| フレットレス楽器の連続ポジションモデル | **実装済** (`src/core/fretless.ts`) |
| ADSR等の時間エンベロープ | **実装済** (`src/core/envelope.ts`) |
| `.tun` (AnaMark) 形式 | **実装済** (`src/adapters/tun.ts`) |
| 調律プリセット拡充(Pythagorean・歴史的調律・Bohlen-Pierce等) | 未着手 — CARE準拠の出典整備が前提 |
| A11y/i18n(shell-web) | 未着手(GOAL-AUDIT 既載) |

## 対応の優先順位判断(2026-06時点)

今回は「ライブラリとして配布可能にする」「DAW/シンセ実務で必要な出力形式を埋める」「既知バグの修正」を優先した。文化的レビューを要する調律データ拡充と UI/A11y は、既存 docs(GOAL-AUDIT/improvement-matrix)の人的ゲート方針に従い実装対象から除外した。

---

# 追補レビュー(2026-07): CI健全性と過剰/不足の再選別

`scale.ts`/`presets.ts` は機械的テンプレート生成により肥大化し(`tuningFamilySocratic*`/`Ambassador*` 系ブリッジ関数群、計 ~4,437個)、テストスイート(`scale.test.ts` 80,712行・11,536テスト、`presets.test.ts` 46,318行・6,520テスト)がこの環境で一度も完走したことがなかった。これは「テスト緑=品質担保」という前提そのものを無効化する、最も深刻な構造的負債だった。今回、実測時間ベースでテストを高速/低速に分割し完走を実現、その結果として初めて可視化された不具合と、新たな過不足を再選別する。

## 過剰(Excess / 肥大化)

1. **`scale.ts` 本体 ~77,600行**: ~4,437個の機械生成"family"関数(`tuningFamilySocratic*`/`Ambassador*`、361個のRound系スケールマッチャー)が大半を占める。対外的には緩和済み(`src/core/index.ts`/`src/data/index.ts` のバレルで公開APIから隠蔽、2回の機械的統合で重複ロジックを共有ヘルパに集約)が、ファイル自体の生の行数は依然として巨大で人間による走査が困難。
2. **テストファイルも同様に肥大化**: `scale.test.ts`(80K行超)・`presets.test.ts`(46K行超)。実測300ms/ブロック閾値で高速(`scale.test.ts`=5,159テスト・~22秒、`presets.test.ts`=615テスト・~12秒)と低速(`*-generated.test.ts`=6,377+5,905テスト、累計~5時間+~71分)に分割し `npm test` を初めて実用的な速度(~113秒・7,249テスト)にした。低速ファイルはCIから除外(`npm run test:generated` で手動実行)。
3. **矛盾するテストブロックの重複執筆**: 同一関数 `scaleReflectionSymmetry` に対し `PPPP1`(空配列→1を期待)と `YY1`(空配列→0を期待)が独立に矛盾する契約を主張していた実例を確認。機械生成が複数回・相互チェックなしに行われた構造的品質負債の証拠。
4. **カバレッジ閾値とソース実行範囲の不整合(未解決)**: `vitest.config.ts` の coverage `include` はソース全行を対象とするが、デフォルトの高速テストのみでは生成関数群の大半を実行しないため、`npm run coverage` は完走はするが80%閾値を全指標で下回る(Statements 35.8%, Functions 34.45%)。従来はテスト自体が完走しなかったため、このゲートは合否判定にすら到達していなかった可能性が高い(=元々機能していなかった)。対応方針は保留中(ユーザー確認待ち)。

## 不足(Deficiency / 欠落)

1. **CLIバッチ書き出しツールなし** → **解消済**(2026-07外部リサーチ追補で実装。`ruri info/convert/render` を `bin/ruri.mjs` + 移植可能な `src/cli.ts` として追加、`.scl`→`.tun`/`.syx`/`.wav` 変換・レンダリング。詳細は `docs/research-2026-07.md`)。
2. **新規アダプタのドキュメント薄い** → **一部解消**(READMEにCLIセクション追加)。MTS・`.kbm`・`.tun`・`edo()` はJSDocレベルでは整備済み。
3. **セキュリティ監査が実質非ブロッキング**: CI (`ci.yml`) の `npm audit --audit-level=high || true` は `|| true` により失敗を握りつぶす設定になっており、高深刻度脆弱性が検出されてもCIは赤くならない。
4. **未公開・v0.1.0のまま**: CHANGELOGは全項目が `Unreleased` のまま。semverタグ切りやnpm publish の形跡なし。
5. **パフォーマンス回帰の監視なし**: `tuningFamilySocratic*`/`Ambassador*` 系は1テストあたり2〜27秒かかるものが多数あるが、これを追跡するベンチマーク/回帰検出の仕組みがない。

## 今回修正した具体的不具合(2026-07)

1-3. `scaleFifthQualityScore`/`SixthQualityScore`/`SeventhQualityScore`: 区間折り畳み `Math.min(d,1200-d)` が対象区間(700c以上)を構造的に到達不能にしていた。
4-6. `scaleRegisterBalanceV2`/`HighRegisterRatio`/`LowRegisterRatio`: 「レジスタ」判定がピッチ集合自身のmin/max幅相対だったため高低を区別不能。
7. `scalePeriodicity`: 自己一致(`c % period`)により全候補が恒常的にパス。
8. `scaleDominantPresence`: V根音なしで孤立した導7度音を「支配的」と誤判定。
9-10. `scaleGravitationalCenter`/`BalancePoint`: 円環上のピッチクラスに単純線形平均を使用(数学的に無意味)。円環平均に修正。
11. `scaleIntervalDensityPeak`: 半開区間 `[0,200)` のビン分類が境界値200cを誤分類。
12-14. `scaleReflectionSymmetry`/`TranslationSymmetry`/`InversionSymmetry`: 空/単音エッジケースの契約矛盾(上記「過剰」3参照)。数学的に自然な計算(空→0、自己対称な単音→1)に統一。
15. `tuningFamilySocraticRadarCompetitionIndexMean`: 空リストで `1 - 0 = 1` を返す(本来0が正しい)、退化ケース未ガード。
16. `voiceLeadingDistance`: 5音以上の和音で使うsorted-matching分岐が、計算した `sortedA` を使わず元の未ソート配列と比較していた(実質未テスト・未発見のバグ)。
17. `scale.test.ts` 側のフィクスチャ不備 10件(トニック抜け・到達不能な閾値等)。

Lintエラーは41件(すべて既存負債)→0件。Prettierフォーマット崩れ5ファイル→0件。`npm run check`(typecheck+lint+format:check+test)がこのセッションで初めて全緑化。
