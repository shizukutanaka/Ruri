# CI ワークフロー更新の手動適用について

このブランチでは `.github/workflows/ci.yml` を更新した(Node 20/22 matrix 化、`npm run build` とdist ESM スモークテストの追加)が、push に使用した GitHub App に `workflows` 権限がないため、ワークフローファイル自体はコミットに含められなかった。

更新後の内容は [`docs/ci.yml.proposed`](./ci.yml.proposed) に置いてある。マージ時に以下を手動で実行すること:

```
cp docs/ci.yml.proposed .github/workflows/ci.yml
git add .github/workflows/ci.yml
git commit -m "ci: node 20/22 matrix + build/dist smoke test"
```

変更点(元の ci.yml との差分):

- `check` ジョブに `strategy.matrix.node: [20, 22]` を追加し、`node-version: ${{ matrix.node }}` に変更
- `Build (dist ESM + d.ts)` ステップ(`npm run build`)を追加
- `Dist smoke test` ステップ(dist の Node ESM 解決と主要 export の存在確認)を追加

## 適用前の注意(2026-07 追記)

このワークフローは `npm run coverage` を実行する。**2026-07 以前はこれが必ず失敗した** —
閾値80%に対し実測約36%だったため。原因は閾値ではなく分母で、12.8万行の機械生成実装を
数えていた。現在は生成実装を coverage.exclude に入れ、閾値を 95/90/98/95 に**引き上げた**
うえで実測 98.18/94.58/100/98.18 で通過する(`vitest run --coverage` が exit 0)。
したがってこの workflow はそのまま適用してよい。
