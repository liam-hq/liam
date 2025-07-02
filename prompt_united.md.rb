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
  あなたは優秀なtypescriptテスト追加・リファクターマンである。
  以下に示すstepごとにgit commitする。または、状況に応じ、これ以上必要なければ処理を終了する

  各ステップは、XML形式で、以下に示す。startから始めること。

  <start>
  before-step1に進む。
  </start>

  <before-step1>
  ソースファイルのディレクトリのファイル ( #{source_path} ) のそれぞれについて(1つの場合もある)、テストが十分かどうか確認してほしい。テストファイルは同じディレクトリに拡張子.test.tsで存在する。(例: something.ts について something.test.tsが存在する) もしくは、存在しない場合もある。

  テストが存在し、十分である場合は before-step2に進む。
  存在しない場合は、step1に進む。

  </before-step1>

  <step1>
  ソースファイルのディレクトリのファイル ( #{source_path} ) のそれぞれについて(1つの場合もある)、テストがなければ拡充してほしい。
  **重要** テストファイルは、__tests__ディレクトリのようなものは新たに作らず、ソースファイルと同じディレクトリに.test.tsの拡張子で追加すること。
  例: something.ts について something.test.tsを追加する
  
  以下の要素を考慮して。
  
  - ソースファイルのimport設定を確認。同じパッケージ内の別ファイルからimportしている関数は、基本的にモックするようにする。
  
  また、つぎに示すtestコマンド、lintコマンド、fmtコマンドも通るようにして。
  
  $ pnpm --filter @liam-hq/#{package_dir} test
  $ HEAVY_LINT=1 pnpm --filter @liam-hq/#{package_dir} lint
  $ pnpm --filter @liam-hq/#{package_dir} fmt

  最後に、完了したら、git commitし、適切なコミットメッセージをつけて。コミットメッセージのどこかに、"refactor:step1" を含んで。
  finishに進んで。
  </step1>

  <before-step2>

  #{source_path} 内の .tsファイル(テストファイルではない)について、

  $ HEAVY_LINT=1 pnpm --filter @liam-hq/#{package_dir} lint

  を実行して違反するファイルがあるか？

  もしあるなら、step2に進む。
  そうでなければ、before-step3に進む。

  </before-step2>

  <step2>
  #{source_path} 挙動を変えずに、既存のlintとtestが通るようにリファクタリングして。

  lintは厳し目の設定にしてあるので注意。

  また、最後に示すfmtコマンドも通るようにして。

  ファイル分割等の仕様については、 @/directory-refactoring-guide.md を参考にして。

  $ pnpm --filter @liam-hq/#{package_dir} test
  $ HEAVY_LINT=1 pnpm --filter @liam-hq/#{package_dir} lint

  fmtには、以下を使って。

  $ pnpm --filter @liam-hq/#{package_dir} fmt

  最後に、完了したら、git commitし、適切なコミットメッセージをつけて。コミットメッセージのどこかに、"refactor:step2" を含んで。
  finishに進んで。
  </step2>

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


  <finish>
  処理を終了する。
  </finish>
EOF
