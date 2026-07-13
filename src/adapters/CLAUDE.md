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

## 未実装(後続)

- MTS SysEx 同梱(微分音MIDI): SysExバイト列は別Gotchasを追記してから実装。
- テンポ・拍子メタイベント(現状ppqのみ、テンポ未指定=120bpm既定)。

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
- **.kbm(任意)**: キーボードマッピング。最小実装は無し=線形(MIDIノート順=degree順)で可。完全実装は後続。
- round-trip: cents行は書出時に小数点必須(`1200.0`)、比行は`n/d`維持。**比→cents→比は不可逆**ゆえ、取込時の原表現(比/cents)を保持して書出す。

