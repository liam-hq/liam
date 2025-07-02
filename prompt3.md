ソースファイルのディレクトリのファイル ( @/frontend/internal-packages/schema-bench/src/workspace/evaluation/*/*.ts ) のそれぞれについて、テストがなければ拡充してほしい。

以下の要素を考慮して。

- ソースファイルのimport設定を確認。同じパッケージ内の別ファイルからimportしている関数は、基本的にモックするようにする。

また、つぎに示すtestコマンド、lintコマンド、fmtコマンドも通るようにして。

lintは厳し目の設定にしてあるので注意。(ただしtestファイルはそこまで厳しくない)

ファイル分割等の仕様については、 @/directory-refactoring-guide.md を参考にして。

$ pnpm --filter @liam-hq/schema-bench test
$ pnpm --filter @liam-hq/schema-bench lint
$ pnpm --filter @liam-hq/schema-bench fmt

