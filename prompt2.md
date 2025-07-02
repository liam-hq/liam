ソースファイル ( @/frontend/internal-packages/schema-bench/src/workspace/evaluation/evaluation.ts ) のテストファイル  を、以下の要素を考慮して短くリファクタリングして書き直して。

**重要** テストファイルは、__tests__ディレクトリのようなものは新たに作らず、ソースファイルと同じディレクトリに.test.tsの拡張子で追加すること。
例: something.ts について something.test.tsを追加する

要素:
- ソースファイルのimport設定を確認。同じパッケージ内の別ファイルからimportしている関数は、基本的にモックするようにする。

また、つぎに示すtestコマンド、lintコマンド、fmtコマンドも通るようにして。

lintは厳し目の設定にしてあるので注意。(ただしtestファイルはそこまで厳しくない)

$ pnpm --filter @liam-hq/schema-bench test
$ HEAVY_LINT=1 pnpm --filter @liam-hq/schema-bench lint
$ pnpm --filter @liam-hq/schema-bench fmt

