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
  <before-step0>
  ソースファイルのディレクトリのファイル ( #{source_path} ) のそれぞれについて(1つの場合もある)、テストが十分かどうか確認してほしい。テストファイルは同じディレクトリに拡張子.test.tsで存在する。(例: something.ts について something.test.tsが存在する) もしくは、存在しない場合もある。

  テストが存在し、十分である場合は before-step1に進む。
  存在しない場合は、step0に進む。

  </before-step0>

  <step0>
  ソースファイルのディレクトリのファイル ( #{source_path} ) のそれぞれについて(1つの場合もある)、テストがなければ拡充してほしい。
  **重要** テストファイルは、__tests__ディレクトリのようなものは新たに作らず、ソースファイルと同じディレクトリに.test.tsの拡張子で追加すること。
  例: something.ts について something.test.tsを追加する
  
  以下の要素を考慮して。
  
  - ソースファイルのimport設定を確認。同じパッケージ内の別ファイルからimportしている関数は、基本的にモックするようにする。
  
  また、つぎに示すtestコマンド、lintコマンド、fmtコマンドも通るようにして。
  
  $ pnpm --filter @liam-hq/#{package_dir} test
  $ HEAVY_LINT=1 pnpm --filter @liam-hq/#{package_dir} lint
  $ pnpm --filter @liam-hq/#{package_dir} fmt

  最後に、完了したら、git commitし、適切なコミットメッセージをつけて。コミットメッセージのどこかに、"refactor:step0" を含んで。
  finishに進んで。
  </step0>
EOF
