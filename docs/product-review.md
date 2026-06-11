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
| ボイスリーディング(最小移動)コスト | 未着手(将来) |
| フレットレス楽器の連続ポジションモデル | 未着手(docs/Plan 既載) |
| ADSR等の時間エンベロープ | 未着手(将来) |
| `.tun` (AnaMark) 形式 | **実装済** (`src/adapters/tun.ts`) |
| 調律プリセット拡充(Pythagorean・歴史的調律・Bohlen-Pierce等) | 未着手 — CARE準拠の出典整備が前提 |
| A11y/i18n(shell-web) | 未着手(GOAL-AUDIT 既載) |

## 対応の優先順位判断

今回は「ライブラリとして配布可能にする」「DAW/シンセ実務で必要な出力形式を埋める」「既知バグの修正」を優先した。文化的レビューを要する調律データ拡充と UI/A11y は、既存 docs(GOAL-AUDIT/improvement-matrix)の人的ゲート方針に従い実装対象から除外した。
