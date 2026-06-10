# Data Sourcing — 世界の調律・楽器プリセット (Ruri)

> 改善点#3(差別化の核=データが空)の出典確定。実測値は出典/ライセンス必須(I4/I5)。

## 大原則(競合+研究から確定)

- **調律に単一正解なし**: マカームもガムランも地域/合奏/流派で実測が割れる。Ruriは「**出典付きの一具体例**」として収録し、唯一の真実と称さない(脱植民地スタンス)。
- **理論モデル ≠ 実践**: 24-TET/53-TET 近似は便宜。実測ヒストグラム由来値を `source: 'measured'`、理論値を `source: 'theoretical'` で峻別。両方を別エントリで持つ。
- **データは少数厳選キュレーション**: アーカイブ一括同梱せず、各値に provenance(出典URL/著者/年)。

## 文化倫理 — CARE/OCAP原則(B1調査で確定)

> 伝統音楽は著作権の外(世代間所有・著作者不明)にあり、**合法でも非倫理**がありうる(extractivism)。

- **CARE**: Collective benefit(出自文化に資する) / Authority to control(コミュニティの統制権) / Responsibility / Ethics
- **OCAP**: Ownership / Control / Access / Possession — 提供元コミュニティが知識を統制
- 実装要件:
  - データに `cultural_context` / `community` / `region` を必須化(**数値だけ抜き出さない**=extractivism回避)
  - 「一具体例であり唯一正解でない」をデータ・UIに明記(普遍主義の否定)
  - 出自元へのリンク・クレジット・送客(reciprocity)
  - 訂正/削除要請の窓口(Issue/連絡先)
  - 西洋理論用語(度数/和音)で非西洋音楽を記述する歪みを最小化、原語名称を併記
  - 録音由来の実測値は録音者/アーカイブのライセンス確認(IASA倫理原則)
  - 同意確認: 現状は数値のみ=低リスク。将来サンプル音源を扱う場合は演奏者同意を確認

## 出典マップ

### マカーム(トルコ/アラブ)
| データ | 所在 | 扱い |
|--------|------|------|
| SymbTr corpus(2200曲, MIDI/symbolic) | Bozkurt/Karaosmanoğlu, オープン | 実測ヒストグラムのピーク=`measured` 値の根拠 |
| Cairo 1932 Congress dataset | arxiv 2506.14503, オープン研究データ | アラブ・マカームの歴史的実測 |
| 53-TET Holderian comma 近似 | Arel-Ezgi-Uzdilek(AEU)体系 | `theoretical`。実践と乖離する旨を注記 |
| Yarman 79音 | Yarman 2008 博士論文 | AEUが捉えない中立2度の代替理論。出典明記で任意収録 |
| Uşşak 実測(例) | 181/294/498/702/792/996/1200 cents | 一具体例として収録、durak基準 |

> 注: AEU(24音ピタゴラス系)は「中立2度(middle second)」を捉えられず実践と非整合、という批判が計算機分析で確立。Ruriは measured を一級に。

### ガムラン(ジャワ/スンダ)
| データ | 所在 | 扱い |
|--------|------|------|
| Surjodiningrat 1972(27ガムラン分析) | ペロッグ≈9-EDO部分集合の統計的選好 | `theoretical` 近似 |
| Jaap Kunst 実測(8スレンドロ) | Polansky "Interval Sizes in Javanese Slendro" | `measured`、地域別に複数エントリ |
| Polansky 3対のスレンドロ/ペロッグ | tumbuk(共有音)概念込み | `measured` |
| Ableton Sundanese gamelan | tuning.ableton.com、音声実測(Tugu=472Hz等) | `measured` + 実測スペクトル源の候補 |

> ガムラン必須: `octave_ratio` を伸張(実測は2/1より10〜20cent広い場合あり)、`source: measured`、`region/ensemble` 明記、**非整数倍音スペクトル**を spectrum層に併載(協和scorerの前提)。スレンドロ=オクターブ等価の概念が希薄な点も注記。

### ラーガ(インド古典)— 第2回調査済
- 22シュルティ(ShrutiSense 2508.01498)。Carnatic=純正律寄り、Hindustani=平均律寄り(Serrà 2011 ヒストグラム分析)。旋律的旋法として収録、和声化しない。

## 楽器プリセット(非西洋弦)
| 楽器 | 調弦(一例) | フレット | 備考 |
|------|-----------|---------|------|
| ウード | C2 F2 A2 D3 G3 C4(可変) | フレットレス | 連続音高→微分音自由、運指は位置近似 |
| サズ/バーラマ | 可変(D A D 等) | 微分音フレット | `fretStepCents` 非100、コンマフレット |
| 箏(koto) | 平調子等(可動柱) | 柱=可変 | 13弦、調弦が曲ごと可変 |
| シタール | 主弦+共鳴弦 | 可動フレット | 共鳴弦はドローン、運指は主弦のみ |

> 既存 `instrument.ts` の `openStringsCents`/`fretStepCents`/`fretCount` で表現可。フレットレス(ウード)は fret 連続=別モデル要(後続Issue)。

## 実装方針(次フェーズ)

- `src/data/tunings/*.json`: 各調律= id/name/source/reference_hz/octave_ratio/region/degrees(cents or ratio)/provenance(url,author,year,license)/spectrum?
- `src/data/instruments/*.json`: 同様に provenance 付き
- **data-curator** がメタ欠落を検出(WORKFLOW.md)。NOTICE に attribution 集約
- 各データに性質テスト: degrees昇順・period内・provenance必須・measured値は出典URL必須
- 同梱は public domain / オープンライセンス値のみ。商用不可データは参照(リンク)に留める
