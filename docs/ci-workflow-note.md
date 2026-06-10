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
