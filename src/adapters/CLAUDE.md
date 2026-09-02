# src/adapters — CLAUDE.md (バイナリ出力 = I7最高リスク)

> バイト列の誤りは型検査をすり抜ける。全アダプタは **golden round-trip**(encode→decode=一致)で検証必須。

## SMF (smf.ts) Gotchas

- **VLQ(可変長量)**: デルタタイムは7bit/byte、最終以外はMSB=1。`encodeVlq(0)=[0x00]`。負数・非整数は即throw。
- **デルタタイム=絶対でなく差分**。イベントは絶対tickでソート後に「前イベントとの差」へ変換。
- **同tickの順序**: note-off を note-on より先に(同音の連続でstuck note回避)。`order` フィールドで担保。
- **ヘッダ**: `MThd` + 長さ6(u32) + format(u16) + ntrks(u16) + division(u16)。Type0=format 0, ntrks 1。
- **チャンク長**: `MTrk` 直後の u32 はトラック**本文バイト数**(end-of-track含む、長さフィールド自身は含まない)。
- **end of track**: `00 FF 2F 00` 必須。欠落するとプレイヤが読めない。
- **running status**: デコーダはstatus省略時に直前statusを再利用。エンコーダは常にstatus明記(単純・安全)。
- 範囲: note/velocity 0..127, channel 0..15。範囲外は即throw(fail fast)。
- **同(channel,note)の時間重複は表現不能**: MIDIは同一ch・同一ノートの同時発音を区別できない。重なる2音を渡すと round-trip で1音に統合される(仕様)。呼び出し側が重複を避けるか、別チャンネルへ。golden testは「表現可能subset」で検証する。

## 検証

- golden round-trip: `decodeSmf(encodeSmf(notes))` が note/start/duration/channel で一致。
- 既知バイト列: 単音のSMFを手計算バイトと突合(ヘッダ + MTrk長 + VLQ)。
- 実機検証(人間ゲート): 生成 .mid を DAW/Surge XT で再生して鳴ることを確認(CIでは不能)。

## SMF デコーダの範囲(2026-08 に拡張)

- 扱う: note on/off・running status(meta/System で打ち切り)・Program Change / Channel Pressure
  (**データ1バイト**)・Control Change / Pitch Bend / Poly Aftertouch(2バイト)・meta イベント。
- **推測しない**: SysEx / System Common(可変長)と先行 status の無い running status は `RangeError`。
  バイト長を1つ誤ると例外にならず**以降の音符を黙って失う**(実際に Program Change で起きていた)。
- MTS SysEx は SMF に**同梱しない**(独立アダプタ `mts.ts`)。テンポ・拍子メタは書かない(ppq のみ)。

## MTS (mts.ts) Gotchas

- 408 バイト固定: `F0 7E dev 08 01 prog` + 名前16 + 128鍵×3(`xx yy zz` = 半音 + 14bit 分数)+ checksum + `F7`。
- **checksum = XOR(bytes[1..405]) & 0x7F** がこの形式唯一の整合性検査。`decodeMts` は不一致で throw する
  — 検証しなければ1ビット化けたダンプが「もっともらしい調律」に復号される。
- `freqToMtsKey` の上限 `{127, 16383}` は `7F 7F 7F` = 仕様上「変更なし」の番兵と衝突。MIDI 0..127 内に収めること。

## UMP / MIDI 2.0 (ump.ts) Gotchas

- **64-bit Channel Voice (MT=0x4)**: word0 = `[MT:4][group:4][opcode:4][channel:4][note:8][attrType:8]`、word1 はメッセージ依存。ワードは 32-bit 単位、バイト直列化は big-endian(`umpToBytes`)。
- **Pitch 7.9 (attrType=0x03)**: word1 = `[velocity:16][note:7|fraction:9]`。分数単位 = 1/512 半音 ≈ 0.195c。**note index(識別子)と Pitch 7.9(実音高)は別物** — note-off は index で対合し、音高は属性が決める。
- **velocity は 16-bit**。MIDI 1.0 と違い **velocity 0 ≠ note-off**(専用 opcode 0x8 を使う)。
- **per-note pitch bend (opcode 0x6)**: word1 = 32-bit unsigned bipolar、センター 0x80000000。**感度のスペック既定値は存在しない**(registered per-note controller で交渉)→ `bendRangeSemitones` は必須引数にしてある。既定値を仮定して埋めないこと。
- 正側フルスケールは 0xFFFFFFFF で飽和(center + 0x7FFFFFFF)。負側最小は 0x00000001(bipolar 非対称)。
- 丸め: freq→Pitch7.9 は最近接丸め+桁上がり(fraction 512 → note+1)。範囲外は [0/0, 127/511] へクランプ。往復誤差上限 ≈ 0.0977c(性質テストで 0.1c を保証)。

## Scala (.scl / .kbm) Gotchas

- **.scl 構造**: `!` 始まりはコメント。最初の非コメント行=説明文(空でも1行占有)。次=音程数(degree count)。以降が音程行。
- **音程数 = degree数**(基準1/1は**含まない**)。最終行が通常オクターブ(`2/1` or `1200.0`)。実音高数 = count、1/1足すと count+1。
- **cents判定 = 小数点の有無**。`701.955`(小数点あり)=cents。`3/2` or `3`(小数点なし)=比。整数単独 `2` は比 2/1。**この判定を取り違えると全曲が壊れる**。
- **比のcents化**: `n/d` → 1200·log2(n/d)。`n`単独 → 1200·log2(n)。
- 行頭末空白・CRLF・タブを許容(trim)。負cents/ゼロ比は不正(throw)。
- **.kbm(任意)**: `parseKbm` + マッピング適用を実装済み(size 0 = 線形)。`octaveDegree` / mapping の
  度数が scale 長を超えると `RangeError`。
- round-trip: cents行は書出時に小数点必須(`1200.0`)、比行は`n/d`維持。**比→cents→比は不可逆**ゆえ、取込時の原表現(比/cents)を保持して書出す。

