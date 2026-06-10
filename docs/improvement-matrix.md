# IMPROVEMENT-MATRIX — Ruri 10カテゴリ × 10改善点

> /loop 大規模監査。7回の調査ログ(research-arxiv/competitive/data-sourcing/ui-research/GOAL-AUDIT)+ 今回の補充検索を統合。
> 凡例: ✅実装済 / 🔜次フェーズ / 📋Issue化(スコープ外or後続) / ⚠リスク

---

## C1. 調律システム(microtonal theory)

1. ✅ cents/比の二層、比を一次保持(純正律精度)
2. ✅ `periodCents` 非1200(伸張・非オクターブ)
3. ✅ `reference_hz`/`source`/`region` メタ必須(単一正規形なし)
4. ✅ `defineTuning` 不変条件強制(昇順・period内)
5. 🔜 EDO生成ヘルパ(n-EDO を1関数で: 19/22/31/53)
6. 🔜 レギュラーテンペラメント(generator + period の mapping)= 純正律近似の体系化
7. 📋 調律間トランスポーズ/モジュレーション(共通音pivot)
8. 🔜 コンマ(syntonic/Pythagorean)を比で明示、ラティス表現
9. ⚠ 実測値の丸め精度(cents小数桁)を出典の測定分解能に合わせる(過剰精度の偽装回避)
10. 🔜 調律の差分比較(2調律のcents差ベクトル可視化用データ)

## C2. 協和・不協和モデル

1. ✅ Plomp-Levelt/Sethares 粗さ(部分音対の総和)
2. ✅ 既知極小オラクル検証(harmonic→純正音程, bell→別集合)
3. ✅ Stolzenburg harmonicity(周期性)二軸目
4. ✅ acoustic-only明示(familiarityは音響外)
5. 🔜 Vassilakis粗さモデル(振幅変調項)をオプション追加(dissonantが実装、より新しい)
6. 🔜 Hutchinson-Knopoff モデル併載(西洋三和音の古典)
7. 🔜 melodic dissonance(逐次音程の粗さ、xenboardが表示)
8. 🔜 critical band の周波数依存を明示係数化(低音域で粗さ増)
9. ⚠ 3音以上の線形加算仮定の限界を文書化(ScaleExplorer指摘=厳密でない)
10. 🔜 Euler Gradus suavitatis を第三指標に(整数比の単純さ、古典指標)

## C3. スケール/和音生成

1. ✅ MOS(生成音階)+ well-formed判定(Myhill)
2. ✅ 最大均等(Clough-Douthett)
3. ✅ 非オクターブ周期対応
4. 🔜 和音=スケール部分集合の列挙 + scorer採点ランキング
5. 🔜 イディオム非依存記述子(音程級ベクトル, GCT)実装
6. 🔜 ジンス/テトラコルド単位の合成(マカーム構築文法)
7. 📋 ラーガ遷移文法(aroha/avaroha)= melodic、後続
8. 🔜 スケールのモード回転(全回転を生成)
9. 🔜 voice-leading最小移動(2和音間の最小cents移動割当)
10. ⚠ 生成数の爆発制御(大EDOで部分集合が組合せ爆発→上限/遅延評価)

## C4. 楽器運指

1. ✅ 弦楽器グラフ(調弦/カポ/微分音フレットをパラメタ化)
2. ✅ K-best + HandProfile(個人差)
3. ✅ ギター/ベース同一モデル、ピアノ指割当
4. ✅ 決定的(同入力同出力)・全音被覆・1弦1音
5. 🔜 アイソモーフィック鍵盤レイアウト(同和音=同形, Lumatone型)
6. 🔜 メロディ運指(和音列の遷移コストA*、位置移動最小)
7. 📋 フレットレス(ウード)連続音高モデル(現フレット前提、別Issue)
8. 🔜 開放弦/ミュート/バレー検出(運指図の実用情報)
9. 🔜 箏=可動柱(13弦の調弦が曲ごと可変)モデル
10. ⚠ 生体力学コスト重みの根拠(Nakamura実測由来に寄せる、恣意回避)

## C5. 出力・DTM連携

1. ✅ SMF Type-0 自前(VLQ/golden round-trip)
2. ✅ Scala .scl 双方向(比/cents原表現保持)
3. ✅ MPE(ノート毎bend, 15音制限明示)
4. 🔜 .tun(AnaMark)書出
5. 🔜 SMF+MTS SysEx(自己完結微分音MIDI)
6. 🔜 MusicXML(記譜用、micro alterは下流が丸める旨注記)
7. 🔜 .kbm(Scalaキーマップ)完全対応
8. 🔜 Web MIDI ライブ送出(DAW直結)
9. ⚠ MTS SysEx バイト列は人間ゲート(Surge XT)必須(I7最高リスク)
10. 🔜 MIDI 2.0 / MPE 2.0 のper-note pitch(将来の高分解能)調査

## C6. 音声合成(timbre)

