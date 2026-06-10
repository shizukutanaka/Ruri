# Competitive Analysis — Ruri (流離)

> 同種ソフト調査(2026-05)。市場の空白とRuriの差別化を確定。

## 競合マップ

| ツール | 強み | Ruriと被る | Ruriに無い/弱い | 区分 |
|--------|------|-----------|----------------|------|
| **Scale Workshop** (xenharmonic-devs, OSS) | 微分音調律の事実上標準。Scala等多形式I/O、生成器、ブラウザ試聴、リンク共有、VSTエクスポート | 調律生成・cents/比・Scala出力・Web試聴 | **和音/運指なし**、楽器運指なし、協和scorerなし | 調律エディタ |
| **Leimma + Apotome** (Khyam Allami/Counterpoint) | 脱植民地的設計思想、非西洋調律の探索・生成音楽、文化バイアス排除 | 非西洋調律一級・反12-TET思想 | コード辞書/運指/DTMファイル出力なし(生成音楽寄り) | 調律探索+生成音楽 |
| **Chord.Rocks** | guitar/piano/bass/uke/violin/mandolin、複数ポジション、カポ、カスタム調弦、左手 | 多楽器運指・カポ・カスタム調弦 | **12-TET固定**、微分音不可、協和scorerなし、世界の調律なし | コード/スケール辞書 |
| **GtrLib / D'Chords / Musicca / oolimo** | 大量コードDB、運指図、音再生、左手 | 運指図・複数ポジション | 12-TET固定、ギター中心、微分音/世界調律なし | コード辞書 |
| **Chordify** | 楽曲→コード自動採譜、演奏支援 | (領域外) | 採譜特化、調律/運指生成でない | 採譜/学習 |
| **dissonant (PyPI) / Sethares calculators** | Plomp-Levelt/Sethares粗さ、非整数倍音、複数モデル | **粗さscorer・timbre協和・既知極小** | ライブラリ/研究用、和音DBや運指やDTM出力なし、Python | 協和計算 |

## 市場の空白(= Ruriの差別化)

**誰も束ねていない交差点を Ruri が占める:**

1. **「世界調律 × 多楽器運指 × DTM出力」の統合が存在しない**
   - Scale Workshop = 調律はできるが運指/コードなし
   - Chord.Rocks = 多楽器運指はできるが12-TET固定・世界調律なし
   - → **微分音調律で、その楽器の運指まで出して、DAWへ出力**するツールは無い

2. **timbre依存協和を実用ツールに組み込んだ例が無い**
   - Sethares計算機/dissonantは研究・可視化止まり。コード辞書/運指と結合していない
   - → 「この楽器(スペクトル)でこの和音は協和か」を**運指可否と同時に**出すのはRuri独自

3. **非西洋楽器の運指(ウード/箏/シタール等)**
   - 既存運指ツールは12-TET西洋楽器(guitar/piano/bass/uke)のみ
   - → Ruriの `fretStepCents`/`openStringsCents` パラメタ化は微分音フレット・非標準弦に既に対応済

## 改善点 → Plan.md 反映

| # | 改善点 | 根拠 |
|---|--------|------|
| 1 | **Scala/.tun 完全I/O互換を必達**(取込+書出) | Scale Workshopが事実上標準。相互運用できないと孤立。既存資産の取込口になる |
| 2 | **「協和×演奏可能性」同時提示をUIの核に** | 競合が誰も束ねていない唯一の交差点。和音選択時に粗さ+harmonicity+運指可否を一画面 |
| 3 | **リンク共有 + VST/MTS-ESPエクスポート** | Scale Workshopの普及機能。生成した調律/コードを共有・DAW直結 |
| 4 | **左手モード + 複数ポジション表示** | コード辞書群の標準機能(Chord.Rocks/GtrLib)。運指の必須UX |
| 5 | **非西洋弦楽器プリセット**(ウード/サズ/箏 等、実測調弦+微分音フレット) | 既存運指ツールの空白。Ruriのパラメタ化で低コスト実装可 |
| 6 | **脱植民地的スタンスを明文化**(Leimma思想) | 「12-TETを特権化しない」をREADME/UX原則に。既にacoustic-only scorerで非西洋尊重済 |
| 7 | (非機能) **採譜・楽曲生成はやらない**(Chordify/Apotome領域) | スコープ膨張回避(I3)。Ruriは「楽器の音を作りDTMへ出す」基盤に集中 |

## ポジショニング一文

> 「Scale Workshop の調律自由度 × Chord.Rocks の多楽器運指 × Sethares の timbre 協和」を、
> 一つのオフライン無料ツールで、DAW 出力まで繋ぐ。— 既存に無い交差点。
