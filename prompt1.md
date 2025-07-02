@/frontend/internal-packages/schema-bench/src/workspace/evaluation/evaluation.ts 挙動を変えずに、以下のlintとtestが通るようにリファクタリングして。

lintは厳し目の設定にしてあるので注意。

また、最後に示すfmtコマンドも通るようにして。

ファイル分割等の仕様については、 @/directory-refactoring-guide.md を参考にして。

$ pnpm --filter @liam-hq/schema-bench test
$ HEAVY_LINT=1 pnpm --filter @liam-hq/schema-bench lint

fmtには、以下を使って。

$ pnpm --filter @liam-hq/schema-bench fmt