1. 🔜 Karplus-Strong撥弦(zero-dep, 単一オシレータ並みコストで倍音列)
2. ✅ 合成パラメタ核 `synth.ts`(detune=cents, voice生成)
3. 🔜 加算合成(spectrum層の部分音→OscillatorNode群)
4. 🔜 モーダル合成(ガムラン/ベルの非整数倍音、実測部分音)
5. ✅ スペクトル=協和scorerと合成の単一真実源
6. ⚠ voice爆発制御(和音音数×部分音数=オシレータ数、上限/pooling)
7. 🔜 KS微調律=遅延線補間(fs/N整数長の誤差をfractional delayで補正)
8. 🔜 ADSR/減衰エンベロープ(撥弦の自然減衰)
9. 🔜 実測サンプル+detuneの代替経路(合成が困難な音色)
10. 📋 微分可能/ニューラル合成(2407.05516)= 過剰、スコープ外

## C7. UI/UX

1. 🔜 アイソモーフィック六角格子鍵盤(任意調律で運指不変)
2. 🔜 協和2D曲線 + リアルタイム数値(timbre切替前面)
3. 🔜 運指図を主役に(差別化はコモディティな鍵盤/協和でなくここ)
4. 🔜 色は補助・数値/テキスト必須(A11y兼)
5. 🔜 出力DLパネル(SMF/Scala/MPE)を前面
6. 🔜 調律の出典(provenance)を常時表示(信頼性=差別化)
7. 🔜 100ms視覚応答/200ms超は進捗(CLAUDE §7)
8. 🔜 Empty State(調律未選択/和音0)を破綻なく
9. ⚠ xenboard等が鍵盤+協和を既出 → 主役を運指/出力/世界調律に寄せる
10. 🔜 視線フロー3ステップ以内(見る→比較→行動)

## C8. 世界音楽データ・民族音楽学

1. 🔜 マカーム実測(SymbTr/Cairo1932由来, measured)
2. 🔜 ガムラン実測(Surjodiningrat/Kunst/Polansky, octave伸張+spectrum)
3. 🔜 ラーガ22シュルティ(melodic, 和声化しない)
4. 🔜 provenance必須スキーマ(url/author/year/license)
5. 🔜 measured/theoretical峻別フラグ
6. ⚠ 文化的正確性=人間ゲート(誤値は信頼破壊, I1)
7. 🔜 「唯一正解でない」をデータ/UIに明記(脱植民地, Leimma思想)
8. 🔜 data-curator がメタ欠落検出(WORKFLOW)
9. 🔜 NOTICE へ attribution 集約(I4)
10. 📋 アーカイブ一括同梱せず厳選(ライセンス, リンク参照)

## C9. アクセシビリティ・国際化

1. 🔜 WCAG 2.1 AA(EAA 2025施行=法的要件、後付け不可)
2. 🔜 全インタラクティブ要素キーボード操作 + focus-visible
3. 🔜 協和/音高を色のみに依存させない(数値・テキスト併記)
4. 🔜 スクリーンリーダで運指・協和値読上げ(aria-label)
5. 🔜 コントラスト≥4.5:1(#00C4CC の前景/背景検証)
6. 🔜 フラッシュ無し(発作トリガ回避)
7. 🔜 i18n `namespace.component.key`(日本語一次→ネイティブ校正)
8. 🔜 音楽用語の多言語(度数・音名は文化依存=慎重に)
9. ⚠ 自動ツールは見落とす→手動スクリーンリーダ検証(人間)
10. 🔜 RTL(アラビア語=マカーム文化圏)レイアウト考慮

## C10. アーキテクチャ・配布・安全・テスト

1. ✅ zero runtime-dep, tsc strict, lint警告ゼロ, 91テスト/94%
2. ✅ core/adapters 分離 + ローカルCLAUDE.md(高リスク領域)
3. ✅ golden round-trip + 性質テスト + 統合テスト
4. 🔜 GitHub Actions(check+coverage+gitleaks+audit)
5. 🔜 PWA: service worker = cache-first(静的資産), HTTPS必須, manifest
6. 🔜 バンドルサイズ予算CIゲート(オフライン哲学維持)
7. 🔜 Tauri署名(Win/macOS/Linux+Sigstore)
8. 🔜 SBOM生成 + サプライチェーン(dep最小=攻撃面小, MCP審査)
9. 🔜 CSP厳格(XSS/clickjacking防止, PWAは特に)
10. 🔜 iOS Safari のSWキャッシュ制限を考慮(プラットフォーム差)

---

## 優先実行順(ゴール逆算, GOAL-AUDIT準拠)

1. **C8 世界調律データ + ローダ + provenance検証** ← 差別化の核、即着手可
2. **C6 Karplus-Strong/加算合成 + C7 最小UI** ← 鳴らす+見せる(人間ゲート加速)
3. **C5 出力完成**(.tun/MTS/MusicXML/WebMIDI)
4. **C10 CI/PWA/配布** + **C9 A11y**(法的要件、UIと同時実装)
5. C1-C4 の 🔜 拡張(EDO/voice-leading/アイソモ鍵盤)
6. 📋 群(フレットレス/ラーガ文法/ニューラル合成)は後続Issue

## 横断リスク(再掲・統合)

- ⚠ voice爆発(C6-6): オシレータ上限を設計初期に
- ⚠ 文化的正確性(C8-6): measured値は人間ゲート、唯一正解と称さない
- ⚠ スコープ膨張: 採譜/楽曲生成/ニューラル合成へ流れない(I3)
- ⚠ 3音協和の線形加算仮定(C2-9): 限界を文書化、過信しない
- ⚠ A11y後付け不可(C9-1): UI実装と同時、EAA法的要件
