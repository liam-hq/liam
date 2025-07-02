#!/usr/bin/env ruby

source_path = ARGV[0]
unless source_path
  puts 'one argument <source_path> needed'
  abort
end
if source_path.start_with?('/')
  puts 'do not specify absolute path'
  abort
end
if !source_path.include?('frontend/')
  puts 'not supported other than frotnend directory for now'
  abort
end

package_dir = source_path.split('frontend/')[1].split('/')[1]
if !package_dir
  puts 'unexpected. abort'
  abort
end

puts <<~EOF
  <before-step3>

  ソースファイル ( #{source_path} ) のテストファイル  を確認する。
  ソースファイルのimport設定を確認。同じパッケージ内の別ファイルからimportしている関数を、基本的にモックしているか?

  していなければ、step3に進む
  していれば、finishに進む

  </before-step3>

  <step3>
  ソースファイル ( #{source_path} ) のテストファイル  を、以下の要素を考慮して短くリファクタリングして書き直して。

  **重要** テストファイルは、__tests__ディレクトリのようなものは新たに作らず、ソースファイルと同じディレクトリに.test.tsの拡張子で追加すること。
  例: something.ts について something.test.tsを追加する

  要素:
  - ソースファイルのimport設定を再確認。同じパッケージ内の別ファイルからimportしている関数は、基本的にモックするようにする。

  また、つぎに示すtestコマンド、lintコマンド、fmtコマンドも通るようにして。

  lintは厳し目の設定にしてあるので注意。(ただしtestファイルはそこまで厳しくない)

  $ pnpm --filter @liam-hq/#{package_dir} test
  $ HEAVY_LINT=1 pnpm --filter @liam-hq/#{package_dir} lint
  $ pnpm --filter @liam-hq/#{package_dir} fmt

  最後に、完了したら、git commitし、適切なコミットメッセージをつけて。コミットメッセージのどこかに、"refactor:step3" を含んで。
  finishに進んで。
  </step3>
EOF
