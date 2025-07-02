ソースファイルのディレクトリのファイル ( @/frontend/internal-packages/schema-bench/src/workspace/evaluation/*/*.ts ) のそれぞれについて(1つの場合もある)、テストがなければ拡充してほしい。

以下の要素を考慮して。

- ソースファイルのimport設定を確認。同じパッケージ内の別ファイルからimportしている関数は、基本的にモックするようにする。

また、つぎに示すtestコマンド、lintコマンド、fmtコマンドも通るようにして。

$ pnpm --filter @liam-hq/schema-bench test
$ HEAVY_LINT=1 pnpm --filter @liam-hq/schema-bench lint
$ pnpm --filter @liam-hq/schema-bench fmt

