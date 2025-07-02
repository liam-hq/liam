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

EOF
