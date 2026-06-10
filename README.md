# Ruri (流離)

World tuning / scale / chord backbone for DTM output. 12-TET から非12平均律(マカーム・ラーガ・ガムラン等)までを統一表現し、DTM へ出力する。無料・MIT。

## 状態

Phase 0-2 のコア完成。`src/core`(調律・生成・協和・運指・合成)+ `src/adapters`(SMF/Scala/MPE/WAV)+ `src/data`(出典付き調律)+ `shell-web`(デモUI)。120テスト、カバレッジ約98%、zero runtime-dep。Pre-1.0 ゆえ API は変わりうる。

## リポジトリ構成

```
src/core/        調律・cents/比・生成(MOS/最大均等)・協和(粗さ+harmonicity)・運指・合成
src/adapters/    出力: SMF(.mid) / Scala(.scl) / MPE / WAV
src/data/        出典付き調律プリセット + provenance/CARE検証ローダ
shell-web/       単一HTMLデモUI(オフライン)
docs/            設計・調査記録(Plan / WORKFLOW / research / 競合分析 / データ出典 / 監査)
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

## ライセンス

MIT。調律データを追加する際は出典・ライセンスを明記(同梱データは個別表記)。
