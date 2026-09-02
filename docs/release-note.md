# リリース公開の手動仕上げについて(v0.2.0)

## 現在の公開状態

`ruri` v0.1.0 の完成品は **GitHub 上に公開済み**です。このリポジトリの
デフォルトブランチ(`claude/product-analysis-sonnet-x86ho5`)の head が、
テスト・ビルド・パッケージングまで検証済みの完成コードです。

検証状況(この head 時点):

- `npm run check`(typecheck + lint + format:check + 高速テスト **7,295 件**)全緑
- `npm run build` で `dist/`(ESM + `.d.ts`)を生成可能
- `npm pack --dry-run`: 143 ファイル・888 kB。`bin/ruri.mjs`・`dist/cli.js`・
  `dist/adapters/ump.js`・LICENSE・NOTICE・README を同梱(`package.json` の `files` どおり)
- CLI 実機ドライブ確認済み: `ruri info`(MOS L/s パターン表示)・
  `convert`(`.scl`→`.tun`/`.syx`/`.ump`)・`render`(`.wav`)

つまり「完成品の公開」はコードとしては達成済みで、`git clone` すればそのまま
`npm install && npm run build` でビルドでき、`ruri` CLI も動作します。

## 残る仕上げ(リポジトリオーナー権限が必要)

このセッションが push に使用した GitHub App には **タグ・Release・workflow を
作成する権限がありません**(タグ push は GitHub から HTTP 403、workflow push は
`workflows` 権限なしで拒否)。以下はオーナーが手元で1回実行するだけで完了します。

### 1. バージョンタグと GitHub Release

```
git checkout claude/product-analysis-sonnet-x86ho5
git pull
git tag -a v0.2.0 -m "Ruri v0.2.0"
git push origin v0.2.0
```

その後、GitHub の Releases UI で **v0.2.0** の Release を作成し、本文には
`CHANGELOG.md` の `[0.2.0]` 節を貼り付ける(target は上記タグ)。

### 2. CI ワークフロー(任意)

`.github/workflows/ci.yml` の適用手順は
[`docs/ci-workflow-note.md`](./ci-workflow-note.md) を参照(内容は
[`docs/ci.yml.proposed`](./ci.yml.proposed) に用意済み)。

### 3. npm 公開(任意・資格情報が必要)

npm レジストリへ出す場合のみ:

```
npm run build
npm publish        # prepublishOnly が check + build を自動実行
```

`package.json` の `exports`(`.` / `./core` / `./adapters` / `./data`)・`bin`・
`files` は公開向けに設定済み。

---

## v0.2.0 時点の検証状況(2026-07-27)

`package.json` は **0.2.0**、CHANGELOG も同版を cut 済み。オーナーは以下だけで完了する:

```
git tag -a v0.2.0 -m "Ruri v0.2.0" && git push origin v0.2.0
# Releases UI で v0.2.0 を作成し CHANGELOG の [0.2.0] 節を本文に
npm publish        # 任意。prepublishOnly が check + build を自動実行
```

確認済み(すべて実測):

- `npm run check` 全緑(typecheck / lint / format / **2,851 テスト、約9秒**)
- `vitest run --coverage` exit 0(98.73 / 95.42 / **100** / 98.34 対 閾値 95/90/98/95、**除外なし**)
- `npm audit` **脆弱性 0**(vitest 4)
- `npm pack` → 別プロジェクトへ install → `ruri` ルート・`ruri/adapters` サブパス・
  `bin` CLI(`edo` / `convert` / `gen --fit-timbre`)すべて動作
- **破壊的変更あり**: 公開APIを 1,445 → 305 に絞った。Release 本文の Breaking 節を残すこと。
