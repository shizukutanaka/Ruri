# WORKFLOW.md — Ruri 開発・運用ハーネス

> 汎用CLAUDE.md(Operation Harness)を Ruri に具体化。モデルと同等にハーネスが品質を決める。

---

## 1. スプリントループ(1機能 = 1周)

```
REQ → Plan.md差分 → 設計(sig/seq) → 実装(core→adapter→shell) →
  test(unit+property+golden) → CrossReview(別セッション) →
  出力忠実度ゲート(音/MIDIを伴う機能のみ) → merge → CHANGELOG
```

- 順序固定: **core(純ロジック) → adapter(SMF/Scala/MPE/合成) → shell(web/Tauri)**。下層が緑になるまで上層に進まない
- レビュー・テスト・リファクタは**文脈を切った別セッション**(確証バイアス排除, §4.2)

## 2. Ruri固有の検証戦略

| 対象 | 検証 | 理由 |
|------|------|------|
| 変換(cents/比/MIDI/bend) | 性質テスト | 連続値・可逆性(I7) |
| バイナリ出力(SMF/MTS SysEx/.scl/.kbm/.tun) | **golden round-trip**(書込→再パース=一致) | バイト列誤りはCIで捕捉不能になりがち(I7) |
| 粗さscorer(Plomp-Levelt) | **既知極小の位置**を判定(harmonic→3/2,4/3 / ガムラン実測→実ステップ) | 非負・対称だけでは不十分 |
| 運指コスト | 単調性・制約充足(手幅/フレット幅) | 決定的・反例可能 |
| **音の正しさ** | **人間ゲート: Surge XT/DAWで実再生**(自動化不能) | CI緑 ≠ 鳴って正しい |

参照コーパス: 少数の基準和音×基準調律×基準スペクトルを固定し、全出力形式で golden 化。

## 3. .claude/ レイアウト(Ruri)

```
.claude/
├── agents/
│   ├── implementer / tester / reviewer / security   # 標準
│   ├── dsp-verifier    # 変換・エンコーダを golden + 既知極小で検証
│   └── data-curator    # 調律データの出自/ライセンス/メタ検証
├── commands/
│   ├── /plan /implement /review /test /release       # 標準
│   ├── /golden         # golden再生成(承認付き=凍結ファイル保護)
│   └── /verify-audio   # Surge XT検証チェックリスト出力(人間用)
├── skills/             # 各 Gotchas 必須
│   ├── ruri-tuning-data  # 調律追加手順(出自+ライセンス+reference_hz+spectrum)
│   ├── smf-encoder       # SMFバイト配置の罠
│   ├── scala-format      # .scl/.kbm 仕様の罠
│   ├── mpe-export        # ch割当・bend range の罠
│   └── dissonance-scorer # Plomp-Levelt 公式・数値安定の罠
├── lock/               # 排他(G5)
└── run.db              # 実行ログ(G6) / failures.log(G3)
settings.json           # hooks(下記)
CLAUDE.md               # ルート(確率的制御)
src/core/CLAUDE.md ✅    # 高リスク変換のローカルルール
src/<adapter>/CLAUDE.md  # 各バイナリ/形式アダプタに必須(バイト配置Gotchas)
```

## 4. hooks(settings.json = 決定的制御)

- **PreToolUse**: 凍結golden/署名関連の編集は `/golden`・承認なしでBLOCK(release-approvalスキル発火)
- **PostToolUse**: TS保存で `prettier + eslint`、編集後 `tsc --noEmit`
- **Stop**: `vitest run` → 結果を run.db 追記、連続失敗≥3 で failures.log + 別手戦略を強制(G3)

## 5. CIゲート(§8 + Ruri追加)

```
[ ] eslint/prettier/tsc --noEmit 警告ゼロ
[ ] vitest 緑 + カバレッジ(Phase別: 50/70/80%)
[ ] golden round-trip 全形式一致
[ ] 粗さscorer 既知極小テスト緑
[ ] gitleaks / npm audit / cargo audit (CRITICAL/HIGH ゼロ)
[ ] **バンドルサイズ予算**(single-HTML/PWA): 上限KB回帰でFAIL
[ ] Tauri 署名ビルド + クリーンインストール
[ ] (出力機能) 人間の Surge XT 検証サイン
```

## 6. データレーン(コードと分離)

調律追加 = code PR と別DoD。必須メタ: `source`(実測/理論) / `reference_hz` / `octave_ratio` / `region` / 出典URL / ライセンス / (実測なら)spectrum。CIが欠落を検出。NOTICE/attribution へ追記必須(I4/I5)。

## 7. モデル選定(§11, コスト制御)

- **Opus**: DSP/エンコーダ設計、セキュリティレビュー、アーキ分岐
- **Sonnet(既定)**: 実装・テスト・通常レビュー
- **Haiku**: CHANGELOG・整形・分類

## 8. 人間ゲート(I1, 委譲不能)

- 音の最終判断(DAW実再生)
- 調律データの文化的妥当性(出典の信頼性)
- 課金導線・リリースタグ(release-approval)
